import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageBodyProps {
  children: ReactNode;
  className?: string;
}

function PageBody({ children, className }: PageBodyProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

interface PanelCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

function PanelCard({ title, description, actions, children, className }: PanelCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export { PageBody, PanelCard };