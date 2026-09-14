"use client";

import * as React from "react";
import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { emptyLeadForm, type LeadFormData } from "@/lib/lead-form";
import type { LeadSourceOption, LeadStatus, User } from "@/lib/types";
import { cn } from "@/lib/utils";

const leadSources: LeadSourceOption[] = [
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

const leadStatuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Unqualified",
];

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: User[];
  initial?: Partial<LeadFormData> | null;
  mode?: "create" | "edit";
  onSubmit: (data: LeadFormData) => void;
}

type FieldErrors = Partial<Record<keyof LeadFormData, string>>;

function fieldError(errors: FieldErrors, field: keyof LeadFormData) {
  return errors[field] ? (
    <p className="mt-1 text-xs text-danger">{errors[field]}</p>
  ) : null;
}

function AddLeadDialog({
  open,
  onOpenChange,
  owners,
  initial = null,
  mode = "create",
  onSubmit,
}: AddLeadDialogProps) {
  const [form, setForm] = useState<LeadFormData>(() => ({
    ...emptyLeadForm,
    ...initial,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [savedFlash, setSavedFlash] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({ ...emptyLeadForm, ...initial });
      setErrors({});
    }
  }

  const isEdit = mode === "edit";

  const update = (patch: Partial<LeadFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const validate = (data: LeadFormData): FieldErrors => {
    const next: FieldErrors = {};
    if (!data.firstName.trim()) next.firstName = "First name is required.";
    if (!data.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!data.phone.trim()) next.phone = "Phone number is required.";
    if (!data.companyName.trim()) next.companyName = "Company name is required.";
    return next;
  };

  const submit = (data: LeadFormData, keepOpen: boolean) => {
    const nextErrors = validate(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(data);
    if (keepOpen) {
      setForm({ ...emptyLeadForm });
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
          <DialogTitle>{isEdit ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the lead details below."
              : "Add a new lead to your pipeline. Required fields are marked with an asterisk (*)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-first-name">
                  First name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="lead-first-name"
                  value={form.firstName}
                  onChange={(event) => update({ firstName: event.target.value })}
                  placeholder="Ahmed"
                />
                {fieldError(errors, "firstName")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-last-name">Last name</Label>
                <Input
                  id="lead-last-name"
                  value={form.lastName}
                  onChange={(event) => update({ lastName: event.target.value })}
                  placeholder="Khan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">
                  Email address <span className="text-danger">*</span>
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  placeholder="ahmed@company.com"
                />
                {fieldError(errors, "email")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">
                  Phone <span className="text-danger">*</span>
                </Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  placeholder="+92 300 1234567"
                />
                {fieldError(errors, "phone")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-whatsapp">WhatsApp</Label>
                <Input
                  id="lead-whatsapp"
                  value={form.whatsapp}
                  onChange={(event) => update({ whatsapp: event.target.value })}
                  placeholder="Same as phone by default"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-company">
                  Company name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="lead-company"
                  value={form.companyName}
                  onChange={(event) => update({ companyName: event.target.value })}
                  placeholder="Techno Solutions"
                />
                {fieldError(errors, "companyName")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-job-title">Job title</Label>
                <Input
                  id="lead-job-title"
                  value={form.jobTitle}
                  onChange={(event) => update({ jobTitle: event.target.value })}
                  placeholder="Head of IT"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-country">Country</Label>
                <Input
                  id="lead-country"
                  value={form.country}
                  onChange={(event) => update({ country: event.target.value })}
                  placeholder="Pakistan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-city">City</Label>
                <Input
                  id="lead-city"
                  value={form.city}
                  onChange={(event) => update({ city: event.target.value })}
                  placeholder="Karachi"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lead details
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => update({ source: value as LeadSourceOption })}
                >
                  <SelectTrigger aria-label="Lead source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => update({ status: value as LeadStatus })}
                >
                  <SelectTrigger aria-label="Lead status">
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
                <Label>Assign to owner</Label>
                <Select
                  value={form.ownerName}
                  onValueChange={(value) => update({ ownerName: value })}
                >
                  <SelectTrigger aria-label="Lead owner">
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
                <Label htmlFor="lead-value">Expected value (PKR)</Label>
                <Input
                  id="lead-value"
                  type="number"
                  min={0}
                  value={form.expectedValue}
                  onChange={(event) => update({ expectedValue: event.target.value })}
                  placeholder="24000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-interest">Interest / product of interest</Label>
                <Input
                  id="lead-interest"
                  value={form.interest}
                  onChange={(event) => update({ interest: event.target.value })}
                  placeholder="Enterprise automation suite"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-tags">Tags (comma separated)</Label>
                <Input
                  id="lead-tags"
                  value={form.tags}
                  onChange={(event) => update({ tags: event.target.value })}
                  placeholder="Enterprise, Tech"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lead-notes">Notes</Label>
                <Textarea
                  id="lead-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => update({ notes: event.target.value })}
                  placeholder="Context from the first contact…"
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
              onClick={() => submit(form, true)}
              className="mr-auto sm:mr-0"
            >
              Save &amp; Add Another
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => submit(form, false)}>
            {isEdit ? "Save Changes" : "Save Lead"}
          </Button>
        </DialogFooter>

        <p
          className={cn(
            "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg transition-opacity",
            savedFlash ? "opacity-100" : "opacity-0"
          )}
          aria-live="polite"
        >
          Lead saved
        </p>
      </DialogContent>
    </Dialog>
  );
}

export { AddLeadDialog };