import "server-only";

import { can } from "@/lib/crm/context";
import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notifications";

/**
 * STEP 124 — Advanced approval engine.
 *
 * Policies define WHEN approval is required (criteria) and HOW it
 * resolves (single / any_one / multiple / sequential / all_required).
 * Requests materialize one row per approver in approval_steps and log
 * every decision to approval_actions. Approvers may only act on their
 * own pending steps; admins (approval.manage) may act on any.
 *
 * A workflow engine can attach to requests: when a request resolves the
 * registered resume handler wakes the waiting workflow run.
 */

export type ApprovalSubject =
  | "deal"
  | "lead"
  | "quote"
  | "invoice"
  | "refund"
  | "contract"
  | "ai_action"
  | "record_delete"
  | "generic";

export type ApprovalType = "single" | "multiple" | "sequential" | "any_one" | "all_required";

export interface ApprovalCriteriaRule {
  field: string;
  operator: "=" | "!=" | "in" | "not in" | ">" | "<" | ">=" | "<=";
  value: string;
}

export interface ApprovalPolicyRecord {
  id: string;
  name: string;
  description: string | null;
  subject: ApprovalSubject;
  criteria: { rules: ApprovalCriteriaRule[]; logic: "all" | "any" };
  approval_type: ApprovalType;
  required_approvers: number;
  approver_config: { approver_user_ids: string[]; roles: string[]; min_approvals?: number };
  timeout_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStepView {
  id: string;
  step_number: number;
  approver_type: "user" | "role";
  approver_user_id: string | null;
  approver_role_key: string | null;
  approver_name: string | null;
  status: "waiting" | "pending" | "approved" | "rejected" | "skipped";
  decided_by: string | null;
  decided_at: string | null;
  comment: string | null;
  can_act: boolean;
}

export interface ApprovalActionView {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  comment: string | null;
  created_at: string;
}

export interface ApprovalRequestView {
  id: string;
  policy_id: string | null;
  policy_name: string | null;
  subject: string;
  subject_id: string | null;
  subject_summary: string | null;
  payload: Record<string, unknown>;
  requested_by: string;
  requester_name: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  current_step: number;
  priority: number;
  expires_at: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  workflow_run_id: string | null;
  steps: ApprovalStepView[];
  actions: ApprovalActionView[];
}

// ------------------------------------------------------------------
// Resume-handler registration (breaks the approvals <-> workflows
// import cycle; the workflows engine registers at load time).
// ------------------------------------------------------------------

export type ApprovalResumeHandler = (args: {
  runId: string;
  nodeId: string;
  outcome: "approved" | "rejected";
  approval: ApprovalRequestView;
}) => Promise<void>;

let approvalResumeHandler: ApprovalResumeHandler | null = null;

export function registerApprovalResumeHandler(handler: ApprovalResumeHandler | null): void {
  approvalResumeHandler = handler;
}

// ------------------------------------------------------------------
// Policies
// ------------------------------------------------------------------

async function supabaseForOrg() {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) throw new Error("No active workspace");
  return { supabase, organizationId };
}

export async function getApprovalPolicies(): Promise<ApprovalPolicyRecord[] | null> {
  const { supabase, organizationId } = await supabaseForOrg();
  const { data } = await supabase
    .from("approval_policies")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    subject: p.subject as ApprovalSubject,
    criteria:
      typeof p.criteria === "object" && p.criteria && !Array.isArray(p.criteria)
        ? p.criteria
        : { rules: Array.isArray(p.criteria) ? p.criteria : [], logic: "all" },
    approval_type: p.approval_type as ApprovalType,
    required_approvers: p.required_approvers,
    approver_config:
      typeof p.approver_config === "object" && p.approver_config
        ? p.approver_config
        : { approver_user_ids: [], roles: [] },
    timeout_hours: p.timeout_hours,
    is_active: p.is_active,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}

async function requireApprovalManage() {
  if (!(await can("approval.manage"))) {
    throw new Error("You do not have permission to manage approval policies");
  }
  return supabaseForOrg();
}

export interface ApprovalPolicyInput {
  name: string;
  description?: string;
  subject: ApprovalSubject;
  criteria?: { rules: ApprovalCriteriaRule[]; logic: "all" | "any" };
  approval_type?: ApprovalType;
  required_approvers?: number;
  approver_config?: { approver_user_ids?: string[]; roles?: string[]; min_approvals?: number };
  timeout_hours?: number;
  is_active?: boolean;
}

