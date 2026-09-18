"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, Plus, ArrowRight, Kanban as KanbanIcon, TableProperties } from "lucide-react";

import { AddLeadDialog, type AddLeadFormState } from "@/components/leads/add-lead-dialog";
import { ExportDataDialog } from "@/components/exports/export-data-dialog";
import { RecordManagementMenu } from "@/components/crm/record-management-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLeadAction } from "@/app/leads/actions";
import { getLeadNextStep } from "@/lib/leads-workflow";
import type { LeadRecord, LeadStatus, LeadSourceOption, User } from "@/lib/types";

const stageOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Unqualified"];
const sourceOptions: LeadSourceOption[] = [
  "Website",
  "WhatsApp",
  "LinkedIn",
  "Facebook",
  "Instagram",
  "Referral",
  "Email",
  "Cold Call",
  "Manual",
  "Other",
];

function formatLabel(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

function formatDateDisplay(value: string | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function stageBadgeVariant(stage: LeadStatus) {
  switch (stage) {
    case "New":
      return "secondary";
    case "Contacted":
      return "info";
    case "Qualified":
      return "success";
    case "Unqualified":
      return "danger";
    default:
      return "outline";
  }
}

interface LeadsPageClientProps {
  initialLeads: LeadRecord[];
  owners: User[];
  archiveFilter: "active" | "archived" | "all";
}

export function LeadsPageClient({ initialLeads, owners, archiveFilter }: LeadsPageClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[]>(initialLeads);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ownerNames = useMemo(() => owners.map((owner) => owner.name), [owners]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const haystack = [
        lead.firstName,
        lead.lastName,
        lead.companyName,
        lead.email,
        lead.phone,
        lead.ownerName,
        lead.source,
        lead.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesStage = stageFilter === "all" || lead.status === stageFilter;
      const matchesOwner = ownerFilter === "all" || lead.ownerName === ownerFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      return matchesSearch && matchesStage && matchesOwner && matchesSource;
    });
  }, [leads, search, stageFilter, ownerFilter, sourceFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((lead) => lead.status === "New").length,
      contacted: leads.filter((lead) => lead.status === "Contacted").length,
      qualified: leads.filter((lead) => lead.status === "Qualified").length,
      unqualified: leads.filter((lead) => lead.status === "Unqualified").length,
    };
  }, [leads]);

  const handleCreateLead = async (values: AddLeadFormState) => {
    setSubmitting(true);
    try {
      const firstName = values.customerName.trim().split(" ")[0] ?? values.customerName.trim();
      const lastName = values.customerName.trim().split(" ").slice(1).join(" ") || "";
      const owner = owners.find((candidate) => candidate.name === values.owner);
      const result = await createLeadAction({
        firstName,
        lastName,
        email: values.email,
        phone: values.phone,
        companyName: values.company,
        source: values.source as LeadSourceOption,
        ownerId: owner?.id,
        notes: values.notes,
      });

      if (result.error || !result.lead) {
        window.alert(result.error || "Failed to create lead.");
        return;
      }

      setLeads((prev) => [result.lead!, ...prev]);
      setSearch("");
      setStageFilter("all");
      setOwnerFilter("all");
      setSourceFilter("all");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const kanbanColumns = stageOptions.map((state) => ({
    state,
    items: filteredLeads.filter((lead) => lead.status === state),
  }));

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and progress potential customers through your sales process.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="lg" variant="outline" onClick={() => setExportOpen(true)}>
            Export Data
          </Button>
          <Button size="lg" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Lead
          </Button>
        </div>
      </div>

      <ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} defaultScope="leads" title="Export Leads" />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Leads", value: stats.total },
          { label: "New", value: stats.new },
          { label: "Contacted", value: stats.contacted },
          { label: "Qualified", value: stats.qualified },
          { label: "Unqualified", value: stats.unqualified },
        ].map((card) => (
          <Card key={card.label} className="p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm text-muted-foreground min-w-[260px]">
              <Search className="h-4 w-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads..."
                className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stageOptions.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {ownerNames.map((owner) => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={archiveFilter} onValueChange={(value) => { window.location.href = `/leads?archive=${value}`; }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Records" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={view === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("table")}
            >
              <TableProperties className="h-4 w-4" aria-hidden />
              Table
            </Button>
            <Button
              type="button"
              variant={view === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("kanban")}
            >
              <KanbanIcon className="h-4 w-4" aria-hidden />
              Kanban
            </Button>
          </div>
        </div>
      </Card>

      {view === "table" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3">Next Step</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const nextStep = getLeadNextStep(lead.status);
                  return (
                    <tr key={lead.id} className="border-t border-border align-top">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => router.push(`/leads/${lead.id}`)}
                          className="text-left"
                        >
                          <div className="font-medium text-ink">{`${lead.firstName} ${lead.lastName}`.trim() || "Unnamed lead"}</div>
                          <div className="text-xs text-muted-foreground">{lead.email || "—"}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-foreground">{formatLabel(lead.companyName)}</td>
                      <td className="px-4 py-3 text-foreground">{formatLabel(lead.phone || lead.email)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={stageBadgeVariant(lead.status)}>{lead.status.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">{formatLabel(lead.source)}</td>
                      <td className="px-4 py-3 text-foreground">{formatLabel(lead.ownerName)}</td>
                      <td className="px-4 py-3 text-foreground">{formatDateDisplay(lead.lastActivityAt)}</td>
                      <td className="px-4 py-3 text-foreground">{nextStep.title}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/leads/${lead.id}`)}>Open <ArrowRight className="h-4 w-4" aria-hidden /></Button>
                          <RecordManagementMenu type="lead" id={lead.id} name={`${lead.firstName} ${lead.lastName}`.trim() || "Lead"} converted={Boolean(lead.convertedDealId)} archived={Boolean(lead.archivedAt)} directDelete onRefresh={() => router.refresh()} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {kanbanColumns.map(({ state, items }) => (
            <div key={state} className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{state}</h2>
                <Badge variant={stageBadgeVariant(state)}>{items.length}</Badge>
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No leads in this stage.
                  </div>
                ) : (
                  items.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-left shadow-sm transition hover:border-primary/50 hover:bg-muted/30"
                    >
                      <div className="font-medium text-ink">{`${lead.firstName} ${lead.lastName}`.trim() || "Unnamed lead"}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{formatLabel(lead.companyName)}</div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatLabel(lead.ownerName)}</span>
                        <span>{getLeadNextStep(lead.status).title}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddLeadDialog
        open={addOpen}
        owners={ownerNames}
        loading={submitting}
        onOpenChange={setAddOpen}
        onCreate={handleCreateLead}
      />
    </main>
  );
}
