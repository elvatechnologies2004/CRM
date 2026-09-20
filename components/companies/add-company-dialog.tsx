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
import { Textarea } from "@/components/ui/textarea";
import { emptyCompanyForm, type CompanyFormData } from "@/lib/contact-form";
import {
  companyAccountStatuses,
  companyIndustries,
  companySizeOptions,
  currencyOptions,
} from "@/lib/crm-meta";
import type {
  CompanyAccountStatus,
  CompanyIndustry,
  CompanyRecord,
  LeadSourceOption,
  User,
} from "@/lib/types";

const companySources: LeadSourceOption[] = [
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

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: User[];
  companies: CompanyRecord[];
  initial?: Partial<CompanyFormData> | null;
  mode?: "create" | "edit";
  onSubmit: (data: CompanyFormData) => void;
  onViewExisting: (company: CompanyRecord) => void;
}

type FieldErrors = Partial<Record<keyof CompanyFormData, string>>;

function fieldError(errors: FieldErrors, field: keyof CompanyFormData) {
  return errors[field] ? (
    <p className="mt-1 text-xs text-danger">{errors[field]}</p>
  ) : null;
}

function AddCompanyDialog({
  open,
  onOpenChange,
  owners,
  companies,
  initial = null,
  mode = "create",
  onSubmit,
  onViewExisting,
}: AddCompanyDialogProps) {
  const [form, setForm] = useState<CompanyFormData>(() => ({
    ...emptyCompanyForm,
    ...initial,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [savedFlash, setSavedFlash] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({ ...emptyCompanyForm, ...initial });
      setErrors({});
    }
  }

  const isEdit = mode === "edit";

  const duplicate = companies.find(
    (company) =>
      form.name.trim() !== "" &&
      company.id !== form.previousId &&
      (company.name.toLowerCase() === form.name.trim().toLowerCase() ||
        (form.domain.trim() !== "" &&
          company.domain.toLowerCase() === form.domain.trim().toLowerCase()))
  );

  const update = (patch: Partial<CompanyFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const validate = (data: CompanyFormData): FieldErrors => {
    const next: FieldErrors = {};
    if (!data.name.trim()) next.name = "Company name is required.";
    return next;
  };

  const submit = (keepOpen: boolean) => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
    if (keepOpen) {
      setForm({ ...emptyCompanyForm });
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
          <DialogTitle>{isEdit ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the company details below."
              : "Add a new company to your account base. Required fields are marked with an asterisk (*)."}
          </DialogDescription>
        </DialogHeader>

        {duplicate && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
              <p className="text-[13px] text-ink">
                A company named <span className="font-medium">{duplicate.name}</span>{" "}
                already exists.
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
              Company
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company-name" required>Company name</Label>
                <Input
                  id="company-name"
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="Techno Solutions"
                />
                {fieldError(errors, "name")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-domain">Domain</Label>
                <Input
                  id="company-domain"
                  value={form.domain}
                  onChange={(event) => update({ domain: event.target.value })}
                  placeholder="technosolutions.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-website">Website</Label>
                <Input
                  id="company-website"
                  value={form.website}
                  onChange={(event) => update({ website: event.target.value })}
                  placeholder="https://technosolutions.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  placeholder="info@technosolutions.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-phone">Phone</Label>
                <Input
                  id="company-phone"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  placeholder="+92 21 3456 7890"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select
                  value={form.industry}
                  onValueChange={(value) => update({ industry: value as CompanyIndustry })}
                >
                  <SelectTrigger aria-label="Company industry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companyIndustries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Company size</Label>
                <Select
                  value={form.companySize}
                  onValueChange={(value) => update({ companySize: value })}
                >
                  <SelectTrigger aria-label="Company size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-employees">Employees</Label>
                <Input
                  id="company-employees"
                  type="number"
                  min={0}
                  value={form.employeeCount}
                  onChange={(event) => update({ employeeCount: event.target.value })}
                  placeholder="85"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-revenue">Annual revenue</Label>
                <Input
                  id="company-revenue"
                  value={form.annualRevenue}
                  onChange={(event) => update({ annualRevenue: event.target.value })}
                  placeholder="$2.4M"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-currency">Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(value) => update({ currency: value })}
                >
                  <SelectTrigger aria-label="Company currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Account status</Label>
                <Select
                  value={form.accountStatus}
                  onValueChange={(value) =>
                    update({ accountStatus: value as CompanyAccountStatus })
                  }
                >
                  <SelectTrigger aria-label="Account status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companyAccountStatuses.map((status) => (
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
                  <SelectTrigger aria-label="Company owner">
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
                  <SelectTrigger aria-label="Company source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companySources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-country">Country</Label>
                <Input
                  id="company-country"
                  value={form.country}
                  onChange={(event) => update({ country: event.target.value })}
                  placeholder="Pakistan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-city">City</Label>
                <Input
                  id="company-city"
                  value={form.city}
                  onChange={(event) => update({ city: event.target.value })}
                  placeholder="Karachi"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company-address">Address</Label>
                <Input
                  id="company-address"
                  value={form.address}
                  onChange={(event) => update({ address: event.target.value })}
                  placeholder="Gizri Commercial Area, Clifton"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company-tags">Tags (comma separated)</Label>
                <Input
                  id="company-tags"
                  value={form.tags}
                  onChange={(event) => update({ tags: event.target.value })}
                  placeholder="Enterprise, CRM"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company-description">Description</Label>
                <Textarea
                  id="company-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => update({ description: event.target.value })}
                  placeholder="What does this company do?"
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
            {isEdit ? "Save Changes" : "Save Company"}
          </Button>
        </DialogFooter>

        <p
          className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg transition-opacity ${
            savedFlash ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          Company saved
        </p>
      </DialogContent>
    </Dialog>
  );
}

export { AddCompanyDialog };