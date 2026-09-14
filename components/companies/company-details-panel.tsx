"use client";

import { useState } from "react";
import { Building2, Save } from "lucide-react";

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
import { applyCompanyEdit, type CompanyEditFormData } from "@/lib/contact-form";
import { companyAccountStatuses, companyIndustries } from "@/lib/crm-meta";
import { lastActivityLabel } from "@/lib/mock-leads";
import type {
  CompanyAccountStatus,
  CompanyIndustry,
  CompanyRecord,
} from "@/lib/types";

interface CompanyDetailsPanelProps {
  company: CompanyRecord;
  onApply: (updated: CompanyRecord) => void;
}

function companyToEdit(company: CompanyRecord): CompanyEditFormData {
  return {
    industry: company.industry,
    companySize: company.companySize,
    employeeCount: String(company.employeeCount),
    annualRevenue: company.annualRevenue,
    phone: company.phone,
    email: company.email,
    website: company.website,
    country: company.country,
    city: company.city,
    address: company.address,
    accountStatus: company.accountStatus,
    tags: company.tags.join(", "),
    description: company.description,
  };
}

function CompanyDetailsPanel({ company, onApply }: CompanyDetailsPanelProps) {
  const [form, setForm] = useState<CompanyEditFormData>(() => companyToEdit(company));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<CompanyEditFormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const startEdit = () => {
    setForm(companyToEdit(company));
    setError(null);
    setEditing(true);
  };

  const save = () => {
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Add at least one contact channel (email or phone).");
      return;
    }
    onApply(applyCompanyEdit(company, form));
    setEditing(false);
  };

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Company Information</CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={startEdit}>
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-[13px]">
        {editing ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    {["1–10", "11–50", "51–100", "101–250", "251–500", "501–1000", "1001+"].map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="panel-employees">Employees</Label>
                <Input
                  id="panel-employees"
                  type="number"
                  min={0}
                  value={form.employeeCount}
                  onChange={(event) => update({ employeeCount: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panel-revenue">Annual revenue</Label>
                <Input
                  id="panel-revenue"
                  value={form.annualRevenue}
                  onChange={(event) => update({ annualRevenue: event.target.value })}
                  placeholder="$2.4M"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="panel-email">Email</Label>
                <Input
                  id="panel-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panel-phone">Phone</Label>
                <Input
                  id="panel-phone"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panel-website">Website</Label>
              <Input
                id="panel-website"
                value={form.website}
                onChange={(event) => update({ website: event.target.value })}
              />
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
              <Label htmlFor="panel-tags">Tags (comma separated)</Label>
              <Input
                id="panel-tags"
                value={form.tags}
                onChange={(event) => update({ tags: event.target.value })}
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex justify-end pt-1">
              <Button size="sm" onClick={save}>
                <Save className="h-3.5 w-3.5" aria-hidden />
                Save changes
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="font-medium text-ink">{company.employeeCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-medium text-ink">{company.annualRevenue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="font-medium text-ink">{company.ownerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-medium text-ink">{company.source}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="break-all font-medium text-ink">{company.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-ink">{company.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium text-ink">
                  {company.city}, {company.country} {company.address ? `· ${company.address}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium text-ink">
                  {new Date(company.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Last activity: {lastActivityLabel(company.lastActivityAt)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { CompanyDetailsPanel };