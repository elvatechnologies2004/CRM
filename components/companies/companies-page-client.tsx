"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { CsvImportDialog } from "@/components/crm/csv-import-dialog";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CompaniesFilters, defaultCompaniesFilters, type CompaniesFilterState, type CompaniesViewMode } from "@/components/companies/companies-filters";
import { CompaniesHeader } from "@/components/companies/companies-header";
import { CompaniesStats, type CompanyStats } from "@/components/companies/companies-stats";
import { CompaniesTable } from "@/components/companies/companies-table";
import type { CompanyFormData } from "@/lib/contact-form";
import { createCompanyAction, updateCompanyAction } from "@/app/companies/actions";
import {
  markCompanyArchived,
  markCompanyDeleted,
  readArchivedCompanyIds,
  readDeletedCompanyIds,
  readStoredCompanies,
} from "@/lib/crm-local";
import { getCompanyDeals } from "@/lib/mock-companies";
import type {
  CompanyAccountStatus,
  CompanyRecord,
  User,
} from "@/lib/types";

interface CompaniesPageClientProps {
  initialCompanies: CompanyRecord[];
  owners: User[];
}

function companyMatches(company: CompanyRecord, query: string) {
  const haystack = [
    company.name,
    company.domain,
    company.industry,
    company.email,
    company.phone,
    company.city,
    company.country,
    ...company.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

const importTargetFields = [
  { key: "name", label: "Company name", required: true },
  { key: "domain", label: "Domain", required: true },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "companySize", label: "Company size" },
  { key: "employeeCount", label: "Employees" },
  { key: "annualRevenue", label: "Annual revenue" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "accountStatus", label: "Account status" },
];

function revenueToNumber(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const number = Number(cleaned) || 0;
  const upper = value.toUpperCase();
  if (upper.includes("M")) return number * 1_000_000;
  if (upper.includes("K")) return number * 1_000;
  return number;
}

function CompaniesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {["Total", "Customers", "Opps", "Pipeline", "High"].map((label) => (
          <Skeleton key={label} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[76px]" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}

function CompaniesPageClient({
  initialCompanies,
  owners,
}: CompaniesPageClientProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRecord[]>(initialCompanies);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CompaniesFilterState>(defaultCompaniesFilters);
  const [view, setView] = useState<CompaniesViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies]);

  const ownerNames = useMemo(() => owners.map((owner) => owner.name), [owners]);

  const stats: CompanyStats = useMemo(() => {
    const visible = companies.filter(
      (company) => !archived.has(company.id) && !deleted.has(company.id)
    );
    return {
      total: visible.length,
      activeCustomers: visible.filter((company) => company.accountStatus === "Customer").length,
      openOpportunities: visible.filter(
        (company) => getCompanyDeals(company.id).some((deal) => deal.status === "Open")
      ).length,
      pipelineValue: visible.reduce(
        (sum, company) =>
          sum +
          getCompanyDeals(company.id)
            .filter((deal) => deal.status === "Open")
            .reduce((sub, deal) => sub + deal.value, 0),
        0
      ),
      highValueAccounts: visible.filter(
        (company) => revenueToNumber(company.annualRevenue) >= 500_000
      ).length,
    };
  }, [companies, archived, deleted]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    let result = companies.filter(
      (company) => !archived.has(company.id) && !deleted.has(company.id)
    );

    if (query) result = result.filter((company) => companyMatches(company, query));
    if (filters.status !== "all") {
      result = result.filter((company) => company.accountStatus === filters.status);
    }
    if (filters.industry !== "all") {
      result = result.filter((company) => company.industry === filters.industry);
    }

    const sorted = [...result];
    switch (filters.sort) {
      case "highestRevenue":
        sorted.sort((a, b) => revenueToNumber(b.annualRevenue) - revenueToNumber(a.annualRevenue));
        break;
      case "mostActive":
        sorted.sort((a, b) => +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt));
        break;
      case "nameAz":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return sorted;
  }, [companies, archived, deleted, filters]);

  const setFilter = (patch: Partial<CompaniesFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const clearFilters = () => setFilters({ ...defaultCompaniesFilters });

  const handleAddSubmit = async (data: CompanyFormData) => {
    const owner = owners.find((candidate) => candidate.name === data.ownerName);
    const input = {
      name: data.name,
      domain: data.domain,
      website: data.website,
      industry: data.industry,
      companySize: data.companySize,
      employeeCount: data.employeeCount,
      annualRevenue: data.annualRevenue,
      currency: data.currency,
      phone: data.phone,
      email: data.email,
      country: data.country,
      city: data.city,
      address: data.address,
      accountStatus: data.accountStatus,
      ownerId: owner?.id,
      source: data.source,
      tags: data.tags,
      description: data.description,
    };

    if (editingCompany) {
      const result = await updateCompanyAction({ id: editingCompany.id, ...input });
      if (result.error || !result.company) {
        setToast(result.error || "Failed to update company");
        window.setTimeout(() => setToast(null), 2400);
        return;
      }
      setCompanies((prev) =>
        prev.map((company) => (company.id === editingCompany.id ? result.company! : company))
      );
    } else {
      const result = await createCompanyAction(input);
      if (result.error || !result.company) {
        setToast(result.error || "Failed to create company");
        window.setTimeout(() => setToast(null), 2400);
        return;
      }
      setCompanies((prev) => [result.company!, ...prev]);
    }
    setEditingCompany(null);
    setAddOpen(false);
  };

  const handleViewExisting = (company: CompanyRecord) => {
    setAddOpen(false);
    router.push(`/companies/${company.id}`);
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const created: CompanyRecord[] = [];
    for (const row of rows) {
      const result = await createCompanyAction({
        name: row.name ?? "",
        domain: row.domain ?? "",
        website: row.website ?? "",
        industry: row.industry || "Other",
        companySize: row.companySize || "11-50",
        employeeCount: row.employeeCount ?? "",
        annualRevenue: row.annualRevenue ?? "",
        currency: "PKR",
        phone: row.phone ?? "",
        email: row.email ?? "",
        country: row.country ?? "",
        city: row.city ?? "",
        address: "",
        accountStatus: row.accountStatus || "Prospect",
        source: "Manual",
        tags: "",
      });
      if (result.company) created.push(result.company);
    }
    if (created.length > 0) {
      setCompanies((prev) => [...created, ...prev]);
      setToast(`${created.length} ${created.length === 1 ? "company" : "companies"} imported`);
    }
  };

  const handleArchive = (company: CompanyRecord) => {
    markCompanyArchived(company.id);
    setArchived((prev) => new Set(prev).add(company.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(company.id);
      return next;
    });
    setToast(`${company.name} archived`);
  };

  const handleDeleteRow = (company: CompanyRecord) => {
    markCompanyDeleted(company.id);
    setCompanies((prev) => prev.filter((item) => item.id !== company.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(company.id);
      return next;
    });
    setArchived((prev) => {
      const next = new Set(prev);
      next.delete(company.id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((company) => company.id)) : new Set());
  };

  const bulkAssignOwner = (ownerName: string) => {
    setCompanies((prev) =>
      prev.map((company) =>
        selected.has(company.id)
          ? {
              ...company,
              ownerName,
              ownerId: owners.find((owner) => owner.name === ownerName)?.id ?? company.ownerId,
            }
          : company
      )
    );
  };

  const bulkStatus = (status: CompanyAccountStatus) => {
    setCompanies((prev) =>
      prev.map((company) =>
        selected.has(company.id) ? { ...company, accountStatus: status } : company
      )
    );
  };

  const bulkDelete = () => {
    for (const id of selected) {
      markCompanyDeleted(id);
    }
    setCompanies((prev) => prev.filter((company) => !selected.has(company.id)));
    setSelected(new Set());
  };

  const viewCompany = (id: string) => {
    router.push(`/companies/${id}`);
  };

  const openCreate = () => {
    setEditingCompany(null);
    setAddOpen(true);
  };

  const openEdit = (company: CompanyRecord) => {
    setEditingCompany(company);
    setAddOpen(true);
  };

  if (loading) {
    return <CompaniesSkeleton />;
  }

  return (
    <div className="space-y-4">
      <CompaniesHeader
        onAddCompany={openCreate}
        onImport={() => setImportOpen(true)}
      />
      <CompaniesStats stats={stats} />

      <CompaniesFilters
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        view={view}
        onViewChange={setView}
        resultCount={filtered.length}
      />

      <CompaniesTable
        companies={filtered}
        selected={selected}
        onToggleSelected={toggleSelected}
        onToggleAll={toggleAll}
        onClearSelection={() => setSelected(new Set())}
        onView={viewCompany}
        onEdit={openEdit}
        onDelete={handleDeleteRow}
        onArchive={handleArchive}
        onBulkAssignOwner={bulkAssignOwner}
        onBulkStatus={bulkStatus}
        onBulkDelete={bulkDelete}
        onClearFilters={clearFilters}
        owners={ownerNames}
        statuses={["Customer", "Opportunity", "Prospect"]}
        cardsView={view === "cards"}
      />

      <AddCompanyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        owners={owners}
        companies={companies}
        initial={editingCompany ? companyToForm(editingCompany) : null}
        mode={editingCompany ? "edit" : "create"}
        onSubmit={handleAddSubmit}
        onViewExisting={handleViewExisting}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Companies"
        description="Upload a CSV of companies, map the columns, then review before importing."
        targetFields={importTargetFields}
        onImport={handleImport}
      />

      {toast && (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function companyToForm(company: CompanyRecord): Partial<CompanyFormData> {
  return {
    name: company.name,
    domain: company.domain,
    website: company.website,
    industry: company.industry,
    companySize: company.companySize,
    employeeCount: String(company.employeeCount),
    annualRevenue: company.annualRevenue,
    currency: company.currency,
    phone: company.phone,
    email: company.email,
    country: company.country,
    city: company.city,
    address: company.address,
    accountStatus: company.accountStatus,
    ownerName: company.ownerName,
    source: company.source,
    tags: company.tags.join(", "),
    description: company.description,
    previousId: company.id,
  };
}

export { CompaniesPageClient };