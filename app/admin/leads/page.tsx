import type { Metadata } from "next";
import { ContactRound } from "lucide-react";

import { AdminFilters } from "@/components/admin/admin-filters";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { formatDate, formatNumber } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { listAdminLeads, type AdminLeadRow } from "@/lib/admin/crm";

export const metadata: Metadata = { title: "Admin Leads" };
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<{ search?: string; archive?: string; page?: string }> }) {
  await requirePlatformPermission("organizations.view");
  const sp = await searchParams;
  const result = await listAdminLeads({ search: sp.search, archive: sp.archive, page: Number(sp.page ?? 1) });
  const columns: DataColumn<AdminLeadRow>[] = [
    { header: "Lead", cell: (row) => <span className="font-medium text-ink">{row.name}</span> },
    { header: "Company", cell: (row) => row.company },
    { header: "Email", cell: (row) => row.email },
    { header: "Phone", cell: (row) => row.phone },
    { header: "Source", cell: (row) => row.source },
    { header: "Stage", cell: (row) => row.status },
    { header: "Owner", cell: (row) => row.owner },
    { header: "Organization", cell: (row) => row.organization },
    { header: "Created", cell: (row) => formatDate(row.createdAt) },
  ];
  return <div><PageHeader title="Leads" description="Organization-scoped lead records for administration." /><AdminFilters placeholder="Search lead, company, or email…" initialSearch={sp.search} selects={[{ name: "archive", label: "Records", defaultValue: sp.archive, options: [{ value: "active", label: "Active" }, { value: "archived", label: "Archived" }, { value: "all", label: "All" }] }]} /><DataTable columns={columns} rows={result.data} empty={<EmptyState icon={ContactRound} title="No leads found" description="Try adjusting the search or archive filter." compact />} /><Pagination page={result.page} pageCount={result.pageCount} total={result.total} buildHref={(page) => `/admin/leads?page=${page}`} /></div>;
}