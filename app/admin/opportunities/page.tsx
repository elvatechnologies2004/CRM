import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";

import { AdminFilters } from "@/components/admin/admin-filters";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { formatCurrency, formatDate } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { listAdminOpportunities, type AdminOpportunityRow } from "@/lib/admin/crm";

export const metadata: Metadata = { title: "Admin Opportunities" };
export const dynamic = "force-dynamic";

export default async function AdminOpportunitiesPage({ searchParams }: { searchParams: Promise<{ search?: string; archive?: string; page?: string }> }) {
  await requirePlatformPermission("organizations.view");
  const sp = await searchParams;
  const result = await listAdminOpportunities({ search: sp.search, archive: sp.archive, page: Number(sp.page ?? 1) });
  const columns: DataColumn<AdminOpportunityRow>[] = [
    { header: "Opportunity", cell: (row) => <span className="font-medium text-ink">{row.name}</span> },
    { header: "Customer", cell: (row) => row.customer },
    { header: "Company", cell: (row) => row.company },
    { header: "Owner", cell: (row) => row.owner },
    { header: "Stage", cell: (row) => row.stage },
    { header: "Value", cell: (row) => formatCurrency(row.value, row.currency) },
    { header: "Organization", cell: (row) => row.organization },
    { header: "Created", cell: (row) => formatDate(row.createdAt) },
    { header: "Expected Close", cell: (row) => formatDate(row.expectedClose) },
    { header: "Closed", cell: (row) => formatDate(row.closedAt) },
  ];
  return <div><PageHeader title="Opportunities" description="Organization-scoped opportunity records for administration." /><AdminFilters placeholder="Search opportunity…" initialSearch={sp.search} selects={[{ name: "archive", label: "Records", defaultValue: sp.archive, options: [{ value: "active", label: "Active" }, { value: "archived", label: "Archived" }, { value: "all", label: "All" }] }]} /><DataTable columns={columns} rows={result.data} empty={<EmptyState icon={BriefcaseBusiness} title="No opportunities found" description="Try adjusting the search or archive filter." compact />} /><Pagination page={result.page} pageCount={result.pageCount} total={result.total} buildHref={(page) => `/admin/opportunities?page=${page}`} /></div>;
}