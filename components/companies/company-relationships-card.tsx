"use client";

import { Network } from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contactFullName } from "@/components/contacts/contacts-table";
import { cn } from "@/lib/utils";
import type {
  CompanyContactLink,
  CompanyRelationshipRole,
  ContactRecord,
} from "@/lib/types";

const roleOptions: Array<Exclude<CompanyRelationshipRole, "Primary Contact">> = [
  "Decision Maker",
  "Finance Contact",
  "Technical Contact",
  "Executive Sponsor",
];

interface CompanyRelationshipsCardProps {
  links: CompanyContactLink[];
  members: ContactRecord[];
  onToggleRole: (contactId: string, role: Exclude<CompanyRelationshipRole, "Primary Contact">) => void;
  onSetPrimary: (contactId: string) => void;
}

function CompanyRelationshipsCard({
  links,
  members,
  onToggleRole,
  onSetPrimary,
}: CompanyRelationshipsCardProps) {
  if (members.length === 0) {
    return (
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Network className="h-4 w-4 text-muted-foreground" aria-hidden />
            Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Link contacts to map the account hierarchy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Network className="h-4 w-4 text-muted-foreground" aria-hidden />
          Relationships
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((contact) => {
          const link = links.find((candidate) => candidate.contactId === contact.id);
          const activeRoles = new Set(link?.roles ?? []);
          return (
            <div key={contact.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <InitialsAvatar name={contactFullName(contact)} className="h-8 w-8" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {contactFullName(contact)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {contact.jobTitle}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onSetPrimary(contact.id)}
                  title={link?.primary ? "Primary contact" : "Set as primary contact"}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                    link?.primary
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-ink"
                  )}
                >
                  {link?.primary ? "PRIMARY" : "Set primary"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {roleOptions.map((role) => {
                  const isActive = activeRoles.has(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => onToggleRole(contact.id, role)}
                      className={cn(
                        "rounded-full border px-2 py-1 text-[11px] font-medium transition-colors",
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-ink"
                      )}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { CompanyRelationshipsCard };