export async function createApprovalPolicy(input: ApprovalPolicyInput): Promise<boolean> {
  const { supabase, organizationId } = await requireApprovalManage();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("approval_policies").insert({
    organization_id: organizationId,
    name: input.name,
    description: input.description || null,
    subject: input.subject,
    criteria: input.criteria ?? { rules: [], logic: "all" },
    approval_type: input.approval_type ?? "single",
    required_approvers: input.required_approvers ?? 1,
    approver_config: input.approver_config ?? { approver_user_ids: [], roles: [] },
    timeout_hours: input.timeout_hours ?? 48,
    is_active: input.is_active ?? true,
    created_by: user?.id ?? null,
  });
  return !error;
}

export async function updateApprovalPolicy(id: string, input: Partial<ApprovalPolicyInput>): Promise<boolean> {
  const { supabase, organizationId } = await requireApprovalManage();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.criteria !== undefined) patch.criteria = input.criteria;
  if (input.approval_type !== undefined) patch.approval_type = input.approval_type;
  if (input.required_approvers !== undefined) patch.required_approvers = input.required_approvers;
  if (input.approver_config !== undefined) patch.approver_config = input.approver_config;
  if (input.timeout_hours !== undefined) patch.timeout_hours = input.timeout_hours;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (Object.keys(patch).length) patch.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from("approval_policies")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId);
  return !error;
}

export async function toggleApprovalPolicy(id: string, isActive: boolean): Promise<boolean> {
  const { supabase, organizationId } = await requireApprovalManage();
  const { error } = await supabase
    .from("approval_policies")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);
  return !error;
}

export async function deleteApprovalPolicy(id: string): Promise<boolean> {
  const { supabase, organizationId } = await requireApprovalManage();
  const { error } = await supabase.from("approval_policies").delete().eq("id", id).eq("organization_id", organizationId);
  return !error;
}

// ------------------------------------------------------------------
// View builder
// ------------------------------------------------------------------

async function buildViews(
  supabase: any,
  rows: any[],
  actorUserId: string | undefined,
  organizationId: string,
): Promise<ApprovalRequestView[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [{ data: steps }, { data: actionRows }, { data: memberRows }] = await Promise.all([
    supabase.from("approval_steps").select("*").eq("organization_id", organizationId).in("request_id", ids).order("step_number"),
    supabase.from("approval_actions").select("*").eq("organization_id", organizationId).in("request_id", ids).order("created_at"),
    supabase
      .from("organization_members")
      .select("user_id, profiles(full_name)")
      .eq("organization_id", organizationId)
      .eq("status", "active"),
  ]);

  const nameById = new Map<string, string>();
  for (const m of memberRows ?? []) {
    const p = Array.isArray(m.profiles) ? null : (m.profiles as { full_name: string | null } | null);
    nameById.set(m.user_id, p?.full_name ?? m.user_id);
  }

  const stepsByRequest = new Map<string, ApprovalStepView[]>();
  for (const s of steps ?? []) {
    const list = stepsByRequest.get(s.request_id) ?? [];
    list.push({
      id: s.id,
      step_number: s.step_number,
      approver_type: s.approver_type,
      approver_user_id: s.approver_user_id,
      approver_role_key: s.approver_role_key,
      approver_name: nameById.get(s.approver_user_id) ?? null,
      status: s.status,
      decided_by: s.decided_by,
      decided_at: s.decided_at,
      comment: s.comment,
      can_act:
        s.status === "pending" &&
        (actorUserId !== undefined
          ? s.approver_user_id === actorUserId || (await can("approval.manage"))
          : false),
    });
    stepsByRequest.set(s.request_id, list);
  }

  const actionsByRequest = new Map<string, ApprovalActionView[]>();
  for (const a of actionRows ?? []) {
    const list = actionsByRequest.get(a.request_id) ?? [];
    list.push({
      id: a.id,
      user_id: a.user_id,
      user_name: nameById.get(a.user_id) ?? null,
      action: a.action,
      comment: a.comment,
      created_at: a.created_at,
    });
    actionsByRequest.set(a.request_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    policy_id: r.policy_id,
    policy_name: null,
    subject: r.subject,
    subject_id: r.subject_id,
    subject_summary: r.subject_summary,
    payload: r.payload ?? {},
    requested_by: r.requested_by,
    requester_name: nameById.get(r.requested_by) ?? null,
    status: r.status,
    current_step: r.current_step,
    priority: r.priority,
    expires_at: r.expires_at,
    decided_by: r.decided_by,
    decided_at: r.decided_at,
    created_at: r.created_at,
    workflow_run_id: r.workflow_run_id,
    steps: stepsByRequest.get(r.id) ?? [],
    actions: actionsByRequest.get(r.id) ?? [],
  }));
}

