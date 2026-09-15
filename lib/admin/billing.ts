import "server-only";

import {
  buildPagedResult,
  formatCurrency,
  getAdminDb,
  normalizePage,
} from "@/lib/admin/db";
import type { PagedResult } from "@/lib/admin/types";

export interface BillingMetrics {
  mrr: number | null;
  arr: number | null;
  activeSubscriptions: number;
  trials: number;
  pastDue: number;
  cancelled: number;
  paymentFailures: number;
  revenueTotal: number;
  presents: {
    mrr: boolean;
    arr: boolean;
  };
}

export interface PaymentRow {
  id: string;
  organizationName: string;
  amount: number;
  currency: string | null;
  method: string | null;
  status: string;
  reference: string | null;
  paidAt: string;
}

/**
 * MRR / ARR are computed from the internal `subscriptions` table. These are
 * platform-observed amounts, NOT provider (Stripe) confirmations. Providers
 * are never assumed connected when they are not configured.
 */
export async function getBillingMetrics(): Promise<BillingMetrics> {
  try {
    const db = getAdminDb();
    const [{ data: subscriptions }, { data: payments }] = await Promise.all([
      db.from("subscriptions").select("amount, currency, billing_cycle, status"),
      db.from("payments").select("status").eq("status", "Failed"),
    ]);

    const rows = (subscriptions ?? []) as {
      amount: number | null;
      currency: string | null;
      billing_cycle: string | null;
      status: string | null;
    }[];

    let mrr = 0;
    let arr = 0;
    let activeSubscriptions = 0;
    let trials = 0;
    let pastDue = 0;
    let cancelled = 0;

    for (const sub of rows) {
      const amount = Number(sub.amount ?? 0);
      const status = (sub.status ?? "").toLowerCase();
      if (status === "trial" || status === "trialing") {
        trials += 1;
        continue;
      }
      if (status === "cancelled" || status === "expired") {
        cancelled += 1;
        continue;
      }
      if (status === "past_due" || status === "suspended") {
        pastDue += 1;
        continue;
      }
      if (status && status !== "none") {
        activeSubscriptions += 1;
        const monthly = (sub.billing_cycle ?? "").toLowerCase() === "yearly" ? amount / 12 : amount;
        const yearly = (sub.billing_cycle ?? "").toLowerCase() === "yearly" ? amount : monthly * 12;
        mrr += monthly;
        arr += yearly;
      }
    }

    const { data: revenue } = await db
      .from("payments")
      .select("amount")
      .eq("status", "Completed");
    const revenueTotal = (revenue ?? []).reduce(
      (acc, p) => acc + Number(p.amount ?? 0),
      0,
    );

    return {
      mrr,
      arr,
      activeSubscriptions,
      trials,
      pastDue,
      cancelled,
      paymentFailures: payments?.length ?? 0,
      revenueTotal,
      presents: { mrr: true, arr: true },
    };
  } catch {
    return {
      mrr: null,
      arr: null,
      activeSubscriptions: 0,
      trials: 0,
      pastDue: 0,
      cancelled: 0,
      paymentFailures: 0,
      revenueTotal: 0,
      presents: { mrr: false, arr: false },
    };
  }
}

interface PaymentQueryRow {
  id: string;
  organizations: { name: string } | { name: string }[] | null;
  amount: number;
  currency: string | null;
  method: string | null;
  status: string;
  reference: string | null;
  paid_at: string;
}

export async function listRecentPayments(
  page = 1,
  pageSize = 25,
): Promise<PagedResult<PaymentRow>> {
  try {
    const { page: p, pageSize: ps, from, to } = normalizePage({ page, pageSize });
    const db = getAdminDb();
    const { data, count, error } = await db
      .from("payments")
      .select("*, organizations(name)", { count: "exact" })
      .order("paid_at", { ascending: false })
      .range(from, to);

    if (error) {
      return buildPagedResult([], 0, p, ps);
    }

    const rows = (data ?? []) as unknown as PaymentQueryRow[];
    const result: PaymentRow[] = rows.map((row) => {
      const org = Array.isArray(row.organizations) ? null : row.organizations;
      return {
        id: row.id,
        organizationName: (org as { name: string } | null)?.name ?? "—",
        amount: Number(row.amount ?? 0),
        currency: row.currency,
        method: row.method,
        status: row.status,
        reference: row.reference,
        paidAt: row.paid_at,
      };
    });

    return buildPagedResult(result, count ?? result.length, p, ps);
  } catch {
    return buildPagedResult([], 0, page, pageSize);
  }
}

export { formatCurrency };