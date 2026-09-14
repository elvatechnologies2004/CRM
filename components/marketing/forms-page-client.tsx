"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrmForm } from "@/lib/types";

interface MarketingFormsPageClientProps {
  initialForms: CrmForm[];
}

function MarketingFormsPageClient({ initialForms }: MarketingFormsPageClientProps) {
  const forms = useMemo(() => initialForms, [initialForms]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Forms</h1>
        <Button size="sm" variant="ghost">
          + New Form
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {forms.map((form) => (
          <div
            key={form.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-ink">{form.name}</p>
              <Badge variant={form.status === "Active" ? "success" : "secondary"} className="text-[10px]">
                {form.status}
              </Badge>
            </div>
            {form.description && (
              <p className="text-sm text-muted-foreground">{form.description}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {form.fields.map((field) => (
                <span key={field.id} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                  {field.label}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {form.submissions.toLocaleString()} submissions
              </p>
              <Button size="sm" variant="outline">
                Open
              </Button>
            </div>
          </div>
        ))}
        {forms.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No forms found.
          </p>
        )}
      </div>
    </div>
  );
}

export { MarketingFormsPageClient };