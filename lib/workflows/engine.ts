import "server-only";

import { can } from "@/lib/crm/context";
import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notifications";
import { generateText } from "@/lib/ai/gemini";
import { sendTransactionalEmail } from "@/lib/email/send";
import { autoRouteLead } from "@/lib/routing/routing";
import {
  createApprovalRequest,
  registerApprovalResumeHandler,
  expireOverdueApprovals,
} from "@/lib/approvals/engine";
import type {
  ActionNode,
  ApprovalNode,
  ConditionNode,
  ParallelNode,
  WorkflowDefinition,
  WorkflowEvent,
  WorkflowNode,
  WorkflowRunStatus,
  WorkflowRunView,
  WorkflowStatus,
  WorkflowTriggerType,
} from "./types";

/**
 * STEP 125 — Advanced workflow engine.
 *
 * Node-graph workflows: condition, action, delay, wait_until, approval,
 * parallel and end nodes over server-side execution. Every event run is
 * recorded in workflow_runs; every node in workflow_run_steps; delays and
 * waits as workflow_jobs; approval nodes pause the run and resume from the
 * approval engine (resume handler registered below).
 */

const MAX_DEPTH = 50;

interface WorkflowRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  allow_loops: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface RunContext {
  workflow: WorkflowRow;
  runId: string;
  subjectType: string | null;
  subjectId: string | null;
  payload: Record<string, unknown>;
  visited: string[];
  depth: number;
}

// ------------------------------------------------------------------
// CRUD
// ------------------------------------------------------------------

async function orgClient() {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) throw new Error("No active workspace");
  return { supabase, organizationId };
}

export async function getWorkflows(): Promise<{ workflows: WorkflowRow[]; canManage: boolean } | null> {
  const { supabase, organizationId } = await orgClient();
  const canManage = (await can("workflow.manage")) ?? false;
  const { data } = await supabase
    .from("workflows")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  return { workflows: (data ?? []) as WorkflowRow[], canManage };
}

async function requireWorkflowManage() {
  if (!(await can("workflow.manage"))) {
    throw new Error("You do not have permission to manage workflows");
  }
  return orgClient();
}

export interface WorkflowInput {
  name: string;
  description?: string;
  trigger_type: WorkflowTriggerType;
  definition: WorkflowDefinition;
  status?: WorkflowStatus;
  allow_loops?: boolean;
}

export async function createWorkflow(input: WorkflowInput): Promise<boolean> {
  const { supabase, organizationId } = await requireWorkflowManage();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("workflows").insert({
    organization_id: organizationId,
    name: input.name,
    description: input.description || null,
    trigger_type: input.trigger_type,
    definition: input.definition,
    status: input.status ?? "draft",
    allow_loops: input.allow_loops ?? false,
    created_by: user?.id ?? null,
  });
  return !error;
}

export async function updateWorkflow(id: string, input: Partial<WorkflowInput>): Promise<boolean> {
  const { supabase, organizationId } = await requireWorkflowManage();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.trigger_type !== undefined) patch.trigger_type = input.trigger_type;
  if (input.definition !== undefined) patch.definition = input.definition;
  if (input.status !== undefined) patch.status = input.status;
  if (input.allow_loops !== undefined) patch.allow_loops = input.allow_loops;
  const { error } = await supabase.from("workflows").update(patch).eq("id", id).eq("organization_id", organizationId);
  return !error;
}

export async function toggleWorkflow(id: string, status: "active" | "paused" | "archived"): Promise<boolean> {
  const { supabase, organizationId } = await requireWorkflowManage();
  const { error } = await supabase
    .from("workflows")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);
  return !error;
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const { supabase, organizationId } = await requireWorkflowManage();
  const { error } = await supabase.from("workflows").delete().eq("id", id).eq("organization_id", organizationId);
  return !error;
}

