import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Centered auth card that reuses the existing design system tokens —
 * intentionally minimal so auth screens do not diverge from the app.
 */
export function AuthShell({ title, description, children, footer, className }: AuthShellProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center px-4 py-10">
      <div className={cn("w-full max-w-md", className)}>
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            F
          </div>
          <div className="text-xl font-semibold tracking-tight text-ink">FinloNexa CRM</div>
        </div>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-ink">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>

        {footer ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </div>
  );
}