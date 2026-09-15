import "server-only";

import {
  buildPagedResult,
  getAdminDb,
  normalizePage,
} from "@/lib/admin/db";
import type { PagedResult } from "@/lib/admin/types";

export interface PlatformSubscription {
  id: string;
  organizationId: string;
  organizationName: string;
  planName: string | null;
  status: string;
  amount: number | null;
  currency: string | null;
  billingCycle: string | null;
  startDate: string | null;
  renewalDate: string | null;
  provider: string;
  createdAt: string;
}

export interface SubscriptionFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface SubscriptionRow {
  id: string;
  organization_id: string;
  organizations: { name: string } | { name: string }[] | null;
  plan_name: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  billing_cycle: string | null;
  start_date: string | null;
  renewal_date: string | null;
  created_at: string;
}

export async function listSubscriptions(
  filters: SubscriptionFilters = {},
): Promise<PagedResult<PlatformSubscription>> {
  try {
    const { page, pageSize, from, to } = normalizePage(filters);
    const db = getAdminDb();

    let query = db
      .from("subscriptions")
      .select("*, organizations(name)", { count: "exact" });

    const search = filters.search?.trim();
    if (search) {
      query = query.or(`plan_name.ilike.%${search}%,status.ilike.%${search}%`);
    }
    if (filters.status && filters.status !== "all") {
      query = query.ilike("status", filters.status);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return buildPagedResult([], 0, page, pageSize);
    }

    const rows = (data ?? []) as unknown as SubscriptionRow[];
    const result: PlatformSubscription[] = rows.map((row) => {
      const org = Array.isArray(row.organizations) ? null : row.organizations;
      return {
        id: row.id,
        organizationId: row.organization_id,
        organizationName: (org as { name: string } | null)?.name ?? "—",
        planName: row.plan_name,
        status: row.status ?? "Active",
        amount: row.amount,
        currency: row.currency,
        billingCycle: row.billing_cycle,
        startDate: row.start_date,
        renewalDate: row.renewal_date,
        provider: "Internal",
        createdAt: row.created_at,
      };
    });

    return buildPagedResult(result, count ?? result.length, page, pageSize);
  } catch {
    return buildPagedResult([], 0, filters.page ?? 1, filters.pageSize ?? 25);
  }
}

export async function getSubscriptionCounts(): Promise<Record<string, number>> {
  try {
    const db = getAdminDb();
    const { data } = await db.from("subscriptions").select("status");
    const counts: Record<string, number> = { total: 0 };
    for (const row of data ?? []) {
      const key = String(row.status ?? "Unknown");
      counts[key] = (counts[key] ?? 0) + 1;
      counts.total += 1;
    }
    return counts;
  } catch {
    return { total: 0 };
  }
}