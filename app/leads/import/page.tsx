import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ImportLeadsForm } from "@/components/leads/import-leads-form";

export const metadata = { title: "Import leads" };

export default function ImportLeadsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <Link
          href="/leads"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to leads
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Import leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bulk-add leads from a CSV file. Rows are validated and inserted with
          your workspace as owner.
        </p>
      </div>
      <ImportLeadsForm />
    </div>
  );
}