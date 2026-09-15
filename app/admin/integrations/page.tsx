import type { Metadata } from "next";
import { Plug } from "lucide-react";

import { PageHeader } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  getIntegrationStatuses,
  type IntegrationCard,
} from "@/lib/admin/integrations";

export const metadata: Metadata = {
  title: "Integrations",
  description: "FinloNexa platform integrations",
};

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  await requirePlatformPermission("integrations.view");

  const cards = await getIntegrationStatuses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Status is derived from real environment and provider configuration. Nothing is shown as connected unless it is genuinely configured."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card: IntegrationCard) => (
          <Card key={card.id}>
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Plug className="h-[18px] w-[18px]" aria-hidden />
                </div>
                <StatusBadge value={card.status} />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-ink">{card.label}</h3>
                <p className="text-[13px] text-muted-foreground">{card.description}</p>
              </div>
              <p className="mt-auto text-xs text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}