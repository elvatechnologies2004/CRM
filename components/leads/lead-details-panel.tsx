"use client";

import { useState } from "react";
import { AtSign, Phone, Settings2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lastActivityLabel } from "@/lib/mock-leads";
import type { LeadRecord, LeadStatus, User } from "@/lib/types";

const leadStatuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Unqualified",
];

interface LeadDetailsPanelProps {
  lead: LeadRecord;
  owners: User[];
  onUpdate: (patch: Partial<LeadRecord>) => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-[13px] font-medium text-ink">{value}</span>
    </div>
  );
}

function LeadDetailsPanel({ lead, owners, onUpdate }: LeadDetailsPanelProps) {
  const [valueDraft, setValueDraft] = useState(String(lead.expectedValue || ""));

  const commitValue = () => {
    const parsed = Number(valueDraft);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onUpdate({ expectedValue: parsed });
    } else {
      setValueDraft(String(lead.expectedValue || ""));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" aria-hidden />
            Lead Details
          </CardTitle>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            Editable
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[13px] text-muted-foreground">Owner</span>
            <Select
              value={lead.ownerName}
              onValueChange={(value) => onUpdate({ ownerName: value })}
            >
              <SelectTrigger className="h-9 w-full" aria-label="Lead owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.name}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-[13px] text-muted-foreground">Status</span>
            <Select
              value={lead.status}
              onValueChange={(value) => onUpdate({ status: value as LeadStatus })}
            >
              <SelectTrigger className="h-9 w-full" aria-label="Lead status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leadStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-[13px] text-muted-foreground">Expected value ({lead.currency})</span>
            <Input
              type="number"
              min={0}
              value={valueDraft}
              onChange={(event) => setValueDraft(event.target.value)}
              onBlur={commitValue}
              aria-label="Expected value"
            />
          </div>

          <div className="border-t border-border pt-2" />

          <div className="space-y-0.5">
            <DetailRow label="Source" value={lead.source} />
            <DetailRow label="Created" value={formatShortDate(lead.createdAt)} />
            <DetailRow label="Last contact" value={lastActivityLabel(lead.lastActivityAt)} />
            <DetailRow
              label="Next follow-up"
              value={formatShortDate(lead.nextFollowUpAt ?? "") || "—"}
            />
            <DetailRow label="Country" value={`${lead.country}${lead.city ? ` · ${lead.city}` : ""}`} />
          </div>

          <div className="border-t border-border pt-2">
            <p className="mb-1.5 text-[13px] text-muted-foreground">Tags</p>
            {lead.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70">No tags</p>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              <Pill icon={<AtSign />} label={lead.email} />
            </a>
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              <Pill icon={<Phone />} label={lead.phone} />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatShortDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate">
      <span className="shrink-0 text-muted-foreground/70">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

export { LeadDetailsPanel, formatShortDate };