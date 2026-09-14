"use client";

import * as React from "react";
import { useState } from "react";
import { CircleCheckBig } from "lucide-react";

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
import type { LeadRecord, User } from "@/lib/types";

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadRecord | null;
  owners: User[];
  onConvert: (lead: LeadRecord, dealId: string) => void;
}

interface ConvertForm {
  dealName: string;
  pipeline: string;
  stage: string;
  value: string;
  currency: string;
  close: string;
  owner: string;
  products: string;
  notes: string;
}

function ConvertLeadDialog({
  open,
  onOpenChange,
  lead,
  owners,
  onConvert,
}: ConvertLeadDialogProps) {
  const [form, setForm] = useState<ConvertForm>({
    dealName: "",
    pipeline: "Sales Pipeline",
    stage: "Qualified",
    value: "",
    currency: "PKR",
    close: "This Quarter",
    owner: "",
    products: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && lead) {
      setForm({
        dealName: `${lead.firstName} ${lead.lastName} — ${lead.companyName}`.trim(),
        pipeline: "Sales Pipeline",
        stage: lead.status === "Proposal" ? "Proposal" : "Qualified",
        value: String(lead.expectedValue || ""),
        currency: lead.currency || "PKR",
        close: "This Quarter",
        owner: lead.ownerName,
        products: lead.interest,
        notes: "",
      });
      setError(null);
      setCreatedDealId(null);
    }
  }

  if (!lead) return null;

  const update = (patch: Partial<ConvertForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleConvert = () => {
    if (!form.dealName.trim()) {
      setError("Deal name is required.");
      return;
    }
    const value = Number(form.value) || 0;
    if (value <= 0) {
      setError("Deal value must be greater than 0.");
      return;
    }
    setError(null);
    const dealId = `DEAL-${1042 + Math.floor(Math.random() * 800)}`;
    setCreatedDealId(dealId);
    onConvert(lead, dealId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Deal</DialogTitle>
          <DialogDescription>
            Create a deal from this lead and move it into your pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="convert-deal-name">
              Deal name <span className="text-danger">*</span>
            </Label>
            <Input
              id="convert-deal-name"
              value={form.dealName}
              onChange={(event) => update({ dealName: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={lead.companyName} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Input
              value={`${lead.firstName} ${lead.lastName} (${lead.email})`}
              readOnly
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <Label>Pipeline</Label>
            <Select value={form.pipeline} onValueChange={(value) => update({ pipeline: value })}>
              <SelectTrigger aria-label="Deal pipeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sales Pipeline">Sales Pipeline</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={form.stage} onValueChange={(value) => update({ stage: value })}>
              <SelectTrigger aria-label="Deal stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="convert-value">
              Deal value <span className="text-danger">*</span>
            </Label>
            <Input
              id="convert-value"
              type="number"
              min={0}
              value={form.value}
              onChange={(event) => update({ value: event.target.value })}
              placeholder="24000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(value) => update({ currency: value })}>
              <SelectTrigger aria-label="Currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PKR">PKR (₨)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="AED">AED (د.إ)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Expected close</Label>
            <Select value={form.close} onValueChange={(value) => update({ close: value })}>
              <SelectTrigger aria-label="Expected close">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This Month">This month</SelectItem>
                <SelectItem value="This Quarter">This quarter</SelectItem>
                <SelectItem value="Next Quarter">Next quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Select value={form.owner} onValueChange={(value) => update({ owner: value })}>
              <SelectTrigger aria-label="Deal owner">
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="convert-products">Products / services</Label>
            <Textarea
              id="convert-products"
              rows={2}
              value={form.products}
              onChange={(event) => update({ products: event.target.value })}
              placeholder="What will this deal include?"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="convert-notes">Notes</Label>
            <Textarea
              id="convert-notes"
              rows={2}
              value={form.notes}
              onChange={(event) => update({ notes: event.target.value })}
              placeholder="Additional context for the deal…"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {createdDealId && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-[#15803d]">
            <CircleCheckBig className="h-4 w-4" aria-hidden />
            Deal <span className="font-semibold">{createdDealId}</span> created for{" "}
            {lead.companyName}.
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConvert}>
            {createdDealId ? "Deal created" : "Create Deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConvertLeadDialog };