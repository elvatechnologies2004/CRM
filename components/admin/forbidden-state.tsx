import Link from "next/link";
import { ArrowLeft, ShieldX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ForbiddenState({
  title = "Access denied",
  description = "You don't have permission to view this section of Platform Administration.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-destructive">
            <ShieldX className="h-7 w-7" aria-hidden />
          </span>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-ink">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back to CRM
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}