"use client";

import {
  Archive,
  CalendarPlus,
  CheckCircle2,
  Eye,
  Mail,
  MessageCircle,
  MoreHorizontal,
  PencilLine,
  Phone,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadScoreBadge } from "@/components/leads/lead-score-badge";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { lastActivityLabel, nextFollowUpLabel } from "@/lib/mock-leads";
import type { LeadRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function fullName(lead: LeadRecord) {
  return `${lead.firstName} ${lead.lastName}`.trim();
}

interface LeadRowProps {
  lead: LeadRecord;
  convertedDealId?: string;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onConvert: (lead: LeadRecord) => void;
  onAddTask: (lead: LeadRecord) => void;
  onArchive: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
}

function LeadRow({
  lead,
  convertedDealId,
  selected,
  onToggleSelected,
  onView,
  onEdit,
  onConvert,
  onAddTask,
  onArchive,
  onDelete,
}: LeadRowProps) {
  const isConverted = Boolean(convertedDealId);
  const followUpLabel = lead.nextFollowUpAt
    ? nextFollowUpLabel(lead.nextFollowUpAt)
    : "—";
  const followUpOverdue = followUpLabel === "Overdue";

  const stop = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <tr
      onClick={() => onView(lead.id)}
      className="group cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/50"
      aria-label={`Open lead ${fullName(lead)}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(lead.id);
        }
      }}
    >
      <td className="w-10 px-3 py-3" onClick={stop}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelected(lead.id)}
          aria-label={`Select ${fullName(lead)}`}
        />
      </td>
      <td className="px-2 py-3">
        <span className="flex items-center gap-2.5">
          <InitialsAvatar
            name={fullName(lead)}
            className="h-8 w-8 transition-transform group-hover:scale-105"
          />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-ink">
              {fullName(lead)}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {lead.email}
            </span>
          </span>
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="block max-w-[160px] truncate text-[13px] font-medium text-ink">
          {lead.companyName}
        </span>
        <span className="block max-w-[160px] truncate text-xs text-muted-foreground">
          {lead.jobTitle}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="block max-w-[150px] truncate text-[13px] text-muted-foreground">
          {lead.phone}
        </span>
        <span className="block text-xs text-muted-foreground/80">
          {lead.country}
        </span>
      </td>
      <td className="px-3 py-3">
        <LeadSourceBadge source={lead.source} />
      </td>
      <td className="px-3 py-3">
        <span className="flex flex-col items-start gap-1">
          <LeadStatusBadge status={lead.status} converted={isConverted} />
          {isConverted && (
            <span className="text-[11px] font-medium text-[#15803d]">
              #{convertedDealId}
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-3">
        <LeadScoreBadge score={lead.score} />
      </td>
      <td className="px-3 py-3">
        <span className="flex items-center gap-2">
          <InitialsAvatar name={lead.ownerName} className="h-6 w-6 text-[10px]" />
          <span className="max-w-[110px] truncate text-[13px] text-muted-foreground">
            {lead.ownerName}
          </span>
        </span>
      </td>
      <td className="px-3 py-3 text-[13px] text-muted-foreground">
        {lastActivityLabel(lead.lastActivityAt)}
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "text-[13px]",
            followUpOverdue ? "font-medium text-danger" : "text-muted-foreground"
          )}
        >
          {followUpLabel}
        </span>
      </td>
      <td className="w-12 px-2 py-3" onClick={stop}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${fullName(lead)}`}
              className="text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{fullName(lead)}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(lead.id)}>
              <Eye className="h-4 w-4" aria-hidden />
              View Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              <PencilLine className="h-4 w-4" aria-hidden />
              Edit Lead
            </DropdownMenuItem>
            {!isConverted && (
              <DropdownMenuItem onClick={() => onConvert(lead)}>
                <TrendingUp className="h-4 w-4" aria-hidden />
                Convert to Deal
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onAddTask(lead)}>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Add Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => (window.location.href = `mailto:${lead.email}`)}>
              <Mail className="h-4 w-4" aria-hidden />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (window.location.href = `https://wa.me/${lead.whatsapp.replace(/[^0-9+]/g, "")}`)
              }
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => (window.location.href = `tel:${lead.phone}`)}>
              <Phone className="h-4 w-4" aria-hidden />
              Call
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onView(lead.id)}>
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Schedule Meeting
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive(lead)}>
              <Archive className="h-4 w-4" aria-hidden />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(lead)}
              className="text-danger focus:bg-danger/10 focus:text-danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export { LeadRow };