import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ActivationMilestone {
  key: string;
  label: string;
  done: boolean;
  href?: string;
}

export interface ActivationResult {
  milestones: ActivationMilestone[];
  score: number; // 0–100
  doneCount: number;
  totalCount: number;
}

const MILESTONES = [
  { key: "organization", label: "Organization created", table: "organizations", href: "/settings" },
  { key: "lead", label: "First lead created", table: "leads", href: "/leads" },
  { key: "contact", label: "First contact added", table: "contacts", href: "/contacts" },
  { key: "company", label: "First company added", table: "companies", href: "/companies" },
  { key: "deal", label: "First deal created", table: "deals", href: "/pipeline" },
  { key: "pipeline_activity", label: "First pipeline activity", table: "activities", href: "/pipeline" },
  { key: "task", label: "First task created", table: "tasks", href: "/tasks" },
  { key: "automation", label: "First automation built", table: "automations", href: "/automations" },
  { key: "team", label: "Team member invited", table: "organization_invites", href: "/settings" },
] as const;

/**
 * Compute onboarding activation (Steps 98.2/98.3).
 * Simple, deterministic milestone counting — no AI.
 */
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

  const orgId = membership.organization_id as string;

  // Org exists = always done (we fetched it already).
  const checks: Record<string, boolean> = { organization: true };

  // Count rows per milestone table.
  const tableMap: Record<string, string> = {
    lead: "leads",
    contact: "contacts",
    company: "companies",
    deal: "deals",
    pipeline_activity: "activities",
    task: "tasks",
    automation: "automations",
  };

  await Promise.all(
    Object.entries(tableMap).map(async ([key, table]) => {
      const { count } = await supabase
        .from(table as "leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      checks[key] = (count ?? 0) > 0;
    }),
  );

  // Team invited: any invite OR more than one active member.
  const { count: invites } = await supabase
    .from("organization_invites")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .not("status", "eq", "revoked");
  const { count: members } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");
  checks.team = (invites ?? 0) > 0 || (members ?? 0) > 1;

  const milestones: ActivationMilestone[] = MILESTONES.map((m) => ({
    key: m.key,
    label: m.label,
    done: Boolean(checks[m.key]),
    href: m.href,
  }));

  const doneCount = milestones.filter((m) => m.done).length;
  return {
    milestones,
    score: Math.round((doneCount / milestones.length) * 100),
    doneCount,
    totalCount: milestones.length,
  };
}