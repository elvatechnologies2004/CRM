"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadsHeader } from "@/components/leads/leads-header";
import { LeadsStats } from "@/components/leads/leads-stats";
import { LeadsFilters, defaultLeadFilters, type LeadFilterState, type ViewMode } from "@/components/leads/leads-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadKanban } from "@/components/leads/lead-kanban";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog";
import { AddTaskDialog, type NewTaskData } from "@/components/leads/add-task-dialog";
import { ImportLeadDialog } from "@/components/leads/import-lead-dialog";
import { UnqualifiedReasonDialog } from "@/components/leads/unqualified-reason-dialog";
import { QualifyLeadDialog, type QualificationFormValues } from "@/components/leads/qualify-lead-dialog";
import { LeadApprovalDialog } from "@/components/leads/lead-approval-dialog";
import { fullName } from "@/components/leads/lead-row";
import {
  convertLeadAction,
  createLeadAction,
  deleteLeadAction,
  updateLeadAction,
  updateLeadStatusAction,
} from "@/app/leads/actions";
import type { LeadFormData } from "@/lib/lead-form";
import {
  markLeadDeleted,
  readConvertedDeals,
  readDeletedLeadIds,
  readLeadStatusOverrides,
  writeConvertedDeal,
  writeLeadStatusOverride,
  writePersistedTask,
} from "@/lib/lead-local";
import type { LeadRecord, LeadStatus, LeadTask, User } from "@/lib/types";

interface LeadsPageClientProps {
  leads: LeadRecord[];
  owners: User[];
}

const LEADS_PAGE_STORAGE_KEY = "finlonexa:leads-page-state";

