import "server-only";

import { getAdminDb } from "@/lib/admin/db";
import { isGeminiConfigured } from "@/lib/env";

export interface AiOperational {
  totalAgents: number;
  agentsByStatus: Record<string, number>;
  pendingApprovals: number;
  approvalsByStatus: Record<string, number>;
  recommendationsByStatus: Record<string, number>;
  provider: "Gemini" | "Not Configured";
  providerConfigured: boolean;
  tokenUsageAvailable: boolean;
  failedRuns: number;
}

export async function getAiOperational(): Promise<AiOperational> {
  try {
    const db = getAdminDb();

    const [{ data: agents }, { data: approvals }, { data: recommendations }] =
      await Promise.all([
        db.from("ai_agents").select("status"),
        db.from("ai_approvals").select("status"),
        db.from("ai_recommendations").select("status"),
      ]);

    const countBy = (rows: { status: string | null }[] | null, key: string) =>
      (rows ?? []).reduce<Record<string, number>>((acc, row) => {
        const status = String(row.status ?? key);
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});

    const approvalsByStatus = countBy(approvals, "approvals");

    // AI request/log tables are not yet provisioned, so token usage is
    // reported as unavailable rather than inventing numbers.
    const { count: failedRuns } = await db
      .from("ai_approvals")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected");

    return {
      totalAgents: agents?.length ?? 0,
      agentsByStatus: countBy(agents, "agents"),
      pendingApprovals: approvalsByStatus.pending ?? 0,
      approvalsByStatus,
      recommendationsByStatus: countBy(recommendations, "recs"),
      provider: isGeminiConfigured() ? "Gemini" : "Not Configured",
      providerConfigured: isGeminiConfigured(),
      tokenUsageAvailable: false,
      failedRuns: failedRuns ?? 0,
    };
  } catch {
    return {
      totalAgents: 0,
      agentsByStatus: {},
      pendingApprovals: 0,
      approvalsByStatus: {},
      recommendationsByStatus: {},
      provider: "Not Configured",
      providerConfigured: false,
      tokenUsageAvailable: false,
      failedRuns: 0,
    };
  }
}