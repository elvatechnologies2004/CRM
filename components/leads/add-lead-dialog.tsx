"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const sourceOptions = [
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
] as const;

export interface AddLeadFormState {
  customerName: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  owner: string;
  notes: string;
}

interface AddLeadDialogProps {
  open: boolean;
  owners: string[];
  onOpenChange: (open: boolean) => void;
  onCreate: (values: AddLeadFormState) => Promise<void> | void;
  loading?: boolean;
}

export function AddLeadDialog({ open, owners, onOpenChange, onCreate, loading = false }: AddLeadDialogProps) {
  const [form, setForm] = useState<AddLeadFormState>({
    customerName: "",
    company: "",
    email: "",
    phone: "",
    source: "Website",
    owner: owners[0] ?? "",
    notes: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const resetForm = () => {
    setForm({
      customerName: "",
      company: "",
      email: "",
      phone: "",
      source: "Website",
      owner: owners[0] ?? "",
      notes: "",
    });
    setConfirmOpen(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customerName.trim()) return;
    setConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    await onCreate(form);
    resetForm();
    onOpenChange(false);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>
              Create a new lead. Every new lead starts as NEW automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  value={form.customerName}
                  onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company</Label>
                <Input
                  id="company-name"
                  value={form.company}
                  onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                  placeholder="Acme Labs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="jane@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+92 300 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-source">Lead Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, source: value }))}
                >
                  <SelectTrigger id="lead-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-owner">Owner</Label>
                <Select
                  value={form.owner}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, owner: value }))}
                >
                  <SelectTrigger id="lead-owner">
                    <SelectValue placeholder="Choose owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Any initial notes or observations"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !form.customerName.trim()}>
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Lead?</DialogTitle>
            <DialogDescription>
              Review the lead details before saving to your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div><span className="text-muted-foreground">Customer</span><p className="font-medium">{form.customerName || "—"}</p></div>
              <div><span className="text-muted-foreground">Company</span><p className="font-medium">{form.company || "—"}</p></div>
              <div><span className="text-muted-foreground">Email</span><p className="font-medium">{form.email || "—"}</p></div>
              <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{form.phone || "—"}</p></div>
              <div><span className="text-muted-foreground">Source</span><p className="font-medium">{form.source || "—"}</p></div>
              <div><span className="text-muted-foreground">Owner</span><p className="font-medium">{form.owner || "—"}</p></div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Back to Edit
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setConfirmOpen(false); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmCreate} disabled={loading}>
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
