"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-[#b45309]">
            <AlertTriangle className="h-7 w-7" aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              The platform admin view failed to load. This was not caused by your
              changes — please try again or check the database migration.
            </p>
            {error.digest ? (
              <p className="text-[11px] text-muted-foreground">Error ID: {error.digest}</p>
            ) : null}
          </div>
          <Button size="sm" onClick={reset} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}