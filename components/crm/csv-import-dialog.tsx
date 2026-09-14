"use client";

import { useState } from "react";
import { Check, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE_CSV =
  "First name,Last name,Email,Job title,Company\n" +
  "Ahmed,Khan,ahmed@techno.com,Operations Manager,Techno Solutions\n" +
  "Sarah,Malik,sarah@brightwave.com,Marketing Manager,BrightWave";

export interface CsvTargetField {
  key: string;
  label: string;
  required?: boolean;
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  targetFields: CsvTargetField[];
  onImport: (rows: Record<string, string>[]) => void;
}

type Step = "upload" | "map" | "review" | "done";

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

function parseCsv(text: string): ParsedCsv {
  const cells: string[] = [];
  const rows: string[][] = [];
  let field = "";
  let inQuotes = false;

  const flushRow = () => {
    cells.push(field.trim());
    field = "";
    if (cells.some((cell) => cell !== "")) rows.push(cells.slice());
    cells.length = 0;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      flushRow();
      if (char === "\r" && text[i + 1] === "\n") i += 1;
    } else {
      field += char;
    }
  }
  flushRow();

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map((header) => header.trim()).filter(Boolean);
  return { headers: headers.length > 0 ? headers : [], rows: headers.length > 0 ? rows.slice(1) : rows };
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function autoMatch(headers: string[], targetFields: CsvTargetField[]) {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();
  for (const target of targetFields) {
    const normalized = normalizeHeader(target.label);
    const exact = headers.find(
      (header) => normalizeHeader(header) === normalizeHeader(target.key)
    );
    const fuzzy = headers.find(
      (header) =>
        !used.has(header) && normalizeHeader(header).includes(normalized)
    );
    const match = exact ?? fuzzy ?? "";
    if (match) used.add(match);
    mapping[target.key] = match;
  }
  return mapping;
}

function CsvImportDialog({
  open,
  onOpenChange,
  title = "Import from CSV",
  description = "Upload a CSV file or paste comma-separated rows, then map the columns.",
  targetFields,
  onImport,
}: CsvImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ParsedCsv>({ headers: [], rows: [] });
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep("upload");
      setCsvText("");
      setParsed({ headers: [], rows: [] });
      setMapping({});
      setSelected([]);
      setImportedCount(0);
    }
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      window.alert("Please select a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setCsvText(result);
      const nextParsed = parseCsv(result);
      setParsed(nextParsed);
      setMapping(autoMatch(nextParsed.headers, targetFields));
      setSelected(nextParsed.rows.map((_, index) => index));
      setStep("map");
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    const nextParsed = parseCsv(csvText);
    if (nextParsed.headers.length === 0) {
      window.alert("No headers found. Make sure the first row contains column names.");
      return;
    }
    setParsed(nextParsed);
    setMapping(autoMatch(nextParsed.headers, targetFields));
    setSelected(nextParsed.rows.map((_, index) => index));
    setStep("map");
  };

  const mappedIndex = (header: string) => parsed.headers.indexOf(header);

  const invalidRows = parsed.rows
    .map((row, index) => {
      const missing = targetFields.some(
        (target) =>
          target.required &&
          (!mapping[target.key] ||
            !row[mappedIndex(mapping[target.key])] ||
            !row[mappedIndex(mapping[target.key])].trim())
      );
      return { index, missing };
    })
    .filter((entry) => entry.missing)
    .map((entry) => entry.index);

  const validSelected = selected.filter((index) => !invalidRows.includes(index));

  const runImport = () => {
    const rows = validSelected.map((index) => {
      const row: Record<string, string> = {};
      for (const target of targetFields) {
        const header = mapping[target.key];
        const cell = header ? parsed.rows[index][mappedIndex(header)] ?? "" : "";
        row[target.key] = cell;
      }
      return row;
    });
    onImport(rows);
    setImportedCount(rows.length);
    setStep("done");
  };

  const toggleAll = () => {
    setSelected(
      selected.length === parsed.rows.length
        ? []
        : parsed.rows.map((_, index) => index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "done" ? "Import complete" : title}</DialogTitle>
          <DialogDescription>
            {step === "done"
              ? `${importedCount} ${
                  importedCount === 1 ? "record was" : "records were"
                } added successfully.`
              : description}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-1 text-xs">
          {(["upload", "map", "review", "done"] as Step[]).map((stepName, index) => (
            <li key={stepName} className="flex items-center gap-1">
              <span className="text-muted-foreground">—</span>
              <span
                className={
                  index <= ["upload", "map", "review", "done"].indexOf(step)
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                }
              >
                {stepName === "upload"
                  ? "1. Upload"
                  : stepName === "map"
                    ? "2. Map columns"
                    : stepName === "review"
                      ? "3. Review"
                      : "4. Done"}
              </span>
            </li>
          ))}
        </ol>

        {step === "upload" && (
          <div className="space-y-4">
            <label
              htmlFor="csv-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-medium text-ink">
                Click to select a CSV file
              </span>
              <span className="text-xs text-muted-foreground">
                Only .csv files are accepted right now.
              </span>
              <input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            <div className="space-y-2">
              <Label htmlFor="csv-paste">Or paste CSV data</Label>
              <Textarea
                id="csv-paste"
                rows={6}
                value={csvText}
                onChange={(event) => setCsvText(event.target.value)}
                placeholder={SAMPLE_CSV}
                className="font-mono text-xs"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  disabled={!csvText.trim()}
                >
                  Continue with pasted data
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Match your CSV columns to {title === "Import from CSV" ? "fields" : "fields"}.
              <span className="text-danger"> *</span> marks required fields.
            </p>
            {parsed.headers.length === 0 ? (
              <p className="text-xs text-danger">No columns were detected in the upload.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {targetFields.map((target) => (
                  <div key={target.key} className="space-y-1.5">
                    <Label className="text-xs">
                      {target.label}
                      {target.required && <span className="text-danger"> *</span>}
                    </Label>
                    <Select
                      value={mapping[target.key]}
                      onValueChange={(value) =>
                        setMapping((prev) => ({ ...prev, [target.key]: value }))
                      }
                    >
                      <SelectTrigger aria-label={`Map column for ${target.label}`}>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">— Skip —</SelectItem>
                        {parsed.headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const unmappedRequired = targetFields.filter(
                    (target) =>
                      target.required && !mapping[target.key]
                  );
                  if (unmappedRequired.length > 0) {
                    window.alert(
                      `Map the required fields: ${unmappedRequired
                        .map((target) => target.label)
                        .join(", ")}`
                    );
                    return;
                  }
                  setStep("review");
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {parsed.rows.length} rows detected.{" "}
              {invalidRows.length > 0
                ? `${invalidRows.length} row${
                    invalidRows.length === 1 ? " is" : "s are"
                  } missing required fields and will be skipped.`
                : "All rows can be imported."}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                id="select-all-rows"
                checked={selected.length === parsed.rows.length}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
              />
              <label htmlFor="select-all-rows" className="cursor-pointer">
                Select all
              </label>
              <span className="ml-auto tabular-nums">
                {validSelected.length} selected
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-border bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="w-8 px-2 py-2" />
                    <th className="px-2 py-2 font-medium">
                      {targetFields.find((target) => target.required)?.label ?? "Record"}
                    </th>
                    <th className="px-2 py-2 font-medium">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.rows.slice(0, 20).map((row, rowIndex) => {
                    const isInvalid = invalidRows.includes(rowIndex);
                    const nameHeader = mapping[targetFields[0]?.key];
                    const companyHeader = mapping.companyName || mapping.company;
                    return (
                      <tr
                        key={rowIndex}
                        className={isInvalid ? "bg-warning/5" : "bg-card"}
                      >
                        <td className="px-2 py-2">
                          <Checkbox
                            checked={selected.includes(rowIndex)}
                            disabled={isInvalid}
                            onCheckedChange={(checked) =>
                              setSelected((prev) =>
                                checked
                                  ? [...prev, rowIndex]
                                  : prev.filter((index) => index !== rowIndex)
                              )
                            }
                            aria-label={
                              nameHeader
                                ? `Include ${row[mappedIndex(nameHeader)] ?? ""}`
                                : `Include row ${rowIndex + 1}`
                            }
                          />
                        </td>
                        <td className="px-2 py-2">
                          {nameHeader ? row[mappedIndex(nameHeader)] ?? "" : `Row ${rowIndex + 1}`}
                          {isInvalid && (
                            <span className="ml-1 text-warning">missing required</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {companyHeader ? row[mappedIndex(companyHeader)] ?? "—" : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("map")}>
                Back
              </Button>
              <Button
                type="button"
                onClick={runImport}
                disabled={validSelected.length === 0}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" aria-hidden />
                Import {validSelected.length} rows
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
            <p className="text-sm font-medium text-ink">
              {importedCount} {importedCount === 1 ? "record" : "records"} imported
            </p>
            <p className="text-xs text-muted-foreground">
              The imported {importedCount === 1 ? "record is" : "records are"} now
              visible in your list.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  setStep("upload");
                  setCsvText("");
                }}
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden />
                Import more
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { CsvImportDialog };