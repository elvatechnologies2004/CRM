"use server";

import "server-only";

import { createSupabaseServerClient } from "./server";
import type { CrmAutomation } from "@/lib/types";

/**
 * Fetch all automations for the current organization.
 */
export async function fetchAutomations() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { automations: [], error: "Not authenticated" };
  }

  // Get the user's active organization
  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (memError || !membership) {
    return { automations: [], error: "No active organization" };
  }

  const orgId = membership.organization_id;

  // Fetch automations for this organization
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return { automations: [], error: error.message };
  }

  return { automations: data as CrmAutomation[], error: null };
}

/**
 * Create a new automation
 */
export async function createAutomation(
  automation: {
    name: string;
    description?: string;
    trigger: string;
    conditions?: Array<{ field: string; operator: string; value: string }>;
    actions?: Array<{ id: string; type: string; target: string; value: string; config?: Record<string, unknown> }>;
    status?: "draft" | "active" | "paused";
  }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the user's active organization
  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (memError || !membership) {
    return { error: "No active organization" };
  }

  const orgId = membership.organization_id;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("automations")
    .insert({
      organization_id: orgId,
      name: automation.name,
      description: automation.description,
      trigger_type: automation.trigger,
      status: automation.status ?? "draft",
      created_by: user.id,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Insert trigger
  if (automation.trigger) {
    await supabase.from("automation_triggers").insert({
      automation_id: data.id,
      trigger_type: automation.trigger,
      event_config: {},
    });
  }

  // Insert conditions if provided
  if (automation.conditions && automation.conditions.length > 0) {
    const conditionRows = automation.conditions.map((c) => ({
      automation_id: data.id,
      field: c.field,
      operator: c.operator,
      value: JSON.stringify(c.value),
      logic: "and",
    }));
    await supabase.from("automation_conditions").insert(conditionRows);
  }

  // Insert actions if provided
  if (automation.actions && automation.actions.length > 0) {
    const actionRows = automation.actions.map((a) => ({
      automation_id: data.id,
      action_type: a.type,
      config: a.config ?? {},
      target_type: "record",
    }));
    await supabase.from("automation_actions").insert(actionRows);
  }

  return { automation: data, error: null };
}

/**
 * Update an existing automation
 */
export async function updateAutomation(
  id: string,
  updates: {
    name?: string;
    description?: string;
    status?: "draft" | "active" | "paused";
    conditions?: Array<{ field: string; operator: string; value: string }>;
    actions?: Array<{ id: string; type: string; target: string; value: string; config?: Record<string, unknown> }>;
  }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the user's active organization
  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (memError || !membership) {
    return { error: "No active organization" };
  }

  const orgId = membership.organization_id;
  const now = new Date().toISOString();

  // Update the automation
  const { error: updErr } = await supabase
    .from("automations")
    .update({
      name: updates.name,
      description: updates.description,
      status: updates.status,
      updated_at: now,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (updErr) {
    return { error: updErr.message };
  }

  // Conditions are replaced (delete and re-insert)
  if (updates.conditions !== undefined) {
    // Delete existing conditions
    await supabase.from("automation_conditions").delete().eq("automation_id", id);

    // Insert new conditions
    if (updates.conditions.length > 0) {
      const conditionRows = updates.conditions.map((c) => ({
        automation_id: id,
        field: c.field,
        operator: c.operator,
        value: JSON.stringify(c.value),
        logic: "and",
      }));
      await supabase.from("automation_conditions").insert(conditionRows);
    }
  }

  // Actions are replaced (delete and re-insert)
  if (updates.actions !== undefined) {
    // Delete existing actions
    await supabase.from("automation_actions").delete().eq("automation_id", id);

    // Insert new actions
    if (updates.actions.length > 0) {
      const actionRows = updates.actions.map((a) => ({
        automation_id: id,
        action_type: a.type,
        config: a.config ?? {},
        target_type: "record",
      }));
      await supabase.from("automation_actions").insert(actionRows);
    }
  }

  // Fetch updated automation
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { automation: data, error: null };
}

/**
 * Delete/Archive an automation
 */
export async function deleteAutomation(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the user's active organization
  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (memError || !membership) {
    return { error: "No active organization" };
  }

  const orgId = membership.organization_id;

  // Soft archive: set status to archived
  const { error } = await supabase
    .from("automations")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    return { error: error.message };
  }

  // Also archive related runs (set status to cancelled)
  await supabase.from("automation_runs").update({ status: "cancelled" }).eq("automation_id", id);

  return { success: true, error: null };
}

/**
 * Toggle automation status (Active <-> Paused)
 */
export async function toggleAutomationStatus(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the user's active organization
  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (memError || !membership) {
    return { error: "No active organization" };
  }

  const orgId = membership.organization_id;

  // Get current automation
  const { data: automation, error: autoErr } = await supabase
    .from("automations")
    .select("status")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (autoErr) {
    return { error: autoErr.message };
  }

  // Toggle status
  const currentStatus = automation.status;
  const newStatus = currentStatus === "Active" ? "Paused" : "Active";

  const { error } = await supabase
    .from("automations")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    return { error: error.message };
  }

  return { success: true, newStatus, error: null };
}