export async function getWorkflowRuns(workflowId?: string, limit = 30): Promise<WorkflowRunView[] | null> {
  const { supabase, organizationId } = await orgClient();
  const query = supabase
    .from("workflow_runs")
    .select("*, workflow:workflows(name)")
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false })
    .limit(limit);
  const finalQuery = workflowId ? query.eq("workflow_id", workflowId) : query;
  const { data } = await finalQuery;

  const views: WorkflowRunView[] = [];
  for (const r of (data ?? []) as any[]) {
    const { data: steps } = await supabase
      .from("workflow_run_steps")
      .select("node_id, node_type, status, error_message")
      .eq("run_id", r.id)
      .eq("organization_id", organizationId)
      .order("created_at");
    views.push({
      id: r.id,
      workflow_id: r.workflow_id,
      workflow_name: Array.isArray(r.workflow) ? r.workflow_id : (r.workflow?.name ?? r.workflow_id),
      trigger_event: r.trigger_event,
      subject_type: r.subject_type,
      subject_id: r.subject_id,
      status: r.status,
      node_path: r.node_path ?? [],
      error_message: r.error_message,
      started_at: r.started_at,
      completed_at: r.completed_at,
      steps: (steps ?? []).map((s: any) => ({
        node_id: s.node_id,
        node_type: s.node_type,
        status: s.status,
        error_message: s.error_message,
      })),
    });
  }
  return views;
}

// ------------------------------------------------------------------
// Execution helpers
// ------------------------------------------------------------------

/** Find a node by id, or the start node when null. */
function findNode(def: WorkflowDefinition, nodeId: string | null): WorkflowNode | null {
  if (!nodeId) return null;
  return def.nodes.find((n) => n.id === nodeId) ?? null;
}

function templateString(input: string, ctx: RunContext): string {
  return input.replace(/\{([\w.]+)\}/g, (_m, key: string) => {
    const parts = key.split(".");
    if (parts[0] === "subject") return parts[1];
    if (parts[0] === "payload") {
      let current: unknown = ctx.payload;
      for (const p of parts.slice(1)) {
        if (typeof current === "object" && current !== null) {
          current = (current as Record<string, unknown>)[p];
        } else {
          return "";
        }
      }
      return current === null || current === undefined ? "" : String(current);
    }
    return _m;
  });
}

async function recordStep(
  supabase: any,
  organizationId: string,
  runId: string,
  node: WorkflowNode,
  status: "running" | "completed" | "failed" | "skipped" | "waiting",
  errorMessage?: string,
): Promise<void> {
  await supabase.from("workflow_run_steps").insert({
    organization_id: organizationId,
    run_id: runId,
    node_id: node.id,
    node_type: node.type,
    status,
    input_payload: {},
    output_payload: errorMessage ? { error: errorMessage } : {},
    error_message: errorMessage ?? null,
  });
}

async function setRunStatus(
  supabase: any,
  organizationId: string,
  runId: string,
  status: WorkflowRunStatus,
  errorMessage?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "success" || status === "failed" || status === "cancelled") {
    patch.completed_at = new Date().toISOString();
  }
  if (errorMessage) patch.error_message = errorMessage?.slice(0, 2000);
  await supabase.from("workflow_runs").update(patch).eq("id", runId).eq("organization_id", organizationId);
}

// ------------------------------------------------------------------
// Node types
// ------------------------------------------------------------------

// 1) condition
async function handleCondition(supabase: any, organizationId: string, ctx: RunContext, node: ConditionNode): Promise<string | null> {
  const config = node.config;
  const actual = lookupField(ctx, config.field);
  const expected = config.value.trim().toLowerCase();
  const a = String(actual).toLowerCase();

  let match = false;
  if (config.operator === "=") match = a === expected;
  else if (config.operator === "!=") match = a !== expected;
  else if (config.operator === "in" || config.operator === "not in") {
    const items = expected.split(",").map((s) => s.trim()).filter(Boolean);
    const hit = items.includes(a);
    match = config.operator === "in" ? hit : !hit;
  } else {
    const an = Number(a);
    const en = Number(expected);
    if (!Number.isNaN(an) && !Number.isNaN(en)) {
      if (config.operator === ">") match = an > en;
      else if (config.operator === "<") match = an < en;
      else if (config.operator === ">=") match = an >= en;
      else if (config.operator === "<=") match = an <= en;
    }
  }
  return match ? config.next_if_true : config.next_if_false;
}

function lookupField(ctx: RunContext, field: string): string {
  if (field.startsWith("payload.")) {
    const parts = field.split(".").slice(1);
    let current: unknown = ctx.payload;
    for (const p of parts) {
      if (typeof current === "object" && current !== null) {
        current = (current as Record<string, unknown>)[p];
      } else {
        return "";
      }
    }
    return current === null || current === undefined ? "" : String(current);
  }
  if (field === "subject_type") return ctx.subjectType ?? "";
  if (field === "subject_id") return ctx.subjectId ?? "";
  if (field.startsWith("subject.")) return field.split(".")[1];
  return String(ctx.payload[field] ?? "");
}

