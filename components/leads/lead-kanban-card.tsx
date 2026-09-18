"use client";

import { Loader2, MousePointerClick } from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { LeadScoreBadge } from "@/components/leads/lead-score-badge";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { fullName } from "@/components/leads/lead-row";
import { nextFollowUpLabel } from "@/lib/mock-leads";
import type { LeadRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeadKanbanCardProps {
  lead: LeadRecord;
  convertedDealId?: string;
  dragging?: boolean;
  moving?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onView: (id: string) => void;
}

function LeadKanbanCard({
  lead,
  convertedDealId,
  dragging = false,
  moving = false,
  onDragStart,
  onDragEnd,
  onView,
}: LeadKanbanCardProps) {
  const isConverted = Boolean(convertedDealId);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", lead.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onView(lead.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(lead.id);
        }
      }}
      className={cn(
        "group relative cursor-pointer select-none rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        dragging && "opacity-50 ring-2 ring-primary/40"
      )}
    >
      {moving && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/70 backdrop-blur-[1px]">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          <span className="sr-only">Moving lead…</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{fullName(lead)}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.companyName}</p>
        </div>
        <InitialsAvatar name={fullName(lead)} className="h-7 w-7 text-[10px]" />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <LeadScoreBadge score={lead.score} />
        <LeadStatusBadge status={lead.status} converted={isConverted} />
      </div>
      {isConverted && (
        <p className="mt-1 text-[11px] font-medium text-[#15803d]">Deal #{convertedDealId}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <LeadSourceBadge source={lead.source} />
        <span
          className={cn(
            "shrink-0",
            lead.nextFollowUpAt && nextFollowUpLabel(lead.nextFollowUpAt) === "Overdue"
              ? "font-medium text-danger"
              : ""
          )}
        >
          {lead.nextFollowUpAt ? nextFollowUpLabel(lead.nextFollowUpAt) : "—"}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border/70 pt-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <InitialsAvatar name={lead.ownerName} className="h-5 w-5 text-[9px]" />
          {lead.ownerName}
        </span>
        <span className="font-medium text-ink">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: lead.currency,
            maximumFractionDigits: 0,
          }).format(lead.expectedValue)}
        </span>
      </div>

      <span className="mt-2 hidden items-center gap-1 text-[11px] text-primary group-hover:flex">
        <MousePointerClick className="h-3 w-3" aria-hidden />
        Open lead
      </span>
    </div>
  );
}

export { LeadKanbanCard };