async function actor(supabase: any): Promise<{ userId?: string; isManager: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { userId: user?.id, isManager: (await can("approval.manage")) ?? false };
}

/** Inbox: pending requests where I am an approver, plus (for managers) all pending. */
export async function getApprovalRequests(scope: "inbox" | "all" = "inbox"): Promise<ApprovalRequestView[] | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const { userId, isManager } = await actor(supabase);

  if (scope === "all" && isManager) {
    const { data } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    return buildViews(supabase, data ?? [], userId, organizationId);
  }

  const { data } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  const views = await buildViews(supabase, data ?? [], userId, organizationId);
  return views.filter(
    (v) =>
      isManager ||
      v.requested_by === userId ||
      v.steps.some(
        (s) => s.approver_user_id === userId && (s.status === "pending" || s.status === "waiting"),
      ),
  );
}

export async function getApprovalRequest(id: string): Promise<ApprovalRequestView | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;
  const { userId, isManager } = await actor(supabase);

  const { data } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return null;

  const views = await buildViews(supabase, [data], userId, organizationId);
  const view = views[0] ?? null;
  if (!view) return null;
  void isManager;
  return view;
}

// ------------------------------------------------------------------
// Engine — creating requests
// ------------------------------------------------------------------

function lookupField(context: Record<string, unknown>, field: string): string {
  const parts = field.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[part] ?? (current as Record<string, unknown>)[part.toLowerCase()];
    } else {
      return "";
    }
  }
  return current === null || current === undefined ? "" : String(current);
}

function evaluateRule(context: Record<string, unknown>, rule: ApprovalCriteriaRule): boolean {
  const actual = lookupField(context, rule.field).trim().toLowerCase();
  const expected = rule.value.trim().toLowerCase();

  if (rule.operator === "=") return actual === expected;
  if (rule.operator === "!=") return actual !== expected;

  if (rule.operator === "in" || rule.operator === "not in") {
    const items = expected.split(",").map((s) => s.trim()).filter(Boolean);
    const hit = items.includes(actual);
    return rule.operator === "in" ? hit : !hit;
  }

  const a = Number(actual);
  const e = Number(expected);
  if (Number.isNaN(a) || Number.isNaN(e)) return false;
  switch (rule.operator) {
    case ">":
      return a > e;
    case "<":
      return a < e;
    case ">=":
      return a >= e;
    case "<=":
      return a <= e;
  }
  return false;
}

function criteriaMatch(policy: ApprovalPolicyRecord, context: Record<string, unknown>): boolean {
  const rules = policy.criteria?.rules ?? [];
  if (!rules.length) return true;
  const results = rules.map((r) => evaluateRule(context, r));
  return (policy.criteria?.logic ?? "all") === "any" ? results.some(Boolean) : results.every(Boolean);
}

export interface CreateApprovalInput {
  subject: ApprovalSubject;
  subjectId?: string | null;
  subjectSummary?: string | null;
  payload?: Record<string, unknown>;
  requestedBy?: string;
  organizationId?: string;
  policyOverride?: string;
  workflowRunId?: string | null;
  workflowNodeId?: string | null;
}

async function resolveApproverUsers(
  supabase: any,
  organizationId: string,
  config: { approver_user_ids?: string[]; roles?: string[] },
): Promise<string[]> {
  const users: string[] = [];
  for (const uid of config.approver_user_ids ?? []) {
    if (!users.includes(uid)) users.push(uid);
  }
  const roles = (config.roles ?? []).filter(Boolean);
  if (roles.length) {
    const { data } = await supabase
      .from("organization_members")
      .select("user_id, role:roles(name)")
      .eq("organization_id", organizationId)
      .eq("status", "active");
    for (const m of data ?? []) {
      const roleName = Array.isArray(m.role) ? null : (m.role as { name?: string } | null)?.name;
      if (roleName && roles.includes(roleName) && !users.includes(m.user_id)) users.push(m.user_id);
    }
  }
  return users;
}

