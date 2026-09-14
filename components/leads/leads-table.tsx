"use client";

import { useState } from "react";
import { ArrowUpRight, SearchX, Trash2, TrendingUp, X } from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadRow, fullName } from "@/components/leads/lead-row";
import { LeadScoreBadge } from "@/components/leads/lead-score-badge";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { lastActivityLabel, nextFollowUpLabel } from "@/lib/mock-leads";
import type { LeadRecord, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeadsTableProps {
  leads: LeadRecord[];
  converted: Record<string, string>;
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onView: (id: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onConvert: (lead: LeadRecord) => void;
  onAddTask: (lead: LeadRecord) => void;
  onArchive: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
  onBulkAssignOwner: (owner: string) => void;
  onBulkStatus: (status: LeadStatus) => void;
  onBulkConvert: () => void;
  onBulkDelete: () => void;
  onClearFilters: () => void;
  owners: string[];
}

function LeadsTable({
  leads,
  converted,
  selected,
  onToggleSelected,
  onToggleAll,
  onClearSelection,
  onView,
  onEdit,
  onConvert,
  onAddTask,
  onArchive,
  onDelete,
  onBulkAssignOwner,
  onBulkStatus,
  onBulkConvert,
  onBulkDelete,
  onClearFilters,
  owners,
}: LeadsTableProps) {
  const [bulkOwner, setBulkOwner] = useState<string | undefined>();
  const [bulkStatus, setBulkStatus] = useState<string | undefined>();
  const selectedCount = selected.size;
  const allSelected = leads.length > 0 && selectedCount === leads.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/50 px-4 py-2.5">
          <span className="text-[13px] font-medium text-accent-foreground">
            {selectedCount} {selectedCount === 1 ? "lead" : "leads"} selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={bulkOwner}
              onValueChange={(value) => {
                onBulkAssignOwner(value);
                setBulkOwner(undefined);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Assign owner to selected">
                <SelectValue placeholder="Assign owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={bulkStatus}
              onValueChange={(value) => {
                onBulkStatus(value as LeadStatus);
                setBulkStatus(undefined);
              }}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Change status of selected">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {(
                  ["New", "Contacted", "Qualified", "Proposal", "Unqualified"] as const
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="default" size="sm" onClick={onBulkConvert}>
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              Convert
            </Button>
            <Button variant="outline" size="sm" onClick={onBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear selection"
            className="ml-auto text-muted-foreground"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-5 w-5 text-muted-foreground" aria-hidden />
          </span>
          <p className="text-sm font-medium text-ink">No leads match your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try adjusting the search keywords or clearing the active filters to see more leads.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile lead cards */}
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:hidden">
            {leads.map((lead) => {
              const isConverted = Boolean(converted[lead.id]);
              return (
                <div
                  key={lead.id}
                  className="rounded-xl border border-border bg-card p-3"
                  onClick={() => onView(lead.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <InitialsAvatar name={fullName(lead)} className="h-8 w-8" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {fullName(lead)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {lead.companyName}
                        </span>
                      </span>
                    </span>
                    <Checkbox
                      checked={selected.has(lead.id)}
                      onCheckedChange={() => onToggleSelected(lead.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select ${fullName(lead)}`}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <LeadScoreBadge score={lead.score} />
                    <LeadStatusBadge status={lead.status} converted={isConverted} />
                    {isConverted && (
                      <span className="text-[11px] font-medium text-[#15803d]">
                        #{converted[lead.id]}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                    <p className="truncate">{lead.phone}</p>
                    <p className="flex items-center justify-between">
                      <LeadSourceBadge source={lead.source} />
                      <span>{lastActivityLabel(lead.lastActivityAt)}</span>
                    </p>
                    <p>
                      Next follow-up:{" "}
                      <span
                        className={cn(
                          nextFollowUpLabel(lead.nextFollowUpAt ?? "") === "Overdue" &&
                            "font-medium text-danger"
                        )}
                      >
                        {lead.nextFollowUpAt ? nextFollowUpLabel(lead.nextFollowUpAt) : "—"}
                      </span>
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={(event) => {
                        event.stopPropagation();
                        onView(lead.id);
                      }}
                    >
                      Open lead
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="scrollbar-thin hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="w-10 px-3 py-3">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                      aria-label="Select all leads"
                    />
                  </th>
                  <th scope="col" className="px-2 py-3 font-semibold">Lead</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Company</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Contact</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Source</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Score</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Last activity</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Next follow-up</th>
                  <th scope="col" className="w-12 px-2 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    convertedDealId={converted[lead.id]}
                    selected={selected.has(lead.id)}
                    onToggleSelected={onToggleSelected}
                    onView={onView}
                    onEdit={onEdit}
                    onConvert={onConvert}
                    onAddTask={onAddTask}
                    onArchive={onArchive}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

export { LeadsTable };