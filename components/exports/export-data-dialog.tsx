"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ExportScope = "leads" | "opportunities" | "proposals" | "sales_report" | "lead" | "opportunity";
export type ExportFormat = "pdf" | "xlsx";
type DateRangePreset = "today" | "last7" | "last30" | "month" | "custom" | "all";

interface ExportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope?: ExportScope;
  recordId?: string;
  title?: string;
  defaultFrom?: string;
  defaultTo?: string;
}

export function ExportDataDialog({ open, onOpenChange, defaultScope = "sales_report", recordId, title = "Export Sales Data", defaultFrom = "", defaultTo = "" }: ExportDataDialogProps) {
  const [scope, setScope] = useState<ExportScope>(defaultScope);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [rangePreset, setRangePreset] = useState<DateRangePreset>(defaultFrom || defaultTo ? "custom" : "all");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState("");
  const [source, setSource] = useState("");
  const [outcome, setOutcome] = useState("");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [loading, setLoading] = useState(false);

  const requestLabel = useMemo(() => (format === "pdf" ? "Generating PDF..." : "Generating Excel..."), [format]);

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleRangeChange = (value: DateRangePreset) => {
    setRangePreset(value);
    const today = new Date();
    if (value === "all") {
      setFrom("");
      setTo("");
      return;
    }
    if (value === "custom") return;
    if (value === "today") {
      setFrom(formatDateInput(today));
      setTo(formatDateInput(today));
      return;
    }
    if (value === "month") {
      setFrom(formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
      setTo(formatDateInput(today));
      return;
    }
    const days = value === "last7" ? 6 : 29;
    const start = new Date(today);
    start.setDate(today.getDate() - days);
    setFrom(formatDateInput(start));
    setTo(formatDateInput(today));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = {
        scope,
        format,
        id: recordId,
        from: from || undefined,
        to: to || undefined,
        ownerId: owner || undefined,
        stage: stage || undefined,
        source: source || undefined,
        outcome: outcome || undefined,
      };

      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Export failed.");
      }

      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(contentDisposition) || /filename\*?=(?:UTF-8'')?([^;]+)/i.exec(contentDisposition);
      const filename = match ? decodeURIComponent(match[1].replace(/['"]/g, "")) : `finlonexa-export.${format}`;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to generate export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Export Type</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input type="radio" name="scope" checked={scope === "leads"} onChange={() => setScope("leads")} />
                <span>Leads</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input type="radio" name="scope" checked={scope === "opportunities"} onChange={() => setScope("opportunities")} />
                <span>Opportunities</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input type="radio" name="scope" checked={scope === "proposals"} onChange={() => setScope("proposals")} />
                <span>Proposals</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input type="radio" name="scope" checked={scope === "sales_report"} onChange={() => setScope("sales_report")} />
                <span>Full Sales Report</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-range">Date Range</Label>
            <select
              id="date-range"
              value={rangePreset}
              onChange={(event) => handleRangeChange(event.target.value as DateRangePreset)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-date">From</Label>
              <Input id="from-date" type="date" value={from} disabled={rangePreset !== "custom"} onChange={(e) => { setRangePreset("custom"); setFrom(e.target.value); }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To</Label>
              <Input id="to-date" type="date" value={to} disabled={rangePreset !== "custom"} onChange={(e) => { setRangePreset("custom"); setTo(e.target.value); }} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="owner-filter">Owner</Label>
              <Input id="owner-filter" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="All owners" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-filter">Stage</Label>
              <Input id="stage-filter" value={stage} onChange={(e) => setStage(e.target.value)} placeholder="All stages" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-filter">Source</Label>
              <Input id="source-filter" value={source} onChange={(e) => setSource(e.target.value)} placeholder="All sources" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome-filter">Outcome</Label>
              <Input id="outcome-filter" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="All outcomes" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Export Format</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input type="radio" name="format" checked={format === "pdf"} onChange={() => setFormat("pdf")} />
                <span>PDF Report (.pdf)</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input type="radio" name="format" checked={format === "xlsx"} onChange={() => setFormat("xlsx")} />
                <span>Excel Workbook (.xlsx)</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading}>{loading ? requestLabel : "Generate Export"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
