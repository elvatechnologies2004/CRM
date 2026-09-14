"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  FolderArchive,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LeadRecord, LeadSourceOption, LeadStatus, User } from "@/lib/types";

const LEAD_SOURCES: LeadSourceOption[] = [
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

const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Unqualified",
];

function normalizeSource(raw: string): LeadSourceOption {
  const trimmed = raw.trim().toLowerCase();
  const match = LEAD_SOURCES.find((source) => source.toLowerCase() === trimmed);
  return match ?? "Manual";
}

function normalizeStatus(raw: string): LeadStatus {
  const trimmed = raw.trim().toLowerCase();
  const match = LEAD_STATUSES.find((status) => status.toLowerCase() === trimmed);
  return match ?? "New";
}

const SAMPLE_CSV = [
  "First name,Last name,Email,Phone,Company name,Job title,Country,City,Source,Status,Expected value",
  "Amna,Yusuf,amna.yusuf@nexa.example,+92 300 1239090,Nexa Digital,Marketing Lead,Pakistan,Lahore,Website,New,7500",
  "David,Reed,david.reed@atlas.example,+1 512 555 0140,Atlas Cloud,CTO,United States,Austin,Referral,New,16000",
  "Elena,Castro,elena@vivid.example,+34 611 222 333,Vivid Studio,Founder,Spain,Madrid,Instagram,New,5000",
].join("\n");

interface ImportLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: User[];
  onImport: (leads: LeadRecord[]) => void;
}

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "leads-sample.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string, owners: User[]): LeadRecord[] {
  const owner = owners[0] ?? { id: "u_1", name: "Hussain Ali", role: "", email: "" };
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (rows.length < 2) return [];
  const expectedHeader = rows[0].toLowerCase();
  const isHeader = expectedHeader.includes("first") && expectedHeader.includes("email");
  const dataRows = isHeader ? rows.slice(1) : rows;
  const now = new Date().toISOString();

  return dataRows.slice(0, 50).map((line, index) => {
    const columns = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const record: LeadRecord = {
      id: `l_imp_${Date.now().toString(36)}_${index}`,
      firstName: columns[0] || "Imported",
      lastName: columns[1] || "Lead",
      email: columns[2] || "",
      phone: columns[3] || "",
      whatsapp: columns[3] || "",
      companyName: columns[4] || "Unknown Company",
      jobTitle: columns[5] || "",
      country: columns[6] || "",
      city: columns[7] || "",
      source: normalizeSource(columns[8] ?? ""),
      status: normalizeStatus(columns[9] ?? ""),
      score: 60,
      ownerId: owner.id,
      ownerName: owner.name,
      expectedValue: Number(columns[10]) || 0,
      currency: "USD",
      budget: "Unclear",
      interest: "",
      tags: ["Imported"],
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      qualification: {
        budget: "Unclear",
        authority: "Unknown",
        need: "Moderate",
        timeline: "6+ Months",
        score: 30,
      },
    };
    return record;
  });
}

function ImportLeadDialog({ open, onOpenChange, owners, onImport }: ImportLeadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFileName(null);
      setError(null);
      setImportedCount(null);
    }
  }

  const handleFile = (file: File | undefined) => {
    setError(null);
    setImportedCount(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setError("Please choose a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const leads = parseCsv(text, owners);
      setFileName(file.name);
      setImportedCount(leads.length);
      onImport(leads);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple leads at once.
          </DialogDescription>
        </DialogHeader>

        <label
          htmlFor="import-leads-csv"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
        >
          <FolderArchive className="h-7 w-7 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium text-ink">Drop your CSV here or browse</span>
          <span className="text-xs text-muted-foreground">
            {fileName ? fileName : "Supports .csv with lead fields in the first row"}
          </span>
          <input
            id="import-leads-csv"
            type="file"
            accept=".csv"
            className="sr-only"
            ref={fileInputRef}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        {importedCount !== null && importedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-[#15803d]">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {importedCount} lead{importedCount === 1 ? "" : "s"} imported from the file.
          </div>
        )}
        {importedCount !== null && importedCount === 0 && (
          <p className="text-sm text-warning">
            The file did not contain any rows to import.
          </p>
        )}

        <div className="flex items-center gap-1.5 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">Don&apos;t have a file?</span>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden />
            Download sample CSV
          </button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            setFileName(null);
            setError(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}>
            <Upload className="h-4 w-4" aria-hidden />
            Choose another file
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ImportLeadDialog };