// 2) action
async function handleAction(
  supabase: any,
  organizationId: string,
  ctx: RunContext,
  node: ActionNode,
): Promise<string | null> {
  const config = node.config;
  const { action } = config;

  let entity: Record<string, unknown> | null = null;
  if (ctx.subjectType && ctx.subjectId) {
    const { data } = await supabase
      .from(ctx.subjectType)
      .select("*")
      .eq("id", ctx.subjectId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    entity = data ?? null;
  }
  const entityRef = entity ?? {};

  switch (action) {
    case "create_task": {
      const assignTo = config.assign_to ? templateString(config.assign_to, ctx) : entityRef.owner_id ?? null;
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + (config.due_in_days ?? 0));
      await supabase.from("tasks").insert({
        organization_id: organizationId,
        title: templateString(config.task_title ?? "Follow up", ctx),
        description: config.task_note ? templateString(config.task_note, ctx) : null,
        owner_id: assignTo || null,
        due_at: (config.due_in_days ?? 0) > 0 ? dueAt.toISOString() : null,
        related_type: ctx.subjectType,
        related_id: ctx.subjectId,
      });
      break;
    }
    case "assign_owner": {
      const target = config.user_id ? templateString(config.user_id, ctx) : entityRef.owner_id ?? null;
      if (target && ctx.subjectType && ctx.subjectId) {
        await supabase
          .from(ctx.subjectType)
          .update({
            owner_id: target,
            previous_owner_id: entityRef.owner_id ?? null,
            assigned_at: new Date().toISOString(),
            assignment_reason: "Workflow",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ctx.subjectId)
          .eq("organization_id", organizationId);
      }
      break;
    }
    case "change_status": {
      if (config.status && ctx.subjectType && ctx.subjectId) {
        await supabase
          .from(ctx.subjectType)
          .update({ status: config.status, updated_at: new Date().toISOString() })
          .eq("id", ctx.subjectId)
          .eq("organization_id", organizationId);
      }
      break;
    }
    case "move_deal_stage": {
      if (config.stage_id && ctx.subjectType === "deals" && ctx.subjectId) {
        await supabase.rpc("move_deal_stage", {
          p_deal_id: ctx.subjectId,
          p_stage_id: config.stage_id,
          p_apply_probability: true,
        });
      }
      break;
    }
    case "notify": {
      const title = templateString(config.title ?? "Workflow notification", ctx);
      const message = templateString(config.message ?? "", ctx);
      if (config.user_ids?.length) {
        await notifyUsers({
          organizationId,
          userIds: config.user_ids.map((u: string) => templateString(u, ctx)),
          type: "workflow",
          title,
          message,
          relatedType: ctx.subjectType ?? undefined,
          relatedId: ctx.subjectId ?? undefined,
        });
      } else {
        await notifyUsers({
          organizationId,
          type: "workflow",
          title,
          message,
          relatedType: ctx.subjectType ?? undefined,
          relatedId: ctx.subjectId ?? undefined,
        });
      }
      break;
    }
    case "update_field": {
      if (config.field && ctx.subjectType && ctx.subjectId) {
        const field = config.field;
        const value = config.value ?? "";
        await supabase
          .from(ctx.subjectType)
          .update({ [field]: templateString(value, ctx), updated_at: new Date().toISOString() })
          .eq("id", ctx.subjectId)
          .eq("organization_id", organizationId);
      }
      break;
    }
    case "webhook": {
      if (config.url) {
        const url = templateString(config.url, ctx);
        const body = config.webhook_payload
          ? JSON.parse(templateString(config.webhook_payload, ctx) || "{}")
          : { event: ctx.workflow.trigger_type, subject_type: ctx.subjectType, subject_id: ctx.subjectId };
        await fetch(url, {
          method: config.method ?? "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        });
      }
      break;
    }
    case "ai_analysis": {
      const prompt = templateString(config.prompt ?? "Analyze this record", ctx);
      const subjectName = String(entityRef.name ?? entityRef.full_name ?? entityRef.id ?? ctx.subjectId ?? "");
      const input = JSON.stringify(ctx.payload).slice(0, 4000);
      const text = await generateText({
        prompt: `${prompt}\n\nSubject: ${subjectName}\nRecord: ${input}`,
        maxOutputTokens: 600,
      });
      if (config.store_as_field && ctx.subjectType && ctx.subjectId) {
        await supabase
          .from(ctx.subjectType)
          .update({ [config.store_as_field]: text, updated_at: new Date().toISOString() })
          .eq("id", ctx.subjectId)
          .eq("organization_id", organizationId);
      }
      break;
    }
    case "create_activity": {
      await supabase.from("activities").insert({
        organization_id: organizationId,
        activity_type: config.activity_type ?? "workflow",
        related_type: ctx.subjectType,
        related_id: ctx.subjectId,
        lead_id: ctx.subjectType === "leads" ? ctx.subjectId : null,
        deal_id: ctx.subjectType === "deals" ? ctx.subjectId : null,
        title: templateString(config.activity_title ?? "Workflow action", ctx),
        description: config.activity_description
          ? templateString(config.activity_description, ctx)
          : null,
        occurred_at: new Date().toISOString(),
      });
      break;
    }
    case "send_email": {
      const to = config.email_to ? templateString(config.email_to, ctx) : "";
      const toArr = to ? [to] : [];
      if (toArr.length) {
        await sendTransactionalEmail({
          organizationId,
          to: toArr,
          template: "generic_update",
          data: {
            name: String(entityRef.full_name ?? entityRef.name ?? "there").slice(0, 80),
            message: config.email_subject ? templateString(config.email_subject, ctx) : "You have an update",
          },
        });
      }
      break;
    }
    case "route_lead": {
      if (ctx.subjectType === "leads" && ctx.subjectId) {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .eq("id", ctx.subjectId)
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (data) {
          await autoRouteLead({
            id: data.id,
            organization_id: organizationId,
            source: data.source,
            country: data.country,
            city: data.city,
            industry: data.industry,
            company_size: data.company_size,
            account_type: data.account_type,
            interested_product: data.interested_product,
            expected_value: data.expected_value,
            score: data.score,
            owner_id: data.owner_id,
            company_name: data.company_name,
          });
        }
      }
      break;
    }
    case "add_tag": {
      if (config.tag && ctx.subjectType && ctx.subjectId) {
        const { data: tagRows } = await supabase
          .from("tags")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("name", config.tag);
        let tagId = tagRows?.[0]?.id ?? null;
        if (!tagId) {
          const { data: created } = await supabase
            .from("tags")
            .insert({ organization_id: organizationId, name: config.tag })
            .select("id")
            .single();
          tagId = created?.id ?? null;
        }
        if (tagId) {
          await supabase.from("record_tags").upsert(
            { organization_id: organizationId, tag_id: tagId, record_type: ctx.subjectType, record_id: ctx.subjectId },
            { onConflict: "tag_id,record_type,record_id" },
          );
        }
      }
      break;
    }
  }
  return node.next ?? null;
}

// ------------------------------------------------------------------
// Core execution
// ------------------------------------------------------------------

async function executeBlock(
  supabase: any,
  organizationId: string,
  ctx: RunContext,
  def: WorkflowDefinition,
  nodeId: string | null,
): Promise<{ next: string | null; status: "success" | "partial" | "failed" }> {
  if (!nodeId) return { next: null, status: "success" };
  const node = findNode(def, nodeId);
  if (!node) return { next: null, status: "partial" };

  if (ctx.depth > MAX_DEPTH || ctx.visited.includes(node.id)) {
    if (!ctx.workflow.allow_loops) {
      const err = `Loop detected at node "${node.id}" (allow_loops is off)`;
      await recordStep(supabase, organizationId, ctx.runId, node, "failed", err);
      await setRunStatus(supabase, organizationId, ctx.runId, "failed", err);
      return { next: null, status: "failed" };
    }
  }
  ctx.visited.push(node.id);
  ctx.depth += 1;

  switch (node.type) {
    case "end":
      await recordStep(supabase, organizationId, ctx.runId, node, "completed");
      return { next: null, status: "success" };

    case "condition": {
      await recordStep(supabase, organizationId, ctx.runId, node, "completed");
      const nextId = await handleCondition(supabase, organizationId, ctx, node);
      return executeBlock(supabase, organizationId, ctx, def, nextId);
    }

    case "action": {
      try {
        const nextId = await handleAction(supabase, organizationId, ctx, node);
        await recordStep(supabase, organizationId, ctx.runId, node, "completed");
        return executeBlock(supabase, organizationId, ctx, def, nextId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Action failed";
        await recordStep(supabase, organizationId, ctx.runId, node, "failed", message);
        await setRunStatus(supabase, organizationId, ctx.runId, "failed", message);
        return { next: null, status: "failed" };
      }
    }

    case "delay": {
      await recordStep(supabase, organizationId, ctx.runId, node, "waiting");
      const executeAt = new Date(Date.now() + (node.config.minutes || 0) * 60_000).toISOString();
      await supabase.from("workflow_jobs").insert({
        organization_id: organizationId,
        workflow_id: ctx.workflow.id,
        run_id: ctx.runId,
        node_id: node.id,
        execute_at: executeAt,
        status: "pending",
        payload: { kind: "advance", next: node.config.next, subject_id: ctx.subjectId },
      });
      await setRunStatus(supabase, organizationId, ctx.runId, "waiting");
      return { next: null, status: "partial" };
    }

    case "wait_until": {
      await recordStep(supabase, organizationId, ctx.runId, node, "waiting");
      const at = lookupField(ctx, node.config.at_field);
      const atTime = at ? new Date(at).getTime() : Date.now();
      await supabase.from("workflow_jobs").insert({
        organization_id: organizationId,
        workflow_id: ctx.workflow.id,
        run_id: ctx.runId,
        node_id: node.id,
        execute_at: new Date(atTime).toISOString(),
        status: "pending",
        payload: { kind: "advance", next: node.config.next, subject_id: ctx.subjectId },
      });
      await setRunStatus(supabase, organizationId, ctx.runId, "waiting");
      return { next: null, status: "partial" };
    }

    case "approval": {
      await recordStep(supabase, organizationId, ctx.runId, node, "waiting");
      const approval = node as ApprovalNode;
      const created = await createApprovalRequest({
        subject: "ai_action",
        subjectId: ctx.subjectId,
        subjectSummary: approval.config.title ?? `Workflow "${ctx.workflow.name}" requires approval`,
        payload: { ...ctx.payload, workflow: ctx.workflow.name },
        policyOverride: approval.config.policy_id ?? undefined,
        workflowRunId: ctx.runId,
        workflowNodeId: node.id,
      });
      if (created) {
        await setRunStatus(supabase, organizationId, ctx.runId, "awaiting_approval");
        return { next: null, status: "partial" };
      }
      await recordStep(supabase, organizationId, ctx.runId, node, "skipped");
      // No matching policy → skip the gate and continue.
      const nextId = approval.config.next_if_approved ?? null;
      await setRunStatus(supabase, organizationId, ctx.runId, "running");
      return executeBlock(supabase, organizationId, ctx, def, nextId);
    }

    case "parallel": {
      await recordStep(supabase, organizationId, ctx.runId, node, "completed");
      const pnode = node as ParallelNode;
      let worst: "success" | "partial" | "failed" = "success";
      for (const branch of pnode.config.branches) {
        for (const branchNodeId of branch) {
          const result = await executeBlock(supabase, organizationId, ctx, def, branchNodeId);
          if (result.status === "failed") worst = "failed";
          else if (result.status === "partial" && worst !== "failed") worst = "partial";
        }
      }
      if (worst === "partial") return { next: null, status: "partial" };
      if (worst === "failed") return { next: null, status: "failed" };
      return executeBlock(supabase, organizationId, ctx, def, pnode.config.next);
    }

    default:
      return { next: null, status: "partial" };
  }
}

// ------------------------------------------------------------------
// Entry points
// ------------------------------------------------------------------

/** Create a run for a workflow + event, then execute it. */
export async function startWorkflowRun(workflow: WorkflowRow, event: WorkflowEvent): Promise<string | null> {
  const { supabase, organizationId } = await orgClient();
  const subjectType = event.subjectType ?? null;
  const subjectId = event.subjectId ?? null;

  const { data: run, error } = await supabase
    .from("workflow_runs")
    .insert({
      organization_id: organizationId,
      workflow_id: workflow.id,
      trigger_event: event.type,
      subject_type: subjectType,
      subject_id: subjectId,
      status: "running",
      node_path: [],
      payload: event.payload ?? {},
    })
    .select("id")
    .single();
  if (error || !run) return null; // duplicate active run or missing subject

  const def: WorkflowDefinition = workflow.definition ?? { start: "", nodes: [] };
  const ctx: RunContext = {
    workflow,
    runId: run.id,
    subjectType,
    subjectId,
    payload: event.payload ?? {},
    visited: [],
    depth: 0,
  };

  try {
    const result = await executeBlock(supabase, organizationId, ctx, def, def.start);
    await supabase
      .from("workflow_runs")
      .update({ node_path: ctx.visited })
      .eq("id", run.id)
      .eq("organization_id", organizationId);
    if (result.status === "failed") {
      // run status already set by executeBlock on failure
    } else if (result.status === "partial") {
      // run status set to waiting/awaiting_approval by node handlers
      const { data: runRow } = await supabase
        .from("workflow_runs")
        .select("status")
        .eq("id", run.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (!runRow || runRow.status === "running") {
        await setRunStatus(supabase, organizationId, run.id, "success");
      }
    } else {
      await setRunStatus(supabase, organizationId, run.id, "success");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workflow execution failed";
    await setRunStatus(supabase, organizationId, run.id, "failed", message);
  }
  return run.id;
}

/** Resume a waiting run from a scheduled job or an approval decision. */
export async function resumeWorkflow(input: { runId: string; nodeId: string; outcome?: "approved" | "rejected" }): Promise<void> {
  const { supabase, organizationId } = await orgClient();
  const { data: run } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("id", input.runId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!run || run.status === "success" || run.status === "failed" || run.status === "cancelled") return;

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", run.workflow_id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!workflow) return;

  await setRunStatus(supabase, organizationId, run.id, "running");

  const def: WorkflowDefinition = workflow.definition ?? { start: "", nodes: [] };
  const node = findNode(def, input.nodeId);
  let nextId: string | null = def.start;

  if (node) {
    if (node.type === "approval") {
      nextId =
        input.outcome === "approved"
          ? node.config.next_if_approved ?? null
          : node.config.next_if_rejected ?? null;
    } else if (node.type === "delay" || node.type === "wait_until") {
      nextId = node.config.next ?? null;
    } else if (node.type === "action") {
      nextId = node.next ?? null;
    }
  }

  const ctx: RunContext = {
    workflow: workflow as WorkflowRow,
    runId: run.id,
    subjectType: run.subject_type,
    subjectId: run.subject_id,
    payload: run.payload ?? {},
    visited: Array.isArray(run.node_path) ? run.node_path : [],
    depth: 0,
  };

  const result = await executeBlock(supabase, organizationId, ctx, def, nextId);

  await supabase
    .from("workflow_runs")
    .update({ node_path: ctx.visited })
    .eq("id", run.id)
    .eq("organization_id", organizationId);

  if (result.status === "success") {
    await setRunStatus(supabase, organizationId, run.id, "success");
  } else if (result.status === "partial") {
    const { data: runRow } = await supabase
      .from("workflow_runs")
      .select("status")
      .eq("id", run.id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (!runRow || runRow.status === "running") {
      await setRunStatus(supabase, organizationId, run.id, "success");
    }
  }
}

registerApprovalResumeHandler((args) =>
  resumeWorkflow({ runId: args.runId, nodeId: args.nodeId, outcome: args.outcome }),
);

/** Process due workflow jobs (delay/wait) and expire stale approvals. */
export async function processDueJobs(limit = 20): Promise<number> {
  const { supabase, organizationId } = await orgClient();
  const now = new Date().toISOString();

  const { data: jobs } = await supabase
    .from("workflow_jobs")
    .select("id, workflow_id, run_id, node_id, execute_at, status, attempt_count, max_attempts, payload")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .lte("execute_at", now)
    .limit(limit);

  for (const job of jobs ?? []) {
    await supabase
      .from("workflow_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", job.id)
      .eq("organization_id", organizationId);

    try {
      await resumeWorkflow({ runId: job.run_id, nodeId: job.node_id });
      await supabase
        .from("workflow_jobs")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", job.id)
        .eq("organization_id", organizationId);
    } catch (err) {
      const nextAttempt = (job.attempt_count ?? 0) + 1;
      const message = err instanceof Error ? err.message : "Job failed";
      const failed = nextAttempt >= (job.max_attempts ?? 3);
      await supabase
        .from("workflow_jobs")
        .update({
          status: failed ? "failed" : "pending",
          attempt_count: nextAttempt,
          last_error: message?.slice(0, 2000),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("organization_id", organizationId);
    }
  }

  let expired = 0;
  try {
    expired = await expireOverdueApprovals();
  } catch {
    expired = 0;
  }
  return (jobs?.length ?? 0) + expired;
}

export async function runWorkflowManually(workflowId: string, payload?: Record<string, unknown>): Promise<boolean> {
  const { supabase, organizationId } = await orgClient();
  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", workflowId)
    .eq("organization_id", organizationId)
    .eq("trigger_type", "manual")
    .maybeSingle();
  if (!workflow) return false;
  const runId = await startWorkflowRun(workflow as WorkflowRow, {
    type: "manual",
    subjectType: null,
    subjectId: null,
    payload: payload ?? {},
  });
  return Boolean(runId);
}