/** Shape a policy row into the typed record. */
function toPolicyRecord(p: any): ApprovalPolicyRecord {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    subject: p.subject as ApprovalSubject,
    criteria:
      typeof p.criteria === "object" && p.criteria && !Array.isArray(p.criteria)
        ? p.criteria
        : { rules: Array.isArray(p.criteria) ? p.criteria : [], logic: "all" },
    approval_type: p.approval_type as ApprovalType,
    required_approvers: p.required_approvers,
    approver_config:
      typeof p.approver_config === "object" && p.approver_config
        ? p.approver_config
        : { approver_user_ids: [], roles: [] },
    timeout_hours: p.timeout_hours,
    is_active: p.is_active,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

/** Find the best matching active policy, then materialize a request. */
export async function createApprovalRequest(input: CreateApprovalInput): Promise<{ id: string; policyId: string | null } | null> {
  const { supabase, organizationId } = await supabaseForOrg();
  const ctx = input.organizationId ?? organizationId;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const requester = input.requestedBy ?? user?.id ?? "";

  let policy: ApprovalPolicyRecord | null = null;
  if (input.policyOverride) {
    const { data: p } = await supabase
      .from("approval_policies")
      .select("*")
      .eq("id", input.policyOverride)
      .eq("organization_id", ctx)
      .maybeSingle();
    if (p) policy = toPolicyRecord(p);
  } else {
    const { data: policies } = await supabase
      .from("approval_policies")
      .select("*")
      .eq("organization_id", ctx)
      .eq("is_active", true);
    const context: Record<string, unknown> = {
      subject: input.subject,
      subjectId: input.subjectId,
      subjectSummary: input.subjectSummary,
      ...(input.payload ?? {}),
    };
    const matching = (policies ?? [])
      .map(toPolicyRecord)
      .filter((rec) => rec.subject === input.subject && criteriaMatch(rec, context))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (matching.length) policy = matching[0];
  }

  if (!policy) {
    // No policy matched — auto-approve as a no-op (keeps small orgs working).
    return null;
  }

  const approvers = await resolveApproverUsers(supabase, ctx, policy.approver_config);
  if (approvers.length === 0) return null;

  const type = policy.approval_type;
  const minApprovals = policy.approver_config.min_approvals ?? policy.required_approvers;

  const stepRows: {
    step_number: number;
    approver_type: "user" | "role";
    approver_user_id: string | null;
    approver_role_key: string | null;
    status: "waiting" | "pending";
  }[] = [];

  if (type === "single" || type === "any_one") {
    // Every candidate shares step 1; whichever acts first resolves it.
    approvers.forEach((uid) => {
      stepRows.push({
        step_number: 1,
        approver_type: "user",
        approver_user_id: uid,
        approver_role_key: null,
        status: "pending",
      });
    });
  } else if (type === "sequential") {
    approvers.forEach((uid, i) => {
      stepRows.push({
        step_number: i + 1,
        approver_type: "user",
        approver_user_id: uid,
        approver_role_key: null,
        status: i === 0 ? "pending" : "waiting",
      });
    });
  } else {
    // multiple / all_required: one step per required approver.
    const count = Math.min(approvers.length, Math.max(1, minApprovals || approvers.length));
    approvers.slice(0, count).forEach((uid, i) => {
      stepRows.push({
        step_number: type === "all_required" ? i + 1 : 1,
        approver_type: "user",
        approver_user_id: uid,
        approver_role_key: null,
        status: "pending",
      });
    });
  }

  const expiresAt = new Date(Date.now() + (policy.timeout_hours ?? 48) * 3600_000).toISOString();

  const { data: created, error } = await supabase
    .from("approval_requests")
    .insert({
      organization_id: ctx,
      policy_id: policy.id,
      subject: input.subject,
      subject_id: input.subjectId ?? null,
      subject_summary: input.subjectSummary ?? null,
      payload: input.payload ?? {},
      requested_by: requester,
      status: "pending",
      current_step: 1,
      expires_at: expiresAt,
      workflow_run_id: input.workflowRunId ?? null,
      workflow_node_id: input.workflowNodeId ?? null,
      decided_by: null,
      decided_at: null,
    })
    .select("id")
    .single();

  if (error || !created) return null;

  await supabase
    .from("approval_steps")
    .insert(
      stepRows.map((s) => ({
        organization_id: ctx,
        request_id: created.id,
        step_number: s.step_number,
        approver_type: s.approver_type,
        approver_user_id: s.approver_user_id,
        approver_role_key: s.approver_role_key,
        status: s.status,
      })),
    );

  await supabase.from("approval_actions").insert({
    organization_id: ctx,
    request_id: created.id,
    user_id: requester || "00000000-0000-0000-0000-000000000000",
    action: "requested",
    comment: null,
  });

  await notifyUsers({
    organizationId: ctx,
    userIds: approvers,
    type: "approval",
    title: "Approval requested",
    message: `${input.subjectSummary ?? "A new request"} needs your approval`,
  });

  return { id: created.id, policyId: policy.id };
}

// ------------------------------------------------------------------
// Engine — decisions
// ------------------------------------------------------------------

type DecisionResult =
  | { resolved: true; status: "approved" | "rejected" }
  | { resolved: false; currentStep?: number };

function updateStepsForType(
  stepRows: ApprovalStepView[],
  request: any,
  type: ApprovalType,
  minApprovals: number,
  decided: { step: ApprovalStepView; outcome: "approved" | "rejected" },
): DecisionResult {
  if (type === "single" || type === "any_one") {
    return { resolved: true, status: decided.outcome };
  }

  if (type === "sequential") {
    if (decided.outcome === "rejected") return { resolved: true, status: "rejected" };
    const pending = stepRows.filter((s) => s.status === "pending");
    const remaining = stepRows.filter((s) => s.status === "waiting").sort((a, b) => a.step_number - b.step_number);
    if (pending.length === 0 && remaining.length === 0) return { resolved: true, status: "approved" };
    if (pending.length === 0 && remaining.length > 0) {
      return { resolved: false, currentStep: remaining[0].step_number };
    }
    return { resolved: false, currentStep: request.current_step };
  }

  if (type === "all_required") {
    if (decided.outcome === "rejected") return { resolved: true, status: "rejected" };
    const approved = stepRows.filter((s) => s.status === "approved").length;
    const total = stepRows.length;
    if (approved >= total) return { resolved: true, status: "approved" };
    return { resolved: false, currentStep: request.current_step };
  }

  // multiple
  if (decided.outcome === "rejected") return { resolved: true, status: "rejected" };
  const approved = stepRows.filter((s) => s.status === "approved").length;
  if (approved >= minApprovals) return { resolved: true, status: "approved" };
  return { resolved: false, currentStep: request.current_step };
}

/** Approve / reject the current actionable step for the calling user. */
export async function decideApproval(
  requestId: string,
  decision: "approved" | "rejected",
  comment?: string,
): Promise<"approved" | "rejected" | "pending" | null> {
  const { supabase, organizationId } = await supabaseForOrg();
  const { userId, isManager } = await actor(supabase);
  if (!userId) return null;

  const { data: request } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!request || request.status !== "pending") return null;

  const policy = request.policy_id
    ? await supabase.from("approval_policies").select("*").eq("id", request.policy_id).eq("organization_id", organizationId).maybeSingle()
    : { data: null };
  const type: ApprovalType = policy?.data?.approval_type ?? "single";
  const minApprovals =
    policy?.data?.approver_config?.min_approvals ?? policy?.data?.required_approvers ?? 1;

  const { data: steps } = await supabase
    .from("approval_steps")
    .select("*")
    .eq("request_id", requestId)
    .eq("organization_id", organizationId)
    .order("step_number");

  const actionable = (steps ?? []).filter(
    (s: any) =>
      s.status === "pending" &&
      (isManager || s.approver_user_id === userId),
  );
  if (!actionable.length) return null;

  const decidedStep = actionable[0];
  const decidedAt = new Date().toISOString();
  const outcome: "approved" | "rejected" = decision;

  await supabase
    .from("approval_steps")
    .update({ status: outcome === "approved" ? "approved" : "rejected", decided_by: userId, decided_at: decidedAt, comment: comment ?? null })
    .eq("id", decidedStep.id)
    .eq("organization_id", organizationId);

  await supabase.from("approval_actions").insert({
    organization_id: organizationId,
    request_id: requestId,
    user_id: userId,
    action: outcome,
    comment: comment ?? null,
  });

  const refreshed = await supabase
    .from("approval_steps")
    .select("*")
    .eq("request_id", requestId)
    .eq("organization_id", organizationId)
    .order("step_number");

  const stepViews = (refreshed.data ?? []).map((s: any) => ({
    id: s.id,
    step_number: s.step_number,
    approver_type: s.approver_type as "user" | "role",
    approver_user_id: s.approver_user_id,
    approver_role_key: s.approver_role_key,
    approver_name: null,
    status: s.status as ApprovalStepView["status"],
    decided_by: s.decided_by,
    decided_at: s.decided_at,
    comment: s.comment,
    can_act: false,
  }));

  if (type === "sequential") {
    const waiting = (refreshed.data ?? [])
      .filter((s: any) => s.status === "waiting")
      .sort((a: any, b: any) => a.step_number - b.step_number);
    if (outcome === "approved" && waiting.length > 0) {
      await supabase
        .from("approval_steps")
        .update({ status: "pending" })
        .eq("id", waiting[0].id)
        .eq("organization_id", organizationId);
      stepViews.find((s) => s.id === waiting[0].id)!.status = "pending";
    }
  }

  const result = updateStepsForType(stepViews, request, type, minApprovals, {
    step: decidedStep && {
      id: decidedStep.id,
      step_number: decidedStep.step_number,
      approver_type: "user",
      approver_user_id: decidedStep.approver_user_id,
      approver_role_key: null,
      approver_name: null,
      status: outcome,
      decided_by: userId,
      decided_at: decidedAt,
      comment: comment ?? null,
      can_act: false,
    },
    outcome,
  });

  const finalStatus = result.resolved ? result.status : "pending";
  const nextStep = !result.resolved && result.currentStep !== undefined ? result.currentStep : request.current_step;

  await supabase
    .from("approval_requests")
    .update({
      status: finalStatus,
      current_step: nextStep,
      decided_by: result.resolved ? userId : null,
      decided_at: result.resolved ? decidedAt : null,
      updated_at: decidedAt,
    })
    .eq("id", requestId)
    .eq("organization_id", organizationId);

  // Notifications
  await notifyUsers({
    organizationId,
    userIds: [request.requested_by],
    type: "approval",
    title: `Approval ${finalStatus}`,
    message: `${request.subject_summary ?? "Request"} was ${finalStatus}${
      comment ? ` — ${comment}` : ""
    }`,
  });

  if (result.resolved && request.workflow_run_id && request.workflow_node_id && approvalResumeHandler) {
    const view = await getApprovalRequest(requestId);
    if (view) {
      await approvalResumeHandler({
        runId: request.workflow_run_id,
        nodeId: request.workflow_node_id,
        outcome: finalStatus as "approved" | "rejected",
        approval: view,
      });
    }
  }

  return finalStatus as "approved" | "rejected" | "pending";
}

