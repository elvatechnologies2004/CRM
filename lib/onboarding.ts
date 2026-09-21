import "server-only";

import { filterValidRelatedRows, type DashboardParentType } from "@/lib/crm/dashboard";
import { applyOwnerScope, getSalesAccessScope } from "@/lib/crm/scope";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ActivationMilestone {
  key: string;
  label: string;
  done: boolean;
  href?: string;
}

export interface ActivationResult {
  milestones: ActivationMilestone[];
  score: number;
  doneCount: number;
  totalCount: number;
}

const MILESTONES = [
  { key: "organization", label: "Organization created", href: "/settings" },
  { key: "lead", label: "First lead created", href: "/leads" },
  { key: "opportunity", label: "First opportunity created", href: "/opportunities" },
  { key: "task", label: "First task created", href: "/tasks" },
  { key: "team", label: "Team member invited", href: "/settings" },
] as const;

export async function getActivation(): Promise<ActivationResult | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return null;

  const organizationId = membership.organization_id as string;

  // Phase 2 — milestone counts reflect the caller's sales scope so a BDO /
  // RSM never sees org-wide "first lead/opportunity" signals they cannot see.
  const salesScope = await getSalesAccessScope();

  let leadsQ = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("archived_at", null);
  leadsQ = applyOwnerScope(leadsQ, salesScope, "owner_id") as typeof leadsQ;

  let opportunitiesQ = supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("archived_at", null);
  opportunitiesQ = applyOwnerScope(opportunitiesQ, salesScope, "owner_id") as typeof opportunitiesQ;

  const [{ count: leads }, { count: opportunities }, { data: taskRows }] = await Promise.all([
    leadsQ,
    opportunitiesQ,
    supabase
      .from("tasks")
      .select("related_type, related_id")
      .eq("organization_id", organizationId)
      .neq("status", "Cancelled"),
  ]);

  const validTasks = await filterValidRelatedRows(
    supabase,
    organizationId,
    (taskRows ?? []) as Array<{
      related_type: string | null;
      related_id: string | null;
    }>,
    ["lead", "deal", "contact", "company"] satisfies DashboardParentType[],
  );

  const [{ count: invites }, { count: members }] = await Promise.all([
    supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["pending", "accepted"]),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
  ]);

  const checks: Record<string, boolean> = {
    organization: true,
    lead: (leads ?? 0) > 0,
    opportunity: (opportunities ?? 0) > 0,
    task: validTasks.length > 0,
    team: (invites ?? 0) > 0 || (members ?? 0) > 1,
  };

  const milestones: ActivationMilestone[] = MILESTONES.map((milestone) => ({
    ...milestone,
    done: checks[milestone.key] === true,
  }));
  const doneCount = milestones.filter((milestone) => milestone.done).length;

  return {
    milestones,
    score: Math.round((doneCount / milestones.length) * 100),
    doneCount,
    totalCount: milestones.length,
  };
}