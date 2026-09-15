import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "py-8" : "py-14"}>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            {Icon ? <Icon className="h-6 w-6" aria-hidden /> : null}
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">{title}</p>
            {description ? (
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </CardContent>
      </Card>
    </div>
  );
}

export function NotAvailable({
  label = "Not Available",
}: {
  label?: string;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}