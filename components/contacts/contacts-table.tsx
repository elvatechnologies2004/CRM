"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Archive,
  CheckSquare,
  MoreHorizontal,
  Pencil,
  SearchX,
  Trash2,
  X,
} from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactLifecycleBadge } from "@/components/crm/status-badges";
import { lastActivityLabel } from "@/lib/mock-leads";
import type { ContactRecord, ContactLifecycle } from "@/lib/types";

export function contactFullName(contact: ContactRecord) {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

interface ContactsTableProps {
  contacts: ContactRecord[];
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onView: (id: string) => void;
  onEdit: (contact: ContactRecord) => void;
  onAddTask: (contact: ContactRecord) => void;
  onArchive: (contact: ContactRecord) => void;
  onDelete: (contact: ContactRecord) => void;
  onBulkAssignOwner: (owner: string) => void;
  onBulkStage: (stage: ContactLifecycle) => void;
  onBulkDelete: () => void;
  onClearFilters: () => void;
  owners: string[];
  cardsView: boolean;
}

function ContactCard({
  contact,
  selected,
  onView,
  onToggleSelected,
}: {
  contact: ContactRecord;
  selected: boolean;
  onView: (id: string) => void;
  onToggleSelected: (id: string) => void;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-3"
      onClick={() => onView(contact.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onView(contact.id);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2.5">
          <InitialsAvatar name={contactFullName(contact)} className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-ink">
              {contactFullName(contact)}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {contact.companyName}
            </span>
          </span>
        </span>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelected(contact.id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${contactFullName(contact)}`}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <ContactLifecycleBadge stage={contact.lifecycleStage} />
      </div>
      <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
        <p className="truncate">{contact.email}</p>
        <p className="truncate">{contact.phone}</p>
        <p className="flex items-center justify-between">
          <span>{contact.preferredChannel}</span>
          <span>{lastActivityLabel(contact.lastActivityAt)}</span>
        </p>
      </div>
      <div className="mt-2.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onView(contact.id);
          }}
        >
          Open contact
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function ContactsTable({
  contacts,
  selected,
  onToggleSelected,
  onToggleAll,
  onClearSelection,
  onView,
  onEdit,
  onAddTask,
  onArchive,
  onDelete,
  onBulkAssignOwner,
  onBulkStage,
  onBulkDelete,
  onClearFilters,
  owners,
  cardsView,
}: ContactsTableProps) {
  const [bulkOwner, setBulkOwner] = useState<string | undefined>();
  const [bulkStage, setBulkStage] = useState<string | undefined>();
  const selectedCount = selected.size;
  const allSelected = contacts.length > 0 && selectedCount === contacts.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/50 px-4 py-2.5">
          <span className="text-[13px] font-medium text-accent-foreground">
            {selectedCount} {selectedCount === 1 ? "contact" : "contacts"} selected
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
              value={bulkStage}
              onValueChange={(value) => {
                onBulkStage(value as ContactLifecycle);
                setBulkStage(undefined);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Change lifecycle of selected">
                <SelectValue placeholder="Set lifecycle" />
              </SelectTrigger>
              <SelectContent>
                {(
                  ["Lead", "Subscriber", "Opportunity", "Customer", "Former Customer", "Trial"] as const
                ).map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-5 w-5 text-muted-foreground" aria-hidden />
          </span>
          <p className="text-sm font-medium text-ink">No contacts match your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try adjusting the search keywords or clearing the active filters to see
            more contacts.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {cardsView ? (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  selected={selected.has(contact.id)}
                  onView={onView}
                  onToggleSelected={onToggleSelected}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:hidden">
                {contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    selected={selected.has(contact.id)}
                    onView={onView}
                    onToggleSelected={onToggleSelected}
                  />
                ))}
              </div>

              <div className="scrollbar-thin hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="w-10 px-3 py-3">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                          aria-label="Select all contacts"
                        />
                      </th>
                      <th scope="col" className="px-2 py-3 font-semibold">Contact</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Company</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Job Title</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Lifecycle</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Channel</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Last activity</th>
                      <th scope="col" className="w-12 px-2 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contacts.map((contact) => {
                      const name = contactFullName(contact);
                      return (
                        <tr key={contact.id} className="bg-card hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={selected.has(contact.id)}
                              onCheckedChange={() => onToggleSelected(contact.id)}
                              aria-label={`Select ${name}`}
                            />
                          </td>
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              onClick={() => onView(contact.id)}
                              className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
                            >
                              <InitialsAvatar name={name} className="h-9 w-9" />
                              <span className="min-w-0">
                                <span className="block truncate text-[13px] font-medium text-ink">
                                  {name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {contact.email}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-3 py-3 text-[13px] text-muted-foreground">
                            {contact.companyName}
                          </td>
                          <td className="px-3 py-3 text-[13px] text-muted-foreground">
                            {contact.jobTitle || "—"}
                          </td>
                          <td className="px-3 py-3">
                            <ContactLifecycleBadge stage={contact.lifecycleStage} />
                          </td>
                          <td className="px-3 py-3 text-[13px] text-muted-foreground">
                            {contact.preferredChannel}
                          </td>
                          <td className="px-3 py-3 text-[13px] text-muted-foreground">
                            {contact.ownerName}
                          </td>
                          <td className="px-3 py-3 text-[13px] text-muted-foreground">
                            {lastActivityLabel(contact.lastActivityAt)}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
                                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel>{name}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onView(contact.id)}>
                                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(contact)}>
                                  <Pencil className="h-4 w-4" aria-hidden />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddTask(contact)}>
                                  <CheckSquare className="h-4 w-4" aria-hidden />
                                  Add Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onArchive(contact)}>
                                  <Archive className="h-4 w-4" aria-hidden />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDelete(contact)}
                                  className="text-danger focus:bg-danger/10 focus:text-danger"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}

export { ContactsTable };