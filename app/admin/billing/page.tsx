import type { Metadata } from "next";
import {
  AlertTriangle,
  Ban,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Rocket,
} from "lucide-react";

import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { NotAvailable } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatDate } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  getBillingMetrics,
  listRecentPayments,
  type PaymentRow,
} from "@/lib/admin/billing";

export const metadata: Metadata = {
  title: "Billing",
  description: "FinloNexa platform billing",
};

export const dynamic = "force-dynamic";

function parsePage(value: string | undefined): number {
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function Money({
  available,
  value,
  currency,
}: {
  available: boolean;
  value: number | null;
  currency?: string;
}) {
  if (!available || value === null || value === 0) return <NotAvailable />;
  return <span className="font-mono text-2xl font-semibold tracking-tight text-ink">{formatCurrency(value, currency ?? "PKR")}</span>;
}

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePlatformPermission("billing.view");

  const sp = await searchParams;
  const page = parsePage(sp.page);
  const [metrics, payments] = await Promise.all([
    getBillingMetrics(),
    listRecentPayments(page),
  ]);
  const { total, pageCount } = payments;

  const buildHref = (targetPage: number) =>
    `/admin/billing?page=${targetPage}`;

  const columns: DataColumn<PaymentRow>[] = [
    {
      header: "Organization",
      className: "min-w-[200px]",
      cell: (row) => <span className="font-medium text-ink">{row.organizationName}</span>,
    },
    {
      header: "Amount",
      cell: (row) => (
        <span className="font-mono text-ink">{formatCurrency(row.amount, row.currency ?? "PKR")}</span>
      ),
    },
    {
      header: "Method",
      cell: (row) => <span className="text-ink">{row.method ?? "—"}</span>,
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Reference",
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.reference ?? "—"}</span>,
    },
    {
      header: "Paid At",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.paidAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Billing metrics are computed from the internal subscriptions and payments tables (platform-observed, not Stripe-confirmed)."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="MRR (monthly)"
          value={<Money available={metrics.presents.mrr} value={metrics.mrr} />}
          icon={CreditCard}
        />
        <StatCard
          label="ARR (yearly)"
          value={<Money available={metrics.presents.arr} value={metrics.arr} />}
          icon={Banknote}
          accent="green"
        />
        <StatCard
          label="Active Subscriptions"
          value={metrics.activeSubscriptions}
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          label="Total Revenue (completed)"
          value={
            <span className="font-mono text-2xl font-semibold tracking-tight text-ink">
              {formatCurrency(metrics.revenueTotal)}
            </span>
          }
          icon={Banknote}
          accent="cyan"
        />
        <StatCard label="Trials" value={metrics.trials} icon={Rocket} accent="purple" />
        <StatCard label="Past Due" value={metrics.pastDue} icon={AlertTriangle} accent="amber" />
        <StatCard label="Cancelled / Expired" value={metrics.cancelled} icon={Ban} accent="red" />
        <StatCard label="Payment Failures" value={metrics.paymentFailures} icon={Clock} accent={metrics.paymentFailures > 0 ? "red" : "green"} />
      </div>

      <PageHeader
        title="Recent Payments"
        description="Latest completed transactions across the platform."
      />

      <DataTable
        columns={columns}
        rows={payments.data}
        empty={
          <EmptyState
            icon={Banknote}
            title="No payments recorded"
            description="Completed payments will appear here as they are processed."
            compact
          />
        }
      />

      <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />
    </div>
  );
}