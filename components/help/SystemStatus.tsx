"use client";

import { CheckCircle2, AlertTriangle, CircleX, PlugZap } from "lucide-react";
import type { SystemStatusItem, SystemStatusValue } from "@/lib/help-data";

const statusConfig: Record<SystemStatusValue, { icon: React.ElementType; className: string; label: string }> = {
  Operational: { icon: CheckCircle2, className: "text-emerald-600", label: "Operational" },
  Degraded: { icon: AlertTriangle, className: "text-amber-600", label: "Degraded" },
  Offline: { icon: CircleX, className: "text-red-600", label: "Offline" },
  "Not Connected": { icon: PlugZap, className: "text-muted-foreground", label: "Not Connected" },
};

interface SystemStatusProps {
  items: SystemStatusItem[];
}

export function SystemStatus({ items }: SystemStatusProps) {
  return (
    <div className="bg-card rounded-xl border-border p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          System Status
        </h2>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          All core services operational
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <div
              key={item.key}
              className="rounded-lg border border-border p-3 flex items-center gap-3"
            >
              <Icon className={`h-4 w-4 shrink-0 ${cfg.className}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{item.key}</p>
                <p className={`text-[11px] ${cfg.className}`}>{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}