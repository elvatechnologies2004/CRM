import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { supabaseEnv } from "@/lib/env";

import type { PagedResult } from "@/lib/admin/types";

/** True when the service-role key is present so privileged queries can run. */
export function isAdminDbConfigured(): boolean {
  return Boolean(supabaseEnv.url && supabaseEnv.serviceRoleKey);
}

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Lazily-created service-role Supabase client used ONLY inside
 * lib/admin/* server modules. The service-role key is server-only and
 * every public entry point is gated by requirePlatformPermission() BEFORE
 * any privileged query runs (see lib/admin/auth.ts).
 */
export function getAdminDb(): SupabaseClient {
  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseAdminClient();
  }
  return cachedAdminClient;
}

/** True when this error simply means the platform_admin migration is not applied yet. */
export function isSchemaMissing(error: unknown): boolean {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : String(error ?? "");
  return (
    message.includes("platform_") &&
    (message.includes("does not exist") || message.includes("could not find the table"))
  );
}

interface PageParams {
  page?: number;
  pageSize?: number;
}

export function normalizePage(params: PageParams, fallbackPageSize = 25) {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.max(1, Math.min(200, Math.floor(params.pageSize ?? fallbackPageSize)));
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

export function buildPagedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PagedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.max(0, Math.ceil(total / pageSize)),
  };
}

/** YYYY-MM or YYYY-MM-DD label from an RFC3339 timestamp. */
export function monthLabel(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  return iso.slice(0, 7);
}

/** Group an ISO timestamp array into a sorted month bucket series. */
export function buildMonthSeries(
  isoDates: (string | null | undefined)[],
  months = 12,
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const iso of isoDates) {
    const month = iso ? iso.slice(0, 7) : null;
    if (!month) continue;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  const now = new Date();
  const series: { label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    series.push({ label, count: counts.get(label) ?? 0 });
  }
  return series;
}

/** Format an amount in the given currency (default PKR for launch market). */
export function formatCurrency(amount: number | null | undefined, currency = "PKR"): string {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(Number(value ?? 0));
}

export function formatDate(
  iso: string | null | undefined,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString().slice(0, 10);
}