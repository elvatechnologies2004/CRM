"use client";

import { useState } from "react";
import { CircleUserRound, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyContactEdit, type ContactEditFormData } from "@/lib/contact-form";
import { contactLifecycles, preferredChannels } from "@/lib/crm-meta";
import { lastActivityLabel, nextFollowUpLabel } from "@/lib/mock-leads";
import type { ContactLifecycle, ContactRecord, PreferredChannel } from "@/lib/types";

interface ContactDetailsPanelProps {
  contact: ContactRecord;
  onApply: (updated: ContactRecord) => void;
}

function contactToEdit(contact: ContactRecord): ContactEditFormData {
  return {
    jobTitle: contact.jobTitle,
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    lifecycleStage: contact.lifecycleStage,
    preferredChannel: contact.preferredChannel,
    country: contact.country,
    city: contact.city,
    address: contact.address,
    tags: contact.tags.join(", "),
  };
}

function ContactDetailsPanel({ contact, onApply }: ContactDetailsPanelProps) {
  const [form, setForm] = useState<ContactEditFormData>(() => contactToEdit(contact));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<ContactEditFormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const startEdit = () => {
    setForm(contactToEdit(contact));
    setError(null);
    setEditing(true);
  };

  const save = () => {
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    onApply(applyContactEdit(contact, form));
    setEditing(false);
  };

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Contact Information</CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={startEdit}>
            <CircleUserRound className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-[13px]">
        {editing ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="panel-email">Email</Label>
              <Input
                id="panel-email"
                type="email"
                value={form.email}
                onChange={(event) => update({ email: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="panel-phone">Phone</Label>
                <Input
                  id="panel-phone"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panel-whatsapp">WhatsApp</Label>
                <Input
                  id="panel-whatsapp"
                  value={form.whatsapp}
                  onChange={(event) => update({ whatsapp: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panel-job-title">Job title</Label>
              <Input
                id="panel-job-title"
                value={form.jobTitle}
                onChange={(event) => update({ jobTitle: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Lifecycle stage</Label>
                <Select
                  value={form.lifecycleStage}
                  onValueChange={(value) =>
                    update({ lifecycleStage: value as ContactLifecycle })
                  }
                >
                  <SelectTrigger aria-label="Lifecycle stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLifecycles.map((lifecycle) => (
                      <SelectItem key={lifecycle} value={lifecycle}>
                        {lifecycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred channel</Label>
                <Select
                  value={form.preferredChannel}
                  onValueChange={(value) =>
                    update({ preferredChannel: value as PreferredChannel })
                  }
                >
                  <SelectTrigger aria-label="Preferred channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {preferredChannels.map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        {channel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="panel-country">Country</Label>
                <Input
                  id="panel-country"
                  value={form.country}
                  onChange={(event) => update({ country: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panel-city">City</Label>
                <Input
                  id="panel-city"
                  value={form.city}
                  onChange={(event) => update({ city: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panel-address">Address</Label>
              <Input
                id="panel-address"
                value={form.address}
                onChange={(event) => update({ address: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panel-tags">Tags</Label>
              <Input
                id="panel-tags"
                value={form.tags}
                onChange={(event) => update({ tags: event.target.value })}
                placeholder="Enterprise, CRM"
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" className="gap-1.5" onClick={save}>
                <Save className="h-3.5 w-3.5" aria-hidden />
                Save Changes
              </Button>
            </div>
          </>
        ) : (
          <>
            <dl className="space-y-2.5">
              {[
                { label: "Email", value: contact.email },
                { label: "Phone", value: contact.phone },
                { label: "WhatsApp", value: contact.whatsapp },
                { label: "Job title", value: contact.jobTitle || "—" },
                { label: "Owner", value: contact.ownerName },
                { label: "Source", value: contact.source },
                { label: "Location", value: [contact.city, contact.country].filter(Boolean).join(", ") || "—" },
                { label: "Preferred language", value: contact.preferredLanguage || "—" },
              ].map((row) => (
                <div key={row.label} className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-xs text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
              {contact.tags.length > 0 ? (
                contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
            </div>
            <dl className="space-y-2.5 border-t border-border pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-xs text-muted-foreground">Last activity</dt>
                <dd className="text-right font-medium text-ink">
                  {lastActivityLabel(contact.lastActivityAt)}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-xs text-muted-foreground">Next activity</dt>
                <dd className="text-right font-medium text-ink">
                  {contact.nextActivityAt ? nextFollowUpLabel(contact.nextActivityAt) : "—"}
                </dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { ContactDetailsPanel };