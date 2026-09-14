"use server";

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import type { CrmAutomation } from "@/lib/types";

/**
 * Core engine: given a CRM event, find matching active automations and trigger them.
 * Returns the automation ID that was triggered, or "" if none.
 */
export async function evaluateAutomations(
  event: {
    type: string;
    recordType: "lead" | "deal" | "contact" | "task" | "invoice";
    recordId: string;
    organizationId: string;
    actorUserId: string;
    payload?: Record<string, unknown>;
  }
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const orgId = event.organizationId || (await getActiveOrgId(supabase));

  if (!orgId) {
    throw new Error("No active organization found");
  }

  // 1. Find active automations for this organization matching the trigger type
  const { data: automations, error } = await supabase
    .from("automations")
    .select("*")
    .eq("organization_id", orgId)
    .eq("trigger_type", event.type)
    .eq("status", "active");

  if (error || !automations || automations.length === 0) return "";

  // 2. Trigger each automation (fire-and-forget)
  const triggerPromises = automations.map((automation) =>
    triggerAutomation(automation, event, supabase, event.actorUserId)
  );

  // Don't block the caller; just fire and log any errors
  Promise.allSettled(triggerPromises).catch((e) =>
    console.error("Automation trigger error:", e)
  );

  // Return the first automation's ID that was triggered
  return automations[0].id;
}

/**
 * Trigger a single automation: evaluate conditions, execute actions, log run.
 * actorUserId is passed explicitly to avoid scope issues.
 * supabase is the already-awaited client from evaluateAutomations.
 */
