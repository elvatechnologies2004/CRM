"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { LeadsHeader } from "@/components/leads/leads-header";
import { LeadsStats } from "@/components/leads/leads-stats";
import { LeadsFilters, defaultLeadFilters, type LeadFilterState, type ViewMode } from "@/components/leads/leads-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadKanban } from "@/components/leads/lead-kanban";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog";
import { AddTaskDialog, type NewTaskData } from "@/components/leads/add-task-dialog";
import { ImportLeadDialog } from "@/components/leads/import-lead-dialog";
import { fullName } from "@/components/leads/lead-row";
import { buildLeadRecord, type LeadFormData } from "@/lib/lead-form";
import {
  markLeadDeleted,
  readConvertedDeals,
  readDeletedLeadIds,
  writeConvertedDeal,
  writePersistedTask,
} from "@/lib/lead-local";
import type { LeadRecord, LeadStatus, LeadTask, User } from "@/lib/types";

interface LeadsPageClientProps {
  leads: LeadRecord[];
  owners: User[];
}

function leadMatchesSearch(lead: LeadRecord, query: string) {
  const haystack = [
    lead.firstName,
    lead.lastName,
    lead.companyName,
    lead.email,
    lead.jobTitle,
    lead.country,
    lead.city,
    ...lead.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function LeadsSkeleton() {
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
        {["Total", "New", "Qualified", "Hot", "Conversion"].map((label) => (
          <Skeleton key={label} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[92px]" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}

function LeadsPageClient({ leads: initialLeads, owners }: LeadsPageClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[]>(initialLeads);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilterState>(defaultLeadFilters);
  const [view, setView] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [converted, setConverted] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const [addOpen, setAddOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [convertingLead, setConvertingLead] = useState<LeadRecord | null>(null);
  const [addTaskFor, setAddTaskFor] = useState<LeadRecord | null>(null);
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
      const storedDeleted = readDeletedLeadIds();
      const stored = readConvertedDeals();
      if (storedDeleted.length > 0) setDeleted(new Set(storedDeleted));
      if (Object.keys(stored).length > 0) {
        setConverted(stored);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const ownerNames = useMemo(() => owners.map((owner) => owner.name), [owners]);
  const countries = useMemo(
    () =>
      [...new Set(leads.map((lead) => lead.country).filter(Boolean))].sort(),
    [leads]
  );
  const tags = useMemo(
    () => [...new Set(leads.flatMap((lead) => lead.tags))].sort(),
    [leads]
  );

  const stats = useMemo(() => {
    const visible = leads.filter(
      (lead) => !archived.has(lead.id) && !deleted.has(lead.id)
    );
    const total = visible.length;
    const newLeads = visible.filter((lead) => lead.status === "New").length;
    const qualified = visible.filter((lead) => lead.status === "Qualified").length;
    const hot = visible.filter((lead) => lead.score >= 80).length;
    const conversionRate = total > 0 ? Math.round((qualified / total) * 100) : 0;
    return { total, newLeads, qualified, hot, conversionRate };
  }, [leads, archived, deleted]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    let result = leads.filter(
      (lead) => !archived.has(lead.id) && !deleted.has(lead.id)
    );

    if (query) {
      result = result.filter((lead) => leadMatchesSearch(lead, query));
    }
    if (filters.status !== "all") {
      result = result.filter((lead) => lead.status === filters.status);
    }
    if (filters.source !== "all") {
      result = result.filter((lead) => lead.source === filters.source);
    }
    if (filters.owner !== "all") {
      result = result.filter((lead) => lead.ownerName === filters.owner);
    }
    if (filters.score !== "all") {
      result = result.filter((lead) => {
        if (filters.score === "hot") return lead.score >= 80;
        if (filters.score === "warm") return lead.score >= 60 && lead.score < 80;
        return lead.score < 60;
      });
    }
    if (filters.country !== "all") {
      result = result.filter((lead) => lead.country === filters.country);
    }
    if (filters.created !== "all") {
      const days = filters.created === "7d" ? 7 : filters.created === "30d" ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((lead) => new Date(lead.createdAt) >= cutoff);
    }
    if (filters.value !== "all") {
      result = result.filter((lead) => {
        if (filters.value === "<5k") return lead.expectedValue < 5000;
        if (filters.value === "5k-15k") return lead.expectedValue >= 5000 && lead.expectedValue <= 15000;
        return lead.expectedValue > 15000;
      });
    }
    if (filters.tag !== "all") {
      result = result.filter((lead) => lead.tags.includes(filters.tag));
    }

    const sorted = [...result];
    sortLeads(sorted, filters.sort);
    return sorted;
  }, [leads, archived, deleted, filters]);

  const setFilter = (patch: Partial<LeadFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const clearFilters = () => setFilters({ ...defaultLeadFilters });

  const handleAddSubmit = (data: LeadFormData) => {
    setLeads((prev) => {
      if (editingLead) {
        const updated = buildLeadRecord(data, { owners, existing: editingLead });
        return prev.map((lead) => (lead.id === editingLead.id ? updated : lead));
      }
      const created = buildLeadRecord(data, { owners });
      return [created, ...prev];
    });
    setEditingLead(null);
    setAddOpen(false);
  };

  const openEdit = (lead: LeadRecord) => {
    setEditingLead(lead);
    setAddOpen(true);
  };

  const openCreate = () => {
    setEditingLead(null);
    setAddOpen(true);
  };

  const handleConvert = (lead: LeadRecord, dealId: string) => {
    writeConvertedDeal(lead.id, dealId);
    setConverted((prev) => ({ ...prev, [lead.id]: dealId }));
  };

  const handleArchive = (lead: LeadRecord) => {
    setArchived((prev) => new Set(prev).add(lead.id));
  };

  const handleKanbanStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
  };

  const handleDeleteRow = (lead: LeadRecord) => {
    markLeadDeleted(lead.id);
    setLeads((prev) => prev.filter((item) => item.id !== lead.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(lead.id);
      return next;
    });
    setArchived((prev) => {
      const next = new Set(prev);
      next.delete(lead.id);
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
    setSelected(checked ? new Set(filtered.map((lead) => lead.id)) : new Set());
  };

  const bulkAssignOwner = (ownerName: string) => {
    setLeads((prev) =>
      prev.map((lead) =>
        selected.has(lead.id)
          ? {
              ...lead,
              ownerName,
              ownerId: owners.find((owner) => owner.name === ownerName)?.id ?? lead.ownerId,
            }
          : lead
      )
    );
  };

  const bulkStatus = (status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((lead) => (selected.has(lead.id) ? { ...lead, status } : lead))
    );
  };

  const bulkConvert = () => {
    const next = { ...converted };
    for (const id of selected) {
      if (!next[id]) {
        const dealId = `DEAL-${1042 + Math.floor(Math.random() * 800)}`;
        next[id] = dealId;
        writeConvertedDeal(id, dealId);
      }
    }
    setConverted(next);
  };

  const bulkDelete = () => {
    for (const id of selected) {
      markLeadDeleted(id);
    }
    setLeads((prev) => prev.filter((lead) => !selected.has(lead.id)));
    setSelected(new Set());
  };

  const handleTaskSubmit = (task: NewTaskData) => {
    if (!addTaskFor) return;
    const leadTask: LeadTask = {
      id: `t_${Date.now().toString(36)}`,
      title: task.title,
      due: task.due,
      priority: task.priority,
      status: "Open",
      owner: task.owner,
    };
    writePersistedTask(addTaskFor.id, leadTask);
    setToast(`Task added for ${fullName(addTaskFor)}`);
    setAddTaskFor(null);
  };

  const viewLead = (id: string) => {
    router.push(`/leads/${id}`);
  };

  const importLeads = (imported: LeadRecord[]) => {
    if (imported.length > 0) {
      setLeads((prev) => [...imported, ...prev]);
    }
  };

  if (loading) {
    return <LeadsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <LeadsHeader onAddLead={openCreate} onImport={() => router.push("/leads/import")} />
      <LeadsStats stats={stats} />

      <LeadsFilters
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        view={view}
        onViewChange={setView}
        owners={ownerNames}
        countries={countries}
        tags={tags}
        resultCount={filtered.length}
      />

      {view === "table" ? (
        <LeadsTable
          leads={filtered}
          converted={converted}
          selected={selected}
          onToggleSelected={toggleSelected}
          onToggleAll={toggleAll}
          onClearSelection={() => setSelected(new Set())}
          onView={viewLead}
          onEdit={openEdit}
          onConvert={(lead) => setConvertingLead(lead)}
          onAddTask={(lead) => setAddTaskFor(lead)}
          onArchive={handleArchive}
          onDelete={handleDeleteRow}
          onBulkAssignOwner={bulkAssignOwner}
          onBulkStatus={bulkStatus}
          onBulkConvert={bulkConvert}
          onBulkDelete={bulkDelete}
          onClearFilters={clearFilters}
          owners={ownerNames}
        />
      ) : (
        <LeadKanban
          leads={filtered}
          converted={converted}
          onView={viewLead}
          onAddLead={openCreate}
          onStatusChange={handleKanbanStatus}
        />
      )}

      <AddLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        owners={owners}
        initial={editingLead ? leadToForm(editingLead) : null}
        mode={editingLead ? "edit" : "create"}
        onSubmit={handleAddSubmit}
      />

      <ConvertLeadDialog
        open={Boolean(convertingLead)}
        onOpenChange={(open) => {
          if (!open) setConvertingLead(null);
        }}
        lead={convertingLead}
        owners={owners}
        onConvert={handleConvert}
      />

      <AddTaskDialog
        open={Boolean(addTaskFor)}
        onOpenChange={(open) => {
          if (!open) setAddTaskFor(null);
        }}
        owners={owners}
        defaultOwner={addTaskFor?.ownerName ?? ""}
        onSubmit={handleTaskSubmit}
      />

      <ImportLeadDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        owners={owners}
        onImport={importLeads}
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

function sortLeads(leads: LeadRecord[], sort: LeadFilterState["sort"]) {
  switch (sort) {
    case "newest":
      leads.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      break;
    case "oldest":
      leads.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      break;
    case "score":
      leads.sort((a, b) => b.score - a.score);
      break;
    case "recent":
      leads.sort((a, b) => +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt));
      break;
  }
}

function leadToForm(lead: LeadRecord): Partial<LeadFormData> {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    companyName: lead.companyName,
    jobTitle: lead.jobTitle,
    country: lead.country,
    city: lead.city,
    source: lead.source,
    status: lead.status,
    ownerName: lead.ownerName,
    expectedValue: lead.expectedValue ? String(lead.expectedValue) : "",
    interest: lead.interest,
    tags: lead.tags.join(", "),
    notes: "",
  };
}

export { LeadsPageClient };