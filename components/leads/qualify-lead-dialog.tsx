"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

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
import type { LeadRecord } from "@/lib/types";

export interface QualificationFormValues {
  budget: string;
  authority: string;
  need: string;
  timeline: string;
  expectedOpportunityValue: string;
  notes: string;
}

interface QualifyLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadRecord | null;
  busy?: boolean;
  onConfirm: (values: QualificationFormValues) => void;
}

const budgetOptions = ["Confirmed", "Estimated", "Unclear"];
const authorityOptions = ["Likely Decision Maker", "Influencer", "Unknown"];
const needOptions = ["Strong", "Moderate", "Weak"];
const timelineOptions = ["< 1 Month", "1–2 Months", "This Quarter", "6+ Months"];

function QualifyLeadDialog({
  open,
  onOpenChange,
  lead,
  busy = false,
  onConfirm,
}: QualifyLeadDialogProps) {
  const [form, setForm] = useState<QualificationFormValues>({
    budget: "Estimated",
    authority: "Unknown",
    need: "Moderate",
    timeline: "This Quarter",
    expectedOpportunityValue: "",
    notes: "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && lead) {
      setForm({
        budget: lead.qualification?.budget ?? "Estimated",
        authority: lead.qualification?.authority ?? "Unknown",
        need: lead.qualification?.need ?? "Moderate",
        timeline: lead.qualification?.timeline ?? "This Quarter",
        expectedOpportunityValue: String(lead.expectedValue || ""),
        notes: "",
      });
    }
  }

  if (!lead) return null;

  const updateField = (field: keyof QualificationFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseAi = async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error("AI analysis unavailable");
      }
      const payload = (await response.json()) as { insight?: { headline?: string; detail?: string } };
      const nextSummary = payload.insight?.headline || payload.insight?.detail || "AI review generated.";
      setAiSummary(nextSummary);
      setForm((prev) => ({
        ...prev,
        notes: prev.notes ? `${prev.notes}\n${nextSummary}` : nextSummary,
      }));
    } catch {
      const fallback = "AI analysis is not available right now. You can continue manually.";
      setAiSummary(fallback);
      setForm((prev) => ({ ...prev, notes: prev.notes ? `${prev.notes}\n${fallback}` : fallback }));
    } finally {
      setAiLoading(false);
    }
  };

  const canConfirm = !busy && lead;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Qualify Lead</DialogTitle>
          <DialogDescription>
            Review the current information for {lead.firstName} {lead.lastName} before approving qualification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lead</p>
              <p className="font-medium text-ink">{lead.firstName} {lead.lastName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Company</p>
              <p className="font-medium text-ink">{lead.companyName || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current stage</p>
              <p className="font-medium text-ink">{lead.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected value</p>
              <p className="font-medium text-ink">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: lead.currency,
                  maximumFractionDigits: 0,
                }).format(lead.expectedValue || 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Select value={form.budget} onValueChange={(value) => updateField("budget", value)}>
                <SelectTrigger aria-label="Budget">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Authority</Label>
              <Select value={form.authority} onValueChange={(value) => updateField("authority", value)}>
                <SelectTrigger aria-label="Authority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {authorityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Need</Label>
              <Select value={form.need} onValueChange={(value) => updateField("need", value)}>
                <SelectTrigger aria-label="Need">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {needOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Timeline</Label>
              <Select value={form.timeline} onValueChange={(value) => updateField("timeline", value)}>
                <SelectTrigger aria-label="Timeline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timelineOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expected-opportunity-value">Expected opportunity value</Label>
            <Input
              id="expected-opportunity-value"
              type="number"
              min={0}
              value={form.expectedOpportunityValue}
              onChange={(event) => updateField("expectedOpportunityValue", event.target.value)}
              placeholder="25000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qualification-notes">Qualification notes</Label>
            <Textarea
              id="qualification-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Add any qualification context…"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleUseAi} disabled={aiLoading}>
              {aiLoading ? "Analyzing..." : "Use AI"}
            </Button>
          </div>
          {aiSummary && (
            <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
              {aiSummary}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm(form)} disabled={!canConfirm}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Approve & Qualify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { QualifyLeadDialog };