async function triggerAutomation(
  automation: CrmAutomation,
  event: {
    type: string;
    recordType: "lead" | "deal" | "contact" | "task" | "invoice";
    recordId: string;
    organizationId: string;
  },
  supabase: any,
  actorUserId: string,
) {
  // 1. Log the run start
  const { error: runErr, data: run } = await supabase
    .from("automation_runs")
    .insert({
      organization_id: event.organizationId,
      automation_id: automation.id,
      trigger_event: event.type,
      trigger_record_type: event.recordType,
      trigger_record_id: event.recordId,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (runErr) {
    console.error("Automation run insert error:", runErr);
    return;
  }

  // 2. Evaluate conditions against the CRM record
  const conditions: Array<{ field: string; operator: string; value: string }> =
    automation.conditions || [];
  let conditionsPassed = true;

  if (conditions.length > 0) {
    conditionsPassed = await evaluateConditionsDB(
      conditions,
      event.recordType,
      event.recordId,
      supabase
    );
  }

  // 3. If conditions don't pass, mark run as skipped
  if (!conditionsPassed) {
    await supabase
      .from("automation_runs")
      .update({ status: "skipped", completed_at: new Date().toISOString() })
      .eq("id", run.id);

    await supabase.from("automation_run_steps").insert({
      id: crypto.randomUUID(),
      run_id: run.id,
      action_type: "condition_evaluation",
      status: "completed",
      input_payload: { conditions, conditions_passed: false },
      output_payload: { reason: "conditions_not_met" },
      created_at: new Date().toISOString(),
    });
    return;
  }

  // 4. Execute actions sequentially
  const actions: Array<{ id: string; type: string; target: string; value: string }> =
    automation.actions || [];
  const results: Array<{ actionType: string; success: boolean; error?: string }> = [];

  for (const action of actions) {
    try {
      const result = await executeActionSafe(
        action,
        event.recordType,
        event.recordId,
        event.organizationId,
        supabase,
        actorUserId
      );
      results.push({ actionType: action.type, success: true, ...result });
    } catch (err: any) {
      console.error(`Automation action ${action.type} error:`, err);
      results.push({ actionType: action.type, success: false, error: err.message });
    }
  }

  // 5. Log the run completion
  const completedAt = new Date().toISOString();
  const successfulCount = results.filter((r) => r.success).length;

  await supabase
    .from("automation_runs")
    .update({
      status:
        successfulCount === results.length
          ? "success"
          : successfulCount > 0
          ? "partial"
          : "failed",
      completed_at: completedAt,
      error_message:
        successfulCount < results.length
          ? results
              .filter((r) => !r.success)
              .map((r) => r.error!)
              .join("; ")
          : null,
    })
    .eq("id", run.id);

  // 6. Log each action's result
  for (const result of results) {
    await supabase.from("automation_run_steps").insert({
      id: crypto.randomUUID(),
      run_id: run.id,
      action_type: result.actionType,
      status: result.success ? "completed" : "failed",
      input_payload: { automation_id: automation.id, event_type: event.type },
      output_payload: result.success ? { result: "executed" } : null,
      error_message: result.error ?? null,
      created_at: completedAt,
    });
  }

  // 7. Update automation run counter
  await supabase
    .from("automations")
    .update({ run_count: (automation.runsCount ?? 0) + 1, last_run_at: completedAt })
    .eq("id", automation.id);
}

/**
 * Evaluate conditions against the CRM record in the database.
 * Supports operators: =, !=, >, <, >=, <=, contains, not contains
 */
async function evaluateConditionsDB(
  conditions: Array<{ field: string; operator: string; value: string }>,
  recordType: "lead" | "deal" | "contact" | "task" | "invoice",
  recordId: string,
  supabase: any,
): Promise<boolean> {
  // Fetch the relevant record data
  const fetchMap: Record<string, string> = {
    lead: "leads",
    deal: "deals",
    contact: "contacts",
  };

  const table = fetchMap[recordType];
  if (!table) return true; // cannot evaluate, default to pass

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", recordId)
    .single();

  if (error || !data) {
    // If we can't fetch the record, default to conditions passing
    return true;
  }

  const recordData = data as Record<string, unknown>;

  // Evaluate each condition (AND logic – all must pass)
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const recordValue = recordData[field];

    let passes = false;

    switch (operator) {
      case "=":
        passes = String(recordValue) === String(value);
        break;
      case "!=":
        passes = String(recordValue) !== String(value);
        break;
      case ">":
        const n1 = Number(recordValue);
        const n2 = Number(value);
        if (!isNaN(n1 as number) && !isNaN(n2 as number)) passes = (n1 as number) > (n2 as number);
        break;
      case "<":
        const n3 = Number(recordValue);
        const n4 = Number(value);
        if (!isNaN(n3 as number) && !isNaN(n4 as number)) passes = (n3 as number) < (n4 as number);
        break;
      case ">=":
        const n5 = Number(recordValue);
        const n6 = Number(value);
        if (!isNaN(n5 as number) && !isNaN(n6 as number)) passes = (n5 as number) >= (n6 as number);
        break;
      case "<=":
        const n7 = Number(recordValue);
        const n8 = Number(value);
        if (!isNaN(n7 as number) && !isNaN(n8 as number)) passes = (n7 as number) <= (n8 as number);
        break;
      case "contains":
        passes = String(recordValue).includes(String(value));
        break;
      case "not contains":
        passes = !String(recordValue).includes(String(value));
        break;
      default:
        passes = false;
    }

    if (!passes) return false;
  }

  return true;
}

/**
 * Execute a single automation action safely.
 * Returns a partial result object spread into the run completion update.
 * actorUserId is passed for activity metadata.
 */
async function executeActionSafe(
  action: {
    id: string;
    type: string;
    target: string;
    value: string;
    config?: Record<string, unknown>;
  },
  recordType: "lead" | "deal" | "contact" | "task" | "invoice",
  recordId: string,
  organizationId: string,
  supabase: any,
  actorUserId: string,
) {
  // config is optional; default to empty object
  const config = action.config ?? {};

  switch (action.type) {
    case "create_task": {
      const title = config.title ?? `Follow up on ${recordType}`;
      const priority = config.priority ?? "Medium";
      const dueMinutes = config.due_minutes !== undefined ? Number(config.due_minutes) : 0;
      const dueAt = dueMinutes > 0 ? new Date(Date.now() + dueMinutes * 60 * 1000) : null;

      const { error } = await supabase
        .from("tasks")
        .insert({
          title,
          description: config.description,
          priority,
          status: "Open",
          due_at: dueAt,
          owner_id: config.owner_id,
          related_type: recordType,
          related_id: recordId,
          organization_id: organizationId,
        });

      if (error) throw error;

      // Also create activity
      await supabase.from("activities").insert({
        organization_id: organizationId,
        activity_type: "task_created",
        related_type: recordType,
        related_id: recordId,
        title,
        description: config.description,
        actor_user_id: actorUserId,
        metadata: { automation_id: action.id },
        occurred_at: new Date().toISOString(),
      });

      return {};
    }

    case "assign_owner": {
      const targetUser = config.user_id ?? action.value;

      if (targetUser && targetUser !== "placeholder") {
        // Update the record's owner
        let table: string;
        if (recordType === "lead") table = "leads";
        else if (recordType === "deal") table = "deals";
        else if (recordType === "contact") table = "contacts";
        else throw new Error(`Unsupported record type for assign_owner: ${recordType}`);

        const { error } = await supabase
          .from(table)
          .update({ owner_id: targetUser })
          .eq("id", recordId);

        if (error) throw error;

        // Create activity
        await supabase.from("activities").insert({
          organization_id: organizationId,
          activity_type: "owner_assigned",
          related_type: recordType,
          related_id: recordId,
          title: "Owner assigned",
          description: `Automation assigned owner to ${recordType}`,
          actor_user_id: actorUserId,
          metadata: { automation_id: action.id },
          occurred_at: new Date().toISOString(),
        });
      }

      return {};
    }

    case "change_status": {
      const newStatus = config.new_status ?? action.value;

      let table: string;
      if (recordType === "lead") table = "leads";
      else if (recordType === "deal") table = "deals";
      else if (recordType === "contact") table = "contacts";
      else throw new Error(`Unsupported record type for change_status: ${recordType}`);

      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq("id", recordId);

      if (error) throw error;

      // Create activity
      await supabase.from("activities").insert({
        organization_id: organizationId,
        activity_type: "status_changed",
        related_type: recordType,
        related_id: recordId,
        title: "Status changed",
        description: `Automation changed status to ${newStatus}`,
        actor_user_id: actorUserId,
        metadata: { automation_id: action.id, new_status: newStatus },
        occurred_at: new Date().toISOString(),
      });

      // Emit event for other automations to react to
      await emitCrmEvent({
        type: `${recordType}_status_changed`,
        organizationId: organizationId,
        actorUserId,
        recordType,
        recordId,
        payload: { old_status: "", new_status: newStatus },
      });

      return {};
    }

    case "move_deal_stage": {
      const stageId = config.stageId;

      if (!stageId) throw new Error("move_deal_stage requires stageId in config");

      let table: string;
      if (recordType === "deal") table = "deals";
      else throw new Error(`move_deal_stage only supported for deals, got ${recordType}`);

      const { error } = await supabase
        .from(table)
        .update({ stage_id: stageId })
        .eq("id", recordId);

      if (error) throw error;

      // Create activity
      await supabase.from("activities").insert({
        organization_id: organizationId,
        activity_type: "deal_stage_changed",
        related_type: recordType,
        related_id: recordId,
        title: "Deal stage changed",
        description: `Automation moved deal to stage ${stageId}`,
        actor_user_id: actorUserId,
        metadata: { automation_id: action.id, stage_id: stageId },
        occurred_at: new Date().toISOString(),
      });

      // Emit event
      await emitCrmEvent({
        type: "deal.stage_changed",
        organizationId: organizationId,
        actorUserId,
        recordType: "deal",
        recordId,
        payload: { old_stage_id: "", new_stage_id: stageId },
      });

      return {};
    }

    case "add_tag": {
      const tagName = config.tag_name ?? action.value;

      let table: string;
      if (recordType === "lead") table = "leads";
      else if (recordType === "deal") table = "deals";
      else if (recordType === "contact") table = "contacts";
      else throw new Error(`Unsupported record type for add_tag: ${recordType}`);

      // Insert into record_tags junction table
      const { error } = await supabase
        .from("record_tags")
        .insert({
          organization_id: organizationId,
          record_type: recordType,
          record_id: recordId,
          tag: tagName,
        });

      if (error) throw error;

      // Create activity
      await supabase.from("activities").insert({
        organization_id: organizationId,
        activity_type: "tag_added",
        related_type: recordType,
        related_id: recordId,
        title: "Tag added",
        description: `Automation added tag "${tagName}"`,
        actor_user_id: actorUserId,
        metadata: { automation_id: action.id, tag: tagName },
        occurred_at: new Date().toISOString(),
      });

      return {};
    }

    case "create_notification": {
      const title = config.title ?? "Automation notification";
      const message = config.message ?? "An automation trigger occurred";
      const relType = config.related_type ?? recordType;
      const relId = config.related_id ?? recordId;

      const { error } = await supabase.from("notifications").insert({
        organization_id: organizationId,
        user_id: config.user_id ?? "",
        type: "automation",
        title,
        message,
        related_type: relType,
        related_id: relId,
        is_read: false,
      });

      if (error) throw error;

      return {};
    }

    case "create_activity": {
      const activityType = config.activity_type ?? "automation_action";
      const title = config.title ?? "Automation action";
      const description = config.description;

      const { error } = await supabase.from("activities").insert({
        organization_id: organizationId,
        activity_type: activityType,
        related_type: recordType,
        related_id: recordId,
        title,
        description,
        actor_user_id: actorUserId,
        metadata: { automation_id: action.id },
        occurred_at: new Date().toISOString(),
      });

      if (error) throw error;

      return {};
    }

    case "update_field": {
      const field = config.field;

      if (!field) throw new Error("update_field requires a field config");

      let table: string;
      if (recordType === "lead") table = "leads";
      else if (recordType === "deal") table = "deals";
      else if (recordType === "contact") table = "contacts";
      else throw new Error(`Unsupported record type for update_field: ${recordType}`);

      const { error } = await supabase
        .from(table)
        .update({ [field as string]: config.new_value })
        .eq("id", recordId);

      if (error) throw error;

      // Create activity
      await supabase.from("activities").insert({
        organization_id: organizationId,
        activity_type: "field_updated",
        related_type: recordType,
        related_id: recordId,
        title: "Field updated",
        description: `Automation updated ${field} to ${String(config.new_value)}`,
        actor_user_id: actorUserId,
        metadata: {
          automation_id: action.id,
          field,
          new_value: String(config.new_value),
        },
        occurred_at: new Date().toISOString(),
      });

      // Emit event
      await emitCrmEvent({
        type: `${recordType}_updated`,
        organizationId: organizationId,
        actorUserId,
        recordType,
        recordId,
        payload: { field, new_value: String(config.new_value) },
      });

      return {};
    }

    default:
      console.warn(`Unknown automation action type: ${action.type}`);
      return { success: false, error: `Unknown action type: ${action.type}` };
  }
}

/**
 * Emit a CRM event that the automation engine can listen to.
 * Used by CRM mutations (create lead, move deal stage, complete task, etc.).
 */
async function emitCrmEvent(
  crmEvent: {
    type: string;
    organizationId: string;
    actorUserId: string;
    recordType: string;
    recordId: string;
    payload: Record<string, unknown>;
  }
) {
  const supabase = await createSupabaseServerClient();

  // Log the event in automation_runs for audit purposes
  // Use a null/zero automation_id to indicate a system-level event
try {
    await supabase.from("automation_runs").insert({
      organization_id: crmEvent.organizationId,
      automation_id: "00000000-0000-0000-0000-000000000000" as unknown as string,
      trigger_event: crmEvent.type,
      trigger_record_type: crmEvent.recordType,
      trigger_record_id: crmEvent.recordId,
      status: "success",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error_message: null,
    });
  } catch (e) {
    console.error("Failed to log CRM event in automation_runs:", e);
  }
}