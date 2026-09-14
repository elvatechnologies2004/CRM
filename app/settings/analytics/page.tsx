import { notFound, redirect } from "next/navigation";

import { AnalyticsClient } from "@/components/settings/analytics-client";
import { getOrgAnalytics } from "@/lib/analytics/metrics";
import { can } from "@/lib/crm/context";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const allowed = (await can("admin")) || (await can("analytics.view")) || (await can("settings.manage"));
  if (!allowed) redirect("/dashboard");

  const snapshot = await getOrgAnalytics();
  if (!snapshot) notFound();

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Workspace usage and product activity (Step 99). Privacy-conscious — no message bodies
          or customer PII are collected.
        </p>
      </div>
      <AnalyticsClient snapshot={snapshot} />
    </div>
  );
}