function readPersistedLeadPageState(): Partial<{ view: ViewMode; filters: LeadFilterState }> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LEADS_PAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<{ view: ViewMode; filters: LeadFilterState }>;
    return parsed;
  } catch {
    return {};
  }
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
  const persistedState = readPersistedLeadPageState();
  const statusOverrides = readLeadStatusOverrides();
  const [leads, setLeads] = useState<LeadRecord[]>(() =>
    initialLeads.map((lead) => ({
      ...lead,
      status: statusOverrides[lead.id] ?? lead.status,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilterState>(persistedState.filters ?? defaultLeadFilters);
  const [view, setView] = useState<ViewMode>(persistedState.view ?? "table");
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

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LEADS_PAGE_STORAGE_KEY,
        JSON.stringify({ view, filters })
      );
    } catch {
      // ignore storage quota or privacy errors
    }
  }, [view, filters]);

  const [addOpen, setAddOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [convertingLead, setConvertingLead] = useState<LeadRecord | null>(null);
  const [addTaskFor, setAddTaskFor] = useState<LeadRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingKanban, setPendingKanban] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{ id: string; status: LeadStatus } | null>(null);
  const [pendingStageAi, setPendingStageAi] = useState<string | null>(null);
  const [pendingStageAiLoading, setPendingStageAiLoading] = useState(false);
  const [qualifyLeadId, setQualifyLeadId] = useState<string | null>(null);
  const [unqualifiedLeadId, setUnqualifiedLeadId] = useState<string | null>(null);

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

  const handleAddSubmit = async (data: LeadFormData): Promise<boolean> => {
    const owner = owners.find((candidate) => candidate.name === data.ownerName);
    const input = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      country: data.country,
      city: data.city,
      source: data.source,
      status: data.status,
      expectedValue: data.expectedValue,
      interest: data.interest,
      tags: data.tags,
      notes: data.notes,
      ownerId: owner?.id,
    };

    if (editingLead) {
      const result = await updateLeadAction({ id: editingLead.id, ...input });
      if (result.error || !result.lead) {
        setToast(result.error || "Failed to update lead");
        window.setTimeout(() => setToast(null), 2400);
        return false;
      }
      setLeads((prev) =>
        prev.map((lead) => (lead.id === editingLead.id ? result.lead! : lead))
      );
    } else {
      const result = await createLeadAction(input);
      if (result.error || !result.lead) {
        setToast(result.error || "Failed to create lead");
        window.setTimeout(() => setToast(null), 2400);
        return false;
      }
      setLeads((prev) => [result.lead!, ...prev]);
    }
    const wasCreating = !editingLead;
    setEditingLead(null);
    setAddOpen(false);
    if (wasCreating) setPendingKanban(true);
    return true;
  };

  const openEdit = (lead: LeadRecord) => {
    setEditingLead(lead);
    setAddOpen(true);
  };

  const openCreate = () => {
    setEditingLead(null);
    setAddOpen(true);
  };

  const handleConvert = async (lead: LeadRecord): Promise<string | null> => {
    const result = await convertLeadAction(lead.id);
    const dealId = result.dealId;

    if (result.error || !dealId) {
      setToast(result.error || "Failed to convert lead");
      return null;
    }

    writeConvertedDeal(lead.id, dealId);
    setConverted((prev) => ({ ...prev, [lead.id]: dealId }));
    router.push(`/deals/${dealId}`);
    return dealId;
  };

  const handleArchive = (lead: LeadRecord) => {
    setArchived((prev) => new Set(prev).add(lead.id));
  };

  const handleKanbanStatus = async (id: string, status: LeadStatus) => {
    if (status === "Qualified") {
      setQualifyLeadId(id);
      return;
    }

    if (status === "Unqualified") {
      setUnqualifiedLeadId(id);
      return;
    }

    setPendingStageChange({ id, status });
  };

  const confirmStageChange = async () => {
    if (!pendingStageChange) return;

    const { id, status } = pendingStageChange;
    const previous = leads.find((lead) => lead.id === id)?.status ?? null;

    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    writeLeadStatusOverride(id, status);

    const result = await updateLeadStatusAction(id, status, { source: "kanban-approval" });
    if (result.error || !result.lead) {
      if (previous) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, status: previous } : lead))
        );
      }
      setToast(result.error || "Failed to update lead stage");
      setPendingStageChange(null);
      return;
    }

    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status: result.lead!.status } : lead))
    );
    setPendingStageChange(null);
  };

  const handleRequestUnqualified = (id: string) => {
    setUnqualifiedLeadId(id);
  };

  const handleUseAiInsight = async () => {
    setPendingStageAiLoading(true);
    try {
      const response = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error("AI analysis unavailable");
      }
      const payload = (await response.json()) as { insight?: { headline?: string; detail?: string } };
      const nextText = payload.insight?.headline || payload.insight?.detail || "AI suggestion generated.";
      setPendingStageAi(nextText);
      setToast(nextText);
    } catch {
      const fallback = "AI analysis is not available right now. You can continue manually.";
      setPendingStageAi(fallback);
      setToast(fallback);
    } finally {
      setPendingStageAiLoading(false);
    }
  };

  const handleApproveQualification = async (values: QualificationFormValues) => {
    if (!qualifyLeadId) return;
    const leadId = qualifyLeadId;
    const previous = leads.find((lead) => lead.id === leadId)?.status ?? null;

    const result = await updateLeadStatusAction(leadId, "Qualified", {
      source: "qualification-modal",
      reason: values.notes || "Qualified by approval",
      notes: values.notes,
    });

    if (result.error || !result.lead) {
      if (previous) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, status: previous } : lead))
        );
      }
      setToast(result.error || "Failed to qualify lead");
      setQualifyLeadId(null);
      return;
    }

    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, status: result.lead!.status } : lead))
    );
    writeLeadStatusOverride(leadId, "Qualified");
    setToast("Lead qualified successfully");
    setQualifyLeadId(null);
  };

  const handleConfirmUnqualified = async (reason: string, notes: string) => {
    if (!unqualifiedLeadId) return;
    const leadId = unqualifiedLeadId;
    const previous = leads.find((lead) => lead.id === leadId)?.status ?? null;

    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, status: "Unqualified" } : lead))
    );
    writeLeadStatusOverride(leadId, "Unqualified");

    const result = await updateLeadStatusAction(leadId, "Unqualified", {
      source: "unqualified-dialog",
      reason,
      notes,
    });
    if (result.error || !result.lead) {
      if (previous) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, status: previous } : lead))
        );
      }
      setToast(result.error || "Failed to mark lead as unqualified");
      setUnqualifiedLeadId(null);
      return;
    }

    if (reason) {
      setToast(`Lead marked as Unqualified (${reason})`);
    } else {
      setToast("Lead marked as Unqualified");
    }
    if (notes.trim()) {
      setToast((prev) => prev ?? "Lead marked as Unqualified");
    }
    setUnqualifiedLeadId(null);
  };

  const qualifyLead =
    qualifyLeadId !== null ? leads.find((lead) => lead.id === qualifyLeadId) ?? null : null;
  const unqualifiedLead =
    unqualifiedLeadId !== null ? leads.find((lead) => lead.id === unqualifiedLeadId) ?? null : null;

  const handleDeleteRow = async (lead: LeadRecord) => {
    const result = await deleteLeadAction(lead.id);
    if (!result.ok) {
      setToast(result.error || "Failed to delete lead");
      return;
    }

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
    setToast("Lead deleted");
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
      prev.map((lead) => {
        if (!selected.has(lead.id)) return lead;
        writeLeadStatusOverride(lead.id, status);
        return { ...lead, status };
      })
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

  const bulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;

    const results = await Promise.all(ids.map((id) => deleteLeadAction(id)));
    if (results.some((result) => !result.ok)) {
      setToast("One or more leads could not be deleted");
      return;
    }

    for (const id of ids) {
      markLeadDeleted(id);
    }
    setLeads((prev) => prev.filter((lead) => !selected.has(lead.id)));
    setSelected(new Set());
    setToast(`${ids.length} lead${ids.length > 1 ? "s" : ""} deleted`);
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
          movingLeadId={null}
          onView={viewLead}
          onAddLead={openCreate}
          onMoveStage={handleKanbanStatus}
          onRequestUnqualified={handleRequestUnqualified}
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

      <Dialog open={pendingKanban} onOpenChange={setPendingKanban}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead saved</DialogTitle>
            <DialogDescription>
              Your lead has been saved successfully. Move to the Kanban board?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingKanban(false)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                setPendingKanban(false);
                setView("kanban");
              }}
            >
              Yes, open Kanban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadApprovalDialog
        open={Boolean(pendingStageChange)}
        onOpenChange={(open) => {
          if (!open) setPendingStageChange(null);
        }}
        title={
          pendingStageChange?.status === "Contacted"
            ? "Move lead to Contacted?"
            : pendingStageChange?.status === "Proposal"
              ? "Move lead to Proposal?"
              : "Approve stage change?"
        }
        description="The system detected a meaningful sales update and prepared the next stage for your review."
        summary={
          pendingStageChange?.status === "Contacted"
            ? "This will move the lead from New to Contacted and log the customer interaction as a valid sales touchpoint."
            : pendingStageChange?.status === "Proposal"
              ? "This will update the lead into Proposal stage and keep the sales workflow ready for the next action."
              : "This action will update the lead stage and log the change with the approval context."
        }
        primaryLabel="Approve & Move"
        secondaryLabel="Not now"
        showAi={pendingStageChange?.status === "Contacted"}
        onAi={handleUseAiInsight}
        aiSummary={pendingStageAi}
        aiLoading={pendingStageAiLoading}
        onApprove={confirmStageChange}
      />

      <QualifyLeadDialog
        open={Boolean(qualifyLeadId)}
        onOpenChange={(open) => {
          if (!open) setQualifyLeadId(null);
        }}
        lead={qualifyLead}
        onConfirm={handleApproveQualification}
      />

      <UnqualifiedReasonDialog
        open={Boolean(unqualifiedLeadId)}
        onOpenChange={(open) => {
          if (!open) setUnqualifiedLeadId(null);
        }}
        leadName={unqualifiedLead ? fullName(unqualifiedLead) : ""}
        onConfirm={handleConfirmUnqualified}
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