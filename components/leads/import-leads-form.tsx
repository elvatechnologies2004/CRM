"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, Loader2, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/crm/alert";
import { Button } from "@/components/ui/button";
import { importLeadsAction, type CsvImportResult } from "@/lib/import/actions";

function ImportLeadsForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("csv") as HTMLInputElement;
    if (!fileInput?.files?.length) {
      setError("Choose a CSV file first.");
      return;
    }
    setLoading(true);
    try {
      const { result: res } = await importLeadsAction(new FormData(form));
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert tone="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <div className="space-y-3">
          <Alert tone={result.imported > 0 ? "success" : "warning"}>
            <div className="flex items-center gap-2">
              {result.imported > 0 ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <TriangleAlert className="h-4 w-4 shrink-0" />
              )}
              <AlertDescription>
                Imported <strong>{result.imported}</strong>, skipped{" "}
                <strong>{result.skipped}</strong> of {result.total} rows.
              </AlertDescription>
            </div>
          </Alert>
          {result.errors.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-semibold text-ink">Details</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {result.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>
                    {err.row > 0 ? `Row ${err.row}: ` : ""}
                    {err.reason}
                  </li>
                ))}
                {result.errors.length > 10 ? (
                  <li className="text-xs">… and {result.errors.length - 10} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}
          <Button variant="outline" onClick={() => setResult(null)}>
            Import another file
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Alert>
            <AlertDescription>
              Expected columns: <code>First Name, Last Name, Email, Phone, Company, Job Title,
              Source, Score, Expected Value, Tags, Owner Email</code>. Name or email is
              required per row. Invalid rows are skipped, not aborted.
            </AlertDescription>
          </Alert>
          <label
            htmlFor="csv-file"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary/40"
          >
            <FileUp className="h-8 w-8 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium text-ink">Choose a CSV to import</span>
            <span className="text-xs text-muted-foreground">.csv up to 1MB</span>
            <input id="csv-file" name="csv" type="file" accept=".csv,text/csv" required className="sr-only" />
          </label>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Importing…" : "Import leads"}
          </Button>
        </form>
      )}
    </div>
  );
}

export { ImportLeadsForm };