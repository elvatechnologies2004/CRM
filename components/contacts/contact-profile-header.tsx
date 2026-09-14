"use client";

import {
  Archive,
  Building2,
  CheckSquare,
  ChevronLeft,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
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
import { ContactLifecycleBadge } from "@/components/crm/status-badges";
import { contactFullName } from "@/components/contacts/contacts-table";
import type { ContactRecord } from "@/lib/types";

interface ContactProfileHeaderProps {
  contact: ContactRecord;
  onBack: () => void;
  onEdit: () => void;
  onAddTask: () => void;
  onArchive: () => void;
  onDelete: () => void;
  archived?: boolean;
}

function ContactProfileHeader({
  contact,
  onBack,
  onEdit,
  onAddTask,
  onArchive,
  onDelete,
  archived = false,
}: ContactProfileHeaderProps) {
  const name = contactFullName(contact);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to Contacts
      </button>

      <Card className="p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <InitialsAvatar name={name} className="h-14 w-14 text-base" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-ink">{name}</h1>
                {archived && <Badge variant="secondary">Archived</Badge>}
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                {contact.companyName}
                {contact.jobTitle ? <span> · {contact.jobTitle}</span> : null}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <ContactLifecycleBadge stage={contact.lifecycleStage} />
                <span className="text-xs text-muted-foreground">
                  Preferred: {contact.preferredChannel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <div className="flex items-center gap-2">
              <a
                href={`tel:${contact.phone}`}
                aria-label={`Call ${name}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <Phone className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Call</span>
              </a>
              <a
                href={`mailto:${contact.email}`}
                aria-label={`Email ${name}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Email</span>
              </a>
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/[^0-9+]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${name}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">WhatsApp</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{name}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddTask}>
                    <CheckSquare className="h-4 w-4" aria-hidden />
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
                    Delete Contact
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

export { ContactProfileHeader };