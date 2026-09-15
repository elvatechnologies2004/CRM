import "server-only";

import { getAdminDb, normalizePage } from "@/lib/admin/db";

export interface AutomationOperational {
  totalRuns: number;
  byStatus: Record<string, number>;
  successRate: number | null;
  totalJobs: number;
  pendingJobs: number;
  failedJobs: number;
  recentFailed: FailedRun[];
}

export interface FailedRun {
  id: string;
  organizationName: string;
  automationName: string | null;
  status: string;
  errorMessage: string | null;
  startedAt: string;
}

export async function getAutomationOperational(): Promise<AutomationOperational> {
  try {
    const db = getAdminDb();
    const { pageSize } = normalizePage({ page: 1, pageSize: 10 });

    const [{ data: runs }, { data: jobs }, { data: failed }] = await Promise.all([
      db.from("automation_runs").select("status"),
      db.from("automation_jobs").select("status"),
      db
        .from("automation_runs")
        .select(
          "id, status, error_message, started_at, organizations(name), automations(name)",
        )
        .in("status", ["failed", "partial"])
        .order("started_at", { ascending: false })
        .limit(pageSize),
    ]);

    const byStatus: Record<string, number> = {};
    for (const run of runs ?? []) {
      const key = String(run.status ?? "unknown");
      byStatus[key] = (byStatus[key] ?? 0) + 1;
    }

    const completed = (runs ?? []).filter((r) => String(r.status) === "success");
    const successRate =
      (runs?.length ?? 0) > 0
        ? Math.round(((completed.length / (runs?.length ?? 1)) * 1000)) / 10
        : null;

    const jobStatus: Record<string, number> = {};
    for (const job of jobs ?? []) {
      const key = String(job.status ?? "unknown");
      jobStatus[key] = (jobStatus[key] ?? 0) + 1;
    }

    interface FailedRow {
      id: string;
      status: string;
      error_message: string | null;
      started_at: string;
      organizations: { name: string } | { name: string }[] | null;
      automations: { name: string | null } | { name: string | null }[] | null;
    }

    const recentFailed: FailedRun[] = ((failed ?? []) as unknown as FailedRow[]).map(
      (row) => {
        const org = Array.isArray(row.organizations) ? null : row.organizations;
        const automation = Array.isArray(row.automations) ? null : row.automations;
        return {
          id: row.id,
          organizationName: (org as { name: string } | null)?.name ?? "—",
          automationName: (automation as { name: string | null } | null)?.name ?? null,
          status: row.status,
          errorMessage: row.error_message,
          startedAt: row.started_at,
        };
      },
    );

    return {
      totalRuns: runs?.length ?? 0,
      byStatus,
      successRate,
      totalJobs: jobs?.length ?? 0,
      pendingJobs: jobStatus.pending ?? 0,
      failedJobs: jobStatus.failed ?? 0,
      recentFailed,
    };
  } catch {
    return {
      totalRuns: 0,
      byStatus: {},
      successRate: null,
      totalJobs: 0,
      pendingJobs: 0,
      failedJobs: 0,
      recentFailed: [],
    };
  }
}