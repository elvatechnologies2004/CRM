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
  { status: "Unqualified", dot: "bg-slate-400" },
];

interface LeadKanbanProps {
  leads: LeadRecord[];
  converted: Record<string, string>;
  movingLeadId?: string | null;
  onView: (id: string) => void;
  onAddLead: () => void;
  onMoveStage: (id: string, status: LeadStatus) => void;
  onRequestUnqualified: (id: string) => void;
}

function LeadKanban({
  leads,
  converted,
  movingLeadId = null,
  onView,
  onAddLead,
  onMoveStage,
  onRequestUnqualified,
}: LeadKanbanProps) {
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
                  "flex min-h-[120px] flex-col gap-2.5 rounded-xl border border-transparent p-1 transition-colors",
                  isOver && "border-dashed border-primary/50 bg-muted/50 ring-1 ring-primary/30"
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
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
                  setDraggingId(null);
                  const leadId = event.dataTransfer.getData("text/plain");
                  if (!leadId) return;
                  if (columnLeads.some((lead) => lead.id === leadId)) return;
                  if (column.status === "Unqualified") {
                    onRequestUnqualified(leadId);
                    return;
                  }
                  onMoveStage(leadId, column.status);
                }}
              >
                {columnLeads.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
                    <KanbanSquare className="h-4 w-4 text-muted-foreground/60" aria-hidden />
                    <p className="text-xs font-medium text-ink">No leads here</p>
                    <p className="text-[11px] text-muted-foreground">Drag a lead here</p>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <LeadKanbanCard
                      key={lead.id}
                      lead={lead}
                      convertedDealId={converted[lead.id]}
                      dragging={draggingId === lead.id}
                      moving={movingLeadId === lead.id}
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => setDraggingId(null)}
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
