"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IntegrationCard } from "@/lib/types";

interface IntegrationsPageClientProps {
  initialIntegrations: IntegrationCard[];
}

const statusTone: Record<IntegrationCard["status"], "success" | "info" | "secondary"> = {
  Connected: "success",
  "Not Connected": "info",
  "Coming Soon": "secondary",
};

const statusAction: Record<IntegrationCard["status"], string> = {
  Connected: "Manage",
  "Not Connected": "Connect",
  "Coming Soon": "Notify Me",
};

function IntegrationsPageClient({ initialIntegrations }: IntegrationsPageClientProps) {
  const integrations = useMemo(() => initialIntegrations, [initialIntegrations]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Integrations</h1>
        <Button size="sm" variant="ghost">
          + Browse Integrations
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: integration.color }}
                  aria-hidden
                >
                  {integration.name.charAt(0)}
                </span>
                <p className="font-medium text-ink">{integration.name}</p>
              </div>
              <Badge variant={statusTone[integration.status]} className="text-[10px]">
                {integration.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{integration.description}</p>
            {integration.connectedAt && (
              <p className="text-xs text-muted-foreground">
                Connected {new Date(integration.connectedAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
              </p>
            )}
            <div className="mt-auto">
              <Button
                size="sm"
                variant={integration.status === "Connected" ? "outline" : "default"}
                disabled={integration.status === "Coming Soon"}
              >
                {statusAction[integration.status]}
              </Button>
            </div>
          </div>
        ))}
        {integrations.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No integrations found.
          </p>
        )}
      </div>
    </div>
  );
}

export { IntegrationsPageClient };