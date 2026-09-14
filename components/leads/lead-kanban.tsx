"use client";

import { useState } from "react";
import { KanbanSquare, Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { LeadKanbanCard } from "@/components/leads/lead-kanban-card";
import type { LeadRecord, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusColumns: { status: LeadStatus; dot: string }[] = [
  { status: "New", dot: "bg-brand-blue" },
  { status: "Contacted", dot: "bg-brand-purple" },
  { status: "Qualified", dot: "bg-success" },
  { status: "Proposal", dot: "bg-warning" },
  { status: "Unqualified", dot: "bg-slate-400" },
];

interface LeadKanbanProps {
  leads: LeadRecord[];
  converted: Record<string, string>;
  onView: (id: string) => void;
  onAddLead: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
}

function LeadKanban({ leads, converted, onView, onAddLead, onStatusChange }: LeadKanbanProps) {
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="scrollbar-thin flex gap-4 overflow-x-auto p-4">
        {statusColumns.map((column) => {
          const columnLeads = leads.filter((lead) => lead.status === column.status);
          const isOver = dragOver === column.status;
          return (
            <div key={column.status} className="flex w-[272px] shrink-0 flex-col">
              <div className="flex items-center justify-between px-1 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", column.dot)} aria-hidden />
                  <span className="text-[13px] font-semibold text-ink">{column.status}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {columnLeads.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onAddLead}
                  aria-label={`Add lead to ${column.status}`}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div
                className={cn(
                  "flex flex-col gap-2.5 rounded-xl transition-colors",
                  isOver && "bg-muted/50 ring-1 ring-primary/40"
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(column.status);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDragOver((prev) => (prev === column.status ? null : prev));
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(null);
                  const leadId = event.dataTransfer.getData("text/plain");
                  if (leadId && columnLeads.every((lead) => lead.id !== leadId)) {
                    onStatusChange(leadId, column.status);
                  }
                }}
              >
                {columnLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
                    <KanbanSquare className="h-4 w-4 text-muted-foreground/60" aria-hidden />
                    <p className="text-xs text-muted-foreground">No leads here</p>
                    <button
                      type="button"
                      onClick={onAddLead}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Add a lead
                    </button>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <LeadKanbanCard
                      key={lead.id}
                      lead={lead}
                      convertedDealId={converted[lead.id]}
                      onView={onView}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export { LeadKanban };