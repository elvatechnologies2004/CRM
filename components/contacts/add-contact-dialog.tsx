"use client";

import { useState } from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { emptyContactForm, type ContactFormData } from "@/lib/contact-form";
import { contactLifecycles, preferredChannels } from "@/lib/crm-meta";
import { contactFullName } from "@/components/contacts/contacts-table";
import type {
  CompanyRecord,
  ContactLifecycle,
  ContactRecord,
  LeadSourceOption,
  PreferredChannel,
  User,
} from "@/lib/types";

const contactSources: LeadSourceOption[] = [
  "Website",
  "WhatsApp",
  "LinkedIn",
  "Facebook",
  "Instagram",
  "Referral",
  "Email",
  "Cold Call",
  "Manual",
  "Other",
];

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: User[];
  companies: CompanyRecord[];
  contacts: ContactRecord[];
  initial?: Partial<ContactFormData> | null;
  mode?: "create" | "edit";
  onSubmit: (data: ContactFormData) => void;
  onViewExisting: (contact: ContactRecord) => void;
}

type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

function fieldError(errors: FieldErrors, field: keyof ContactFormData) {
  return errors[field] ? (
    <p className="mt-1 text-xs text-danger">{errors[field]}</p>
  ) : null;
}

function AddContactDialog({
  open,
  onOpenChange,
  owners,
  companies,
  contacts,
  initial = null,
  mode = "create",
  onSubmit,
  onViewExisting,
}: AddContactDialogProps) {
  const [form, setForm] = useState<ContactFormData>(() => ({
    ...emptyContactForm,
    ...initial,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({ ...emptyContactForm, ...initial });
      setErrors({});
      setEditingId(initial?.email ? findIdByEmail(contacts, initial.email) : null);
    }
  }

  const isEdit = mode === "edit";

  const duplicate = contacts.find(
    (contact) =>
      contact.email.toLowerCase() === form.email.trim().toLowerCase() &&
      contact.id !== editingId &&
      form.email.trim() !== ""
  );

  const update = (patch: Partial<ContactFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const validate = (data: ContactFormData): FieldErrors => {
    const next: FieldErrors = {};
    if (!data.firstName.trim()) next.firstName = "First name is required.";
    if (!data.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!data.phone.trim()) next.phone = "Phone number is required.";
    return next;
  };

  const submit = (keepOpen: boolean) => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
    if (keepOpen) {
      setForm({ ...emptyContactForm });
      setErrors({});
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1600);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Contact" : "Add New Contact"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the contact details below."
              : "Add a new contact to your address book. Required fields are marked with an asterisk (*)."}
          </DialogDescription>
        </DialogHeader>

        {duplicate && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
              <p className="text-[13px] text-ink">
                A contact with this email already exists —{" "}
                <span className="font-medium">{contactFullName(duplicate)}</span>.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => onViewExisting(duplicate)}
            >
              View existing
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-first-name" required>First name</Label>
                <Input
                  id="contact-first-name"
                  value={form.firstName}
                  onChange={(event) => update({ firstName: event.target.value })}
                  placeholder="Ahmed"
                />
                {fieldError(errors, "firstName")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-last-name">Last name</Label>
                <Input
                  id="contact-last-name"
                  value={form.lastName}
                  onChange={(event) => update({ lastName: event.target.value })}
                  placeholder="Khan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email" required>Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  placeholder="ahmed@company.com"
                />
                {fieldError(errors, "email")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone" required>Phone</Label>
                <Input
                  id="contact-phone"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  placeholder="+92 300 1234567"
                />
                {fieldError(errors, "phone")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-whatsapp">WhatsApp</Label>
                <Input
                  id="contact-whatsapp"
                  value={form.whatsapp}
                  onChange={(event) => update({ whatsapp: event.target.value })}
                  placeholder="Same as phone by default"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-job-title">Job title</Label>
                <Input
                  id="contact-job-title"
                  value={form.jobTitle}
                  onChange={(event) => update({ jobTitle: event.target.value })}
                  placeholder="Head of IT"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Company</Label>
                <Select
                  value={form.companyId || "not_listed"}
                  onValueChange={(value) => {
                    if (value === "not_listed") {
                      update({ companyId: "", companyName: "" });
                    } else {
                      const company = companies.find((candidate) => candidate.id === value);
                      update({
                        companyId: value,
                        companyName: company?.name ?? "",
                      });
                    }
                  }}
                >
                  <SelectTrigger aria-label="Contact company">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="not_listed">Other / New company…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(!form.companyId) && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="contact-company-name">Company name</Label>
                  <Input
                    id="contact-company-name"
                    value={form.companyName}
                    onChange={(event) => update({ companyName: event.target.value })}
                    placeholder="Techno Solutions"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact details
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Lifecycle stage</Label>
                <Select
                  value={form.lifecycleStage}
                  onValueChange={(value) =>
                    update({ lifecycleStage: value as ContactLifecycle })
                  }
                >
                  <SelectTrigger aria-label="Contact lifecycle stage">
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
                <Label>Assign to owner</Label>
                <Select
                  value={form.ownerName}
                  onValueChange={(value) => update({ ownerName: value })}
                >
                  <SelectTrigger aria-label="Contact owner">
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
                <Label>Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => update({ source: value as LeadSourceOption })}
                >
                  <SelectTrigger aria-label="Contact source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contactSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
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
                  <SelectTrigger aria-label="Preferred contact channel">
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
              <div className="space-y-1.5">
                <Label htmlFor="contact-language">Preferred language</Label>
                <Input
                  id="contact-language"
                  value={form.preferredLanguage}
                  onChange={(event) => update({ preferredLanguage: event.target.value })}
                  placeholder="English"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-country">Country</Label>
                <Input
                  id="contact-country"
                  value={form.country}
                  onChange={(event) => update({ country: event.target.value })}
                  placeholder="Pakistan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-city">City</Label>
                <Input
                  id="contact-city"
                  value={form.city}
                  onChange={(event) => update({ city: event.target.value })}
                  placeholder="Karachi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-address">Address</Label>
                <Input
                  id="contact-address"
                  value={form.address}
                  onChange={(event) => update({ address: event.target.value })}
                  placeholder="Clifton, Karachi"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contact-tags">Tags (comma separated)</Label>
                <Input
                  id="contact-tags"
                  value={form.tags}
                  onChange={(event) => update({ tags: event.target.value })}
                  placeholder="Enterprise, CRM"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          {!isEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => submit(true)}
              className="mr-auto sm:mr-0"
            >
              Save &amp; Add Another
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => submit(false)}>
            {isEdit ? "Save Changes" : "Save Contact"}
          </Button>
        </DialogFooter>

        <p
          className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg transition-opacity ${
            savedFlash ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          Contact saved
        </p>
      </DialogContent>
    </Dialog>
  );
}

function findIdByEmail(contacts: ContactRecord[], email: string) {
  return (
    contacts.find(
      (contact) =>
        email.trim().toLowerCase() === contact.email.trim().toLowerCase()
    )?.id ?? null
  );
}

export { AddContactDialog };