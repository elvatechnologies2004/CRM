"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Filter, Kanban, Search, TableProperties } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ExportDataDialog } from "@/components/exports/export-data-dialog";
import { RecordManagementMenu } from "@/components/crm/record-management-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DealRecord } from "@/lib/types";

const stageList = [
  "New Opportunity",
  "Meeting Done",
  "Proposal Submitted",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

function formatMoney(value: number, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value || value === "Invalid Date") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function stageVariant(stageName: string) {
  if (stageName === "New Opportunity") return "secondary";
  if (stageName === "Meeting Done") return "info";
  if (stageName === "Proposal Submitted") return "purple";
  if (stageName === "Negotiation") return "warning";
  if (stageName === "Closed Won") return "success";
  if (stageName === "Closed Lost") return "danger";
  return "outline";
}

interface OpportunitiesPageClientProps {
  initialDeals: DealRecord[];
  archiveFilter: "active" | "archived" | "all";
}

export function OpportunitiesPageClient({ initialDeals, archiveFilter }: OpportunitiesPageClientProps) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [exportOpen, setExportOpen] = useState(false);

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialDeals.filter((deal) => {
      const haystack = [deal.name, deal.companyName, deal.primaryContactName, deal.ownerName, deal.stageName]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesStage = stageFilter === "all" || deal.stageName === stageFilter;
      const matchesOwner = ownerFilter === "all" || deal.ownerName === ownerFilter;
      return matchesSearch && matchesStage && matchesOwner;
    });
  }, [initialDeals, search, stageFilter, ownerFilter]);

  const stats = useMemo(() => {
    const active = filteredDeals.filter((deal) => !["Closed Won", "Closed Lost"].includes(deal.stageName)).length;
    return {
      total: filteredDeals.length,
      active,
      pipelineValue: filteredDeals.reduce((sum, deal) => sum + deal.value, 0),
      won: filteredDeals.filter((deal) => deal.stageName === "Closed Won").length,
    };
  }, [filteredDeals]);

  const owners = useMemo(() => Array.from(new Set(initialDeals.map((deal) => deal.ownerName).filter(Boolean))), [initialDeals]);

  const kanbanColumns = stageList.map((stage) => ({
    stage,
    items: filteredDeals.filter((deal) => deal.stageName === stage),
  }));

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Opportunities</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track qualified sales opportunities through the sales pipeline.</p>
        </div>
        <Button variant="outline" onClick={() => setExportOpen(true)}>Export Data</Button>
      </div>

      <ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} defaultScope="opportunities" title="Export Opportunities" />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Opportunities", value: stats.total },
          { label: "Active Opportunities", value: stats.active },
          { label: "Pipeline Value", value: formatMoney(stats.pipelineValue) },
          { label: "Won Opportunities", value: stats.won },
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
                placeholder="Search opportunities..."
                className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stageList.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={archiveFilter} onValueChange={(value) => { window.location.href = `/opportunities?archive=${value}`; }}>
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
            <Button type="button" variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => setView("table")}>
              <TableProperties className="h-4 w-4" aria-hidden />
              Table
            </Button>
            <Button type="button" variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>
              <Kanban className="h-4 w-4" aria-hidden />
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
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Expected Close</th>
                  <th className="px-4 py-3">Next Step</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => router.push(`/opportunities/${deal.id}`)} className="text-left font-medium text-ink">
                        {deal.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground">{deal.companyName || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{deal.primaryContactName || "—"}</td>
                    <td className="px-4 py-3"><Badge variant={stageVariant(deal.stageName)}>{deal.stageName || "New Opportunity"}</Badge></td>
                    <td className="px-4 py-3 text-foreground">{formatMoney(deal.value, deal.currency || "PKR")}</td>
                    <td className="px-4 py-3 text-foreground">{deal.ownerName || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{formatDate(deal.expectedCloseDate)}</td>
                    <td className="px-4 py-3 text-foreground">Schedule Meeting</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/opportunities/${deal.id}`)}>{deal.stageName === "Closed Won" || deal.stageName === "Closed Lost" ? "View" : "Open"}</Button>
                        <RecordManagementMenu type="opportunity" id={deal.id} name={deal.name} closed={deal.stageName === "Closed Won" || deal.stageName === "Closed Lost"} archived={Boolean(deal.archivedAt)} directDelete onRefresh={() => router.refresh()} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-6">
          {kanbanColumns.map(({ stage, items }) => (
            <div key={stage} className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{stage}</h2>
                <Badge variant={stageVariant(stage)}>{items.length}</Badge>
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No opportunities in this stage.
                  </div>
                ) : (
                  items.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => router.push(`/opportunities/${deal.id}`)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-left shadow-sm transition hover:border-primary/50 hover:bg-muted/30"
                    >
                      <div className="font-medium text-ink">{deal.name}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{deal.companyName || "—"}</div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{deal.ownerName || "—"}</span>
                        <span>{formatMoney(deal.value, deal.currency || "PKR")}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
