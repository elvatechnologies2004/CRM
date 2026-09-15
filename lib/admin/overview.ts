import "server-only";

import { getBillingMetrics } from "@/lib/admin/billing";
import { getAdminDb } from "@/lib/admin/db";
import { getAiOperational } from "@/lib/admin/ai";
import { getAutomationOperational } from "@/lib/admin/automations";
import { getSystemHealth } from "@/lib/admin/system";
import { getOpenTicketCount } from "@/lib/admin/support";

export interface OverviewMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  paidOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number | null;
  arr: number | null;
  mrrAvailable: boolean;
  arrAvailable: boolean;
  openSupportTickets: number;
  aiPendingApprovals: number;
  aiTotalAgents: number;
  automationRuns: number;
  automationFailed: number;
  systemAlerts: number;
}

export async function getPlatformOverview(): Promise<OverviewMetrics> {
  try {
    const db = getAdminDb();

    const [
      orgCount,
      orgRows,
      userCount,
      billing,
      ai,
      automations,
      support,
      systemHealth,
    ] = await Promise.all([
      db.from("organizations").select("*", { count: "exact", head: true }),
      db.from("organizations").select("id"),
      db.from("profiles").select("*", { count: "exact", head: true }),
      getBillingMetrics(),
      getAiOperational(),
      getAutomationOperational(),
      getOpenTicketCount(),
      getSystemHealth(),
    ]);

    const orgIds = (orgRows?.data ?? []).map((o) => o.id);

    const activeOrgs = await countActiveOrganizations(orgIds);

    return {
      totalOrganizations: orgCount.count ?? 0,
      activeOrganizations: activeOrgs.active,
      trialOrganizations: activeOrgs.trial,
      paidOrganizations: activeOrgs.paid,
      suspendedOrganizations: activeOrgs.suspended,
      totalUsers: userCount.count ?? 0,
      activeSubscriptions: billing.activeSubscriptions,
      mrr: billing.mrr,
      arr: billing.arr,
      mrrAvailable: billing.presents.mrr ? Boolean(billing.mrr) : false,
      arrAvailable: billing.presents.arr ? Boolean(billing.arr) : false,
      openSupportTickets: support,
      aiPendingApprovals: ai.pendingApprovals,
      aiTotalAgents: ai.totalAgents,
      automationRuns: automations.totalRuns,
      automationFailed: automations.byStatus.failed ?? 0,
      systemAlerts: systemHealth.alertCount,
    };
  } catch {
    return {
      totalOrganizations: 0,
      activeOrganizations: 0,
      trialOrganizations: 0,
      paidOrganizations: 0,
      suspendedOrganizations: 0,
      totalUsers: 0,
      activeSubscriptions: 0,
      mrr: null,
      arr: null,
      mrrAvailable: false,
      arrAvailable: false,
      openSupportTickets: 0,
      aiPendingApprovals: 0,
      aiTotalAgents: 0,
      automationRuns: 0,
      automationFailed: 0,
      systemAlerts: 0,
    };
  }
}

async function countActiveOrganizations(orgIds: string[]): Promise<{
  active: number;
  trial: number;
  paid: number;
  suspended: number;
}> {
  if (orgIds.length === 0) return { active: 0, trial: 0, paid: 0, suspended: 0 };
  try {
    const db = getAdminDb();
    const { data } = await db.from("subscriptions").select("organization_id, status");
    const byOrg = new Map<string, string>();
    for (const s of data ?? []) {
      if (!byOrg.has(s.organization_id)) {
        byOrg.set(s.organization_id, String(s.status ?? ""));
      }
    }

    let paid = 0;
    let trial = 0;
    let suspended = 0;
    let none = 0;

    for (const orgId of orgIds) {
      const status = (byOrg.get(orgId) ?? "").toLowerCase();
      if (["cancelled", "suspended", "expired", "past_due"].includes(status)) suspended += 1;
      else if (["trial", "trialing"].includes(status)) trial += 1;
      else if (status && status !== "none") paid += 1;
      else none += 1;
    }

    return { active: paid + trial + none, trial, paid, suspended };
  } catch {
    return { active: 0, trial: 0, paid: 0, suspended: 0 };
  }
}