/** Requester or manager may cancel a pending request. */
export async function cancelApproval(requestId: string): Promise<boolean> {
  const { supabase, organizationId } = await supabaseForOrg();
  const { userId, isManager } = await actor(supabase);
  if (!userId) return false;

  const { data: request } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!request || request.status !== "pending") return false;
  if (!isManager && request.requested_by !== userId) return false;

  const now = new Date().toISOString();
  await supabase.from("approval_actions").insert({
    organization_id: organizationId,
    request_id: requestId,
    user_id: userId,
    action: "cancelled",
    comment: null,
  });
  await supabase
    .from("approval_requests")
    .update({ status: "cancelled", decided_by: userId, decided_at: now, updated_at: now })
    .eq("id", requestId)
    .eq("organization_id", organizationId);

  if (request.workflow_run_id && request.workflow_node_id && approvalResumeHandler) {
    await approvalResumeHandler({
      runId: request.workflow_run_id,
      nodeId: request.workflow_node_id,
      outcome: "rejected",
      approval: (await getApprovalRequest(requestId))!,
    });
  }
  return true;
}

/** Sweep requests past their expiry (called from workflows job processing). */
export async function expireOverdueApprovals(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return 0;

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("approval_requests")
    .select("id, expires_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .lt("expires_at", now);

  let expired = 0;
  for (const r of data ?? []) {
    await supabase
      .from("approval_requests")
      .update({ status: "expired", decided_at: now, updated_at: now })
      .eq("id", r.id)
      .eq("organization_id", organizationId);
    await supabase.from("approval_actions").insert({
      organization_id: organizationId,
      request_id: r.id,
      user_id: "00000000-0000-0000-0000-000000000000",
      action: "expired",
      comment: "Approval window elapsed",
    });
    await notifyUsers({
      organizationId,
      relatedId: r.id,
      type: "approval",
      title: "Approval expired",
      message: `A pending approval request expired without a decision`,
    });
    expired += 1;
  }
  return expired;
}