import "server-only";

import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  AiAgent,
  AiAgentPermission,
  AgentStatus,
  AgentType,
  ApprovalMode,
} from "@/lib/types";

export interface AiAgentsView {
  agents: AiAgent[];
  total: number;
  active: number;
  paused: number;
  pendingApprovals: number;
}

const AGENT_TYPES: readonly AgentType[] = [
  "Lead",
  "Sales",
  "Customer Success",
  "Support",
  "Finance",
];
const AGENT_STATUSES: readonly AgentStatus[] = ["Active", "Paused", "Archived", "Error"];
const APPROVAL_MODES: readonly ApprovalMode[] = [
  "Draft Only",
  "Ask Before Action",
  "Auto-Execute Allowed Actions",
];

function castType(value: string | null): AgentType {
  return AGENT_TYPES.includes(value as AgentType) ? (value as AgentType) : "Sales";
}

function castStatus(value: string | null): AgentStatus {
  return AGENT_STATUSES.includes(value as AgentStatus) ? (value as AgentStatus) : "Active";
}

function castApprovalMode(value: string | null): ApprovalMode {
  return APPROVAL_MODES.includes(value as ApprovalMode) ? (value as ApprovalMode) : "Ask Before Action";
}

function normalizePermissions(value: unknown): AiAgentPermission[] {
  if (!Array.isArray(value)) return [];
  const out: AiAgentPermission[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const object = String((item as { object?: unknown }).object ?? "").trim();
    if (!object) continue;
    const level = (item as { level?: unknown }).level;
    const levelText =
      typeof level === "string" && ["Read", "Read + Write", "Execute"].includes(level)
        ? (level as AiAgentPermission["level"])
        : "Read";
    out.push({ object, level: levelText });
  }
  return out;
}

function timeAgo(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const elapsed = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return undefined;
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Empty view returned when Supabase is unavailable or there is no org. */
function emptyView(): AiAgentsView {
  return { agents: [], total: 0, active: 0, paused: 0, pendingApprovals: 0 };
}

/**
 * Server-fetched AI agents (Steps onward). Reads ai_agents with per-agent
 * pending ai_approvals and today's ai_recommendations so cards and the
 * table show live counts. Returns an empty view when Supabase is not
 * configured so pages can fall back to mocks.
 */
export async function getAiAgents(): Promise<AiAgentsView> {
  if (!isSupabaseConfigured()) return emptyView();

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return emptyView();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [{ data: rows }, { data: approvals }, { data: recommendations }] = await Promise.all([
    supabase
      .from("ai_agents")
      .select("id, name, agent_type, purpose, status, approval_mode, permissions, last_activity_at")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("ai_approvals")
      .select("agent_id")
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("ai_recommendations")
      .select("agent_id")
      .eq("organization_id", organizationId)
      .gte("created_at", today.toISOString()),
  ]);

  const pendingByAgent: Record<string, number> = {};
  for (const row of approvals ?? []) {
    if (row.agent_id) pendingByAgent[row.agent_id] = (pendingByAgent[row.agent_id] ?? 0) + 1;
  }

  const actionsByAgent: Record<string, number> = {};
  for (const row of recommendations ?? []) {
    if (row.agent_id) actionsByAgent[row.agent_id] = (actionsByAgent[row.agent_id] ?? 0) + 1;
  }

  const agents: AiAgent[] = (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: castType(row.agent_type),
    purpose: row.purpose || "AI workflow agent.",
    status: castStatus(row.status),
    approvalMode: castApprovalMode(row.approval_mode),
    actionsToday: actionsByAgent[row.id] ?? 0,
    pendingApprovals: pendingByAgent[row.id] ?? 0,
    permissions: normalizePermissions(row.permissions),
    lastActivity: timeAgo(row.last_activity_at),
  }));

  let active = 0;
  let paused = 0;
  let pendingApprovals = 0;
  for (const agent of agents) {
    if (agent.status === "Active") active += 1;
    if (agent.status === "Paused") paused += 1;
    pendingApprovals += agent.pendingApprovals;
  }

  return { agents, total: agents.length, active, paused, pendingApprovals };
}