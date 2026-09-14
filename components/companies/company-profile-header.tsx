"use client";

import {
  Archive,
  ChevronLeft,
  Globe,
  Handshake,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
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
import { CompanyStatusBadge } from "@/components/crm/status-badges";
import type { CompanyRecord } from "@/lib/types";

interface CompanyProfileHeaderProps {
  company: CompanyRecord;
  classified?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onAddDeal: () => void;
  onAddContact: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function CompanyProfileHeader({
  company,
  classified = false,
  onBack,
  onEdit,
  onAddDeal,
  onAddContact,
  onArchive,
  onDelete,
}: CompanyProfileHeaderProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to Companies
      </button>

      <Card className="p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <InitialsAvatar name={company.name} className="h-14 w-14 text-base" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-ink">{company.name}</h1>
                {classified && <Badge variant="secondary">Archived</Badge>}
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted-foreground">
                {company.city}, {company.country}
                {company.website ? <span> · {company.domain}</span> : null}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <CompanyStatusBadge status={company.accountStatus} />
                <span className="text-xs text-muted-foreground">
                  {company.industry} · {company.companySize} people
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${company.email}`}
                aria-label={`Email ${company.name}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Email</span>
              </a>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                aria-label={`Visit ${company.name} website`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <Globe className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Website</span>
                <span className="xl:hidden">Site</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onAddDeal}>
                <Handshake className="h-4 w-4" aria-hidden />
                New Deal
              </Button>
              <Button variant="outline" size="sm" onClick={onAddContact}>
                <UserPlus className="h-4 w-4" aria-hidden />
                Add Contact
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{company.name}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit Company
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4" aria-hidden />
                    {classified ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-danger focus:bg-danger/10 focus:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete Company
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

export { CompanyProfileHeader };