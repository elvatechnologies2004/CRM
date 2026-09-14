"use client";

import { useState } from "react";
import { Link2, SearchX, Unlink, UserPlus } from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/crm/empty-state";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { contactFullName } from "@/components/contacts/contacts-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildContactRecord, type ContactFormData } from "@/lib/contact-form";
import { upsertContact } from "@/lib/crm-local";
import { lastActivityLabel } from "@/lib/mock-leads";
import { ContactLifecycleBadge } from "@/components/crm/status-badges";
import type {
  CompanyContactLink,
  CompanyRecord,
  ContactRecord,
  User,
} from "@/lib/types";

interface CompanyContactsTabProps {
  company: CompanyRecord;
  links: CompanyContactLink[];
  members: ContactRecord[];
  contacts: ContactRecord[];
  owners: User[];
  openRequest?: number;
  onAddLink: (link: CompanyContactLink, contact: ContactRecord) => void;
  onRemoveLink: (contact: ContactRecord) => void;
}

function CompanyContactsTab({
  company,
  links,
  members,
  contacts,
  owners,
  openRequest = 0,
  onAddLink,
  onRemoveLink,
}: CompanyContactsTabProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [addNewOpen, setAddNewOpen] = useState(false);
  const [prevOpenRequest, setPrevOpenRequest] = useState(0);

  if (openRequest !== prevOpenRequest) {
    setPrevOpenRequest(openRequest);
    if (openRequest > 0) setAddNewOpen(true);
  }

  const alreadyLinked = new Set(members.map((member) => member.id));
  const available = contacts.filter((contact) => !alreadyLinked.has(contact.id));

  const addExisting = () => {
    const contact = contacts.find((candidate) => candidate.id === selectedId);
    if (!contact) return;
    const link: CompanyContactLink = {
      contactId: contact.id,
      roles: [],
      primary: members.length === 0,
    };
    onAddLink(link, contact);
    setSelectedId("");
  };

  const handleNewSubmit = (data: ContactFormData) => {
    const created = buildContactRecord({
      ...data,
      companyId: company.id,
      companyName: company.name,
    });
    upsertContact(created);
    const link: CompanyContactLink = {
      contactId: created.id,
      roles: [],
      primary: members.length === 0,
    };
    onAddLink(link, created);
    setAddNewOpen(false);
  };

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="text-sm">
          Team &amp; Relationships
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {members.length}
          </span>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-9 w-[220px] text-[13px]" aria-label="Choose a contact to add">
                <SelectValue placeholder="Add existing contact" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No other contacts available
                  </div>
                )}
                {available.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contactFullName(contact)} · {contact.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!selectedId}
              onClick={addExisting}
              aria-label="Add selected contact to this company"
            >
              <Link2 className="h-4 w-4" aria-hidden />
              Add
            </Button>
          </div>
          <Button size="sm" onClick={() => setAddNewOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden />
            New Contact
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {members.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No contacts linked"
            description="Add existing contacts to this company or create a new one to start building relationships."
          />
        ) : (
          <div className="space-y-2">
            {members.map((contact) => {
              const link = links.find((candidate) => candidate.contactId === contact.id);
              const primary = Boolean(link?.primary);
              return (
                <div
                  key={contact.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <InitialsAvatar name={contactFullName(contact)} className="h-9 w-9" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={`/contacts/${contact.id}`}
                          className="truncate text-[13px] font-medium text-ink hover:underline"
                        >
                          {contactFullName(contact)}
                        </a>
                        {primary && <Badge variant="outline">Primary Contact</Badge>}
                        {link?.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {contact.jobTitle} · {contact.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      Active {lastActivityLabel(contact.lastActivityAt)}
                    </span>
                    <ContactLifecycleBadge stage={contact.lifecycleStage} />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-danger"
                      onClick={() => onRemoveLink(contact)}
                      aria-label={`Remove ${contactFullName(contact)} from ${company.name}`}
                    >
                      <Unlink className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AddContactDialog
        open={addNewOpen}
        onOpenChange={setAddNewOpen}
        owners={owners}
        companies={[company]}
        contacts={contacts}
        initial={{
          companyId: company.id,
          companyName: company.name,
          ownerName: company.ownerName,
        }}
        mode="create"
        onSubmit={handleNewSubmit}
        onViewExisting={(existing) => {
          setAddNewOpen(false);
          if (alreadyLinked.has(existing.id)) return;
          const link: CompanyContactLink = {
            contactId: existing.id,
            roles: [],
            primary: members.length === 0,
          };
          onAddLink(link, existing);
        }}
      />
    </Card>
  );
}

export { CompanyContactsTab };