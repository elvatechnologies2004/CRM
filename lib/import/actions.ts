"use server";

import { importLeads } from "@/lib/import/csv";
import type { CsvImportResult } from "@/lib/import/csv";

/** Server action wrapper for CSV lead import (Phase 8). */
export async function importLeadsAction(formData: FormData): Promise<{ result: CsvImportResult }> {
  const file = formData.get("csv");
  let csv = "";
  if (file instanceof File) {
    csv = await file.text();
  } else if (typeof file === "string") {
    csv = file;
  }
  if (csv.length > 1_000_000) {
    return {
      result: {
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, reason: "CSV file is too large (max 1MB)" }],
        total: 0,
      },
    };
  }
  const result = await importLeads({ csv });
  return { result };
}

export type { CsvImportResult };