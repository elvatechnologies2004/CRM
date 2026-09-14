"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { CsvImportDialog } from "@/components/crm/csv-import-dialog";
import { DealsHeader } from "@/components/deals/deals-header";
import { DealsFilters, defaultDealFilters, type DealFilterState, type DealsViewMode } from "@/components/deals/deals-filters";
import { DealsStats } from "@/components/crm/deals-stats";
import { AddDealDialog } from "@/components/deals/add-deal-dialog";
import { DealsTable } from "@/components/deals/deals-table";
import { buildDealRecord, type DealFormData, type DealEditFormData, applyDealEdit } from "@/lib/deal-form";
import {
  readStoredDeals,
  upsertDeal,
} from "@/lib/deal-local";
import type { DealRecord } from "@/lib/types";

interface DealsPageClientProps {
  initialDeals: DealRecord[];
  owners: string[];
}

function DealsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {["Total", "Open", "Won", "Pipeline", "Average"].map((label) => (
          <Skeleton key={label} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[76px]" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}

function DealsPageClient({
  initialDeals,
  owners,
}: DealsPageClientProps) {
  const router = useRouter();
  const [deals, setDeals] = useState<DealRecord[]>(initialDeals);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DealFilterState>(defaultDealFilters);
  const [view, setView] = useState<DealsViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleted] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(deals.map((d) => d.id)) : new Set());
  };

  const [addOpen, setAddOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealRecord | null>(null);
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
    const id = window.setTimeout(() => {
      const stored = readStoredDeals();
      const merged = [...stored, ...initialDeals.filter((deal) => !stored.some((c) => c.id === deal.id))];
      setDeals(merged);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialDeals]);

  const stats = useMemo(() => {
    const visible = deals.filter((d) => !deleted.has(d.id));
    return {
      totalDeals: visible.length,
      openDeals: visible.filter((d) => d.stageName !== "Won" && d.stageName !== "Lost").length,
      wonDeals: visible.filter((d) => d.stageName === "Won").length,
      pipelineValue: visible.reduce((sum, d) => sum + d.value, 0),
      averageDealSize:
      visible.length > 0
        ? visible.reduce((sum, d) => sum + d.value, 0) / visible.length
        : 0,
    };
  }, [deals, deleted]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    let result = deals.filter(
      (deal) => !deleted.has(deal.id)
    );

    if (query) {
      result = result.filter(
        (deal) =>
          deal.name.toLowerCase().includes(query) ||
          deal.companyName.toLowerCase().includes(query) ||
          (deal.primaryContactName?.toLowerCase().includes(query) || "")
      );
    }

    if (filters.stage !== "all") {
      result = result.filter((deal) => deal.stageName === filters.stage);
    }

    if (filters.owner !== "all") {
      result = result.filter((deal) => deal.ownerName === filters.owner);
    }

    if (filters.health !== "all") {
      result = result.filter((deal) => deal.healthStatus === filters.health);
    }

    const sorted = [...result];
    switch (filters.sort) {
      case "newest":
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "recentlyUpdated":
        sorted.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
        break;
      case "highestValue":
        sorted.sort((a, b) => b.value - a.value);
        break;
      case "lowestValue":
        sorted.sort((a, b) => a.value - b.value);
        break;
      case "closestToClosing":
        sorted.sort((a, b) =>
          +new Date(a.expectedCloseDate) - +new Date(b.expectedCloseDate)
        );
        break;
      case "highestProbability":
        sorted.sort((a, b) => b.probability - a.probability);
        break;
      default:
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return sorted;
  }, [deals, filters, deleted]);

  const setFilter = (patch: Partial<DealFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const clearFilters = () => setFilters({ ...defaultDealFilters });

  const handleAddSubmit = (data: DealFormData) => {
    setDeals((prev) => {
      const newDeal = buildDealRecord(data);
      upsertDeal(newDeal);
      return [newDeal, ...prev];
    });
    setEditingDeal(null);
    setAddOpen(false);
    setToast("Deal added");
    window.setTimeout(() => setToast(null), 2000);
  };

  const handleEditSubmit = (data: DealFormData) => {
    if (!editingDeal) return;
    const edit: DealEditFormData = {
      name: data.name,
      value: data.value ?? "",
      currency: data.currency ?? editingDeal.currency,
      probability: data.probability ?? "",
      expectedCloseDate: data.expectedCloseDate ?? editingDeal.expectedCloseDate,
      stageId: data.stageId ?? editingDeal.stageId,
      ownerId: data.ownerId ?? editingDeal.ownerId,
      ownerName: data.ownerName ?? editingDeal.ownerName,
      description: data.description ?? "",
      tags: data.tags ?? "",
      source: data.source ?? editingDeal.source,
      products: data.products ?? editingDeal.products,
    };
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === editingDeal.id
          ? { ...deal, ...applyDealEdit(deal, edit), updatedAt: new Date().toISOString() }
          : deal
      )
    );
    setEditingDeal(null);
    setAddOpen(false);
    setToast("Deal updated");
    window.setTimeout(() => setToast(null), 2000);
  };

  const handleViewExisting = (deal: DealRecord) => {
    setAddOpen(false);
    router.push(`/deals/${deal.id}`);
  };

  const openCreate = () => {
    setEditingDeal(null);
    setAddOpen(true);
  };

  const openEdit = (deal: DealRecord) => {
    setEditingDeal(deal);
    setAddOpen(true);
  };

  if (loading) {
    return <DealsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <DealsHeader
        onAddDeal={openCreate}
        onImport={() => setImportOpen(true)}
      />
      <DealsStats
        totalDeals={stats.totalDeals}
        openDeals={stats.openDeals}
        wonDeals={stats.wonDeals}
        pipelineValue={stats.pipelineValue}
        averageDealSize={stats.averageDealSize}
      />

      <DealsFilters
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        view={view}
        onViewChange={setView}
        resultCount={filtered.length}
      />

      <DealsTable
        deals={filtered}
        selected={selected}
        onToggleSelected={toggleSelected}
        onToggleAll={toggleAll}
        onClearSelection={() => setSelected(new Set())}
        onView={handleViewExisting}
        onEdit={openEdit}
        onClearFilters={clearFilters}
        owners={owners}
      />

      <AddDealDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        owners={owners}
        initial={editingDeal ?? undefined}
        mode={editingDeal ? "edit" : "create"}
        onSubmit={editingDeal ? handleEditSubmit : handleAddSubmit}
        onViewExisting={handleViewExisting}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Deals"
        description="Upload a CSV of deals, map the columns, then review before importing."
        targetFields={[
          { key: "name", label: "Deal Name", required: true },
          { key: "companyName", label: "Company Name", required: true },
          { key: "stageId", label: "Stage" },
          { key: "value", label: "Deal Value" },
          { key: "probability", label: "Probability" },
          { key: "expectedCloseDate", label: "Expected Close Date" },
        ]}
        onImport={(rows) => {
          const created: DealRecord[] = [];
          for (const row of rows) {
            const deal = buildDealRecord({
              name: row.name ?? "",
              companyId: "",
              companyName: row.companyName ?? "",
              stageId: row.stageId as DealRecord["stageId"] ?? "new",
              value: row.value ?? "",
              probability: row.probability ?? "",
              expectedCloseDate: row.expectedCloseDate ?? new Date().toISOString(),
            });
            created.push(deal);
          }
          if (created.length > 0) {
            created.forEach((record) => upsertDeal(record));
            setDeals((prev) => [...created, ...prev]);
            setToast(`${created.length} deals imported`);
            window.setTimeout(() => setToast(null), 2000);
          }
        }}
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

export { DealsPageClient };