import "server-only";

import { getAdminDb } from "@/lib/admin/db";
import {
  isGeminiConfigured,
  isSupabaseConfigured,
  stripeEnv,
} from "@/lib/env";

type HealthStatus = "Operational" | "Warning" | "Error" | "Not Configured";

interface SupabaseClientLike {
  from: (table: string) => {
    select: (cols: string, opts?: { count?: "exact"; head?: boolean }) => Promise<{
      data: Record<string, unknown>[] | null;
      count: number | null;
      error: Error | null;
    }>;
  };
  storage: {
    listBuckets: () => Promise<{
      data: { name: string }[] | null;
      error: Error | null;
    }>;
  };
}
function dbLike(): SupabaseClientLike {
  return getAdminDb() as unknown as SupabaseClientLike;
}

export interface SystemHealthItem {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  lastSuccess: string | null;
  checkedAt: string;
}

export interface SystemHealth {
  items: SystemHealthItem[];
  alertCount: number;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const now = new Date().toISOString();
  let alertCount = 0;

  const push = (
    item: Omit<SystemHealthItem, "status" | "checkedAt"> & { status: HealthStatus },
  ) => {
    if (item.status === "Warning" || item.status === "Error") alertCount += 1;
    return { ...item, checkedAt: now };
  };

  let databaseStatus: HealthStatus = "Not Configured";
  let databaseDetail = "Supabase not configured";
  let storageStatus: HealthStatus = "Not Configured";
  let storageDetail = "Supabase not configured";
  let lastAutomationSuccess: string | null = null;

  try {
    const db = dbLike();
    const [orgResult, bucketResult, latestRunResult] = await Promise.all([
      db.from("organizations").select("*", { count: "exact", head: true }),
      db.storage.listBuckets(),
      db.from("automation_runs").select("completed_at"),
    ]);

    const count = orgResult.count ?? 0;
    const buckets = bucketResult.data ?? [];
    const latestRun = (latestRunResult.data ?? [])[0]?.completed_at ?? null;

    databaseStatus = isSupabaseConfigured() ? "Operational" : "Not Configured";
    databaseDetail = isSupabaseConfigured()
      ? `Database reachable (${count} organizations)`
      : databaseDetail;

    storageStatus = isSupabaseConfigured()
      ? "Operational"
      : "Not Configured";
    storageDetail = isSupabaseConfigured()
      ? `${buckets.length} storage bucket(s)`
      : storageDetail;

    lastAutomationSuccess = latestRun ? String(latestRun) : null;
  } catch {
    databaseStatus = "Error";
    databaseDetail = "Database query failed";
    storageStatus = "Error";
    storageDetail = "Storage listing failed";
  }

  const items: SystemHealthItem[] = [
    push({
      id: "application",
      label: "Application",
      status: "Operational",
      detail: "Server responded and rendered this page",
      lastSuccess: now,
    }),
    push({
      id: "database",
      label: "Database",
      status: databaseStatus,
      detail: databaseDetail,
      lastSuccess: databaseStatus === "Operational" ? now : null,
    }),
    push({
      id: "auth",
      label: "Supabase Auth",
      status: isSupabaseConfigured() ? "Operational" : "Not Configured",
      detail: isSupabaseConfigured()
        ? "Auth endpoints configured"
        : "Supabase not configured",
      lastSuccess: isSupabaseConfigured() ? now : null,
    }),
    push({
      id: "storage",
      label: "Storage",
      status: storageStatus,
      detail: storageDetail,
      lastSuccess: storageStatus === "Operational" ? now : null,
    }),
    push({
      id: "background_jobs",
      label: "Background Jobs",
      status: "Not Configured",
      detail: "No job scheduler/cron worker is running",
      lastSuccess: null,
    }),
    push({
      id: "cron",
      label: "Cron",
      status: "Not Configured",
      detail: "No Vercel Cron configured",
      lastSuccess: null,
    }),
    push({
      id: "automation_engine",
      label: "Automation Engine",
      status: isSupabaseConfigured() ? "Operational" : "Not Configured",
      detail: isSupabaseConfigured()
        ? "Automation tables present"
        : "Supabase not configured",
      lastSuccess: lastAutomationSuccess,
    }),
    push({
      id: "ai_provider",
      label: "AI Provider",
      status: isGeminiConfigured() ? "Operational" : "Not Configured",
      detail: isGeminiConfigured()
        ? "Gemini API key configured"
        : "Add GEMINI_API_KEY",
      lastSuccess: isGeminiConfigured() ? now : null,
    }),
    push({
      id: "email_provider",
      label: "Email Provider",
      status: "Not Configured",
      detail: "EMAIL_PROVIDER / SMTP_HOST not configured",
      lastSuccess: null,
    }),
    push({
      id: "billing_webhooks",
      label: "Billing Webhooks",
      status: stripeEnv.isConfigured ? "Operational" : "Not Configured",
      detail: stripeEnv.isConfigured
        ? "Stripe webhook secret present"
        : "Not configured",
      lastSuccess: stripeEnv.isConfigured ? now : null,
    }),
    push({
      id: "external_webhooks",
      label: "External Webhooks",
      status: "Not Configured",
      detail: "No external webhook endpoints configured",
      lastSuccess: null,
    }),
  ];

  return { items, alertCount };
}