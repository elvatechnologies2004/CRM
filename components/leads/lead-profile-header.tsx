"use client";

import {
  Archive,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fullName } from "@/components/leads/lead-row";
import { LeadScoreBadge } from "@/components/leads/lead-score-badge";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import type { LeadRecord } from "@/lib/types";

interface LeadProfileHeaderProps {
  lead: LeadRecord;
  convertedDealId?: string;
  archived?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onConvert: () => void;
  onAddTask: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function LeadProfileHeader({
  lead,
  convertedDealId,
  archived = false,
  onBack,
  onEdit,
  onConvert,
  onAddTask,
  onArchive,
  onDelete,
}: LeadProfileHeaderProps) {
  const isConverted = Boolean(convertedDealId);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to Leads
      </button>

      <Card className="p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <InitialsAvatar
              name={fullName(lead)}
              className="h-14 w-14 text-base"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-ink">
                  {fullName(lead)}
                </h1>
                {archived && <Badge variant="secondary">Archived</Badge>}
                {isConverted && (
                  <Badge className="border-transparent bg-success/10 text-[#15803d]">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    Deal #{convertedDealId}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                {lead.companyName}
                {lead.jobTitle ? <span> · {lead.jobTitle}</span> : null}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <LeadStatusBadge status={lead.status} converted={isConverted} />
                <LeadScoreBadge score={lead.score} />
                <LeadSourceBadge source={lead.source} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <div className="flex items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                aria-label={`Call ${fullName(lead)}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <Phone className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Call</span>
              </a>
              <a
                href={`mailto:${lead.email}`}
                aria-label={`Email ${fullName(lead)}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Email</span>
              </a>
              <a
                href={`https://wa.me/${lead.whatsapp.replace(/[^0-9+]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${fullName(lead)}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">WhatsApp</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              {!isConverted && (
                <Button onClick={onConvert} className="flex-1 lg:flex-none">
                  <TrendingUp className="h-4 w-4" aria-hidden />
                  Convert to Deal
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{fullName(lead)}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddTask}>
                    <TrendingUp className="h-4 w-4" aria-hidden />
                    Add Task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4" aria-hidden />
                    {archived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-danger focus:bg-danger/10 focus:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete Lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { LeadProfileHeader };