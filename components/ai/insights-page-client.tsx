"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiInsight, AiInsightKind } from "@/lib/types";

interface AIInsightsPageClientProps {
  initialInsights: AiInsight[];
}

const kindTone: Record<AiInsightKind, "info" | "success" | "warning" | "danger"> = {
  "Revenue Opportunity": "success",
  "At-Risk Deals": "danger",
  "Inactive Customers": "warning",
  "Sales Bottleneck": "warning",
  "High-Performing Source": "info",
  "Team Performance": "info",
};

function AIInsightsPageClient({ initialInsights }: AIInsightsPageClientProps) {
  const [insights, setInsights] = useState<AiInsight[]>(initialInsights);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = (await response.json().catch(() => null)) as {
        insight?: AiInsight;
        error?: string;
      } | null;
      if (!response.ok || !payload?.insight) {
        throw new Error(payload?.error ?? "Unable to generate insight");
      }
      setInsights((prev) => [payload.insight as AiInsight, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate insight");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">AI Insights</h1>
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "+ Generate Insight"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant={kindTone[insight.kind]} className="text-[10px]">
                {insight.kind}
              </Badge>
            </div>
            <p className="font-medium text-ink">{insight.headline}</p>
            <p className="text-sm text-muted-foreground">{insight.detail}</p>
            <div className="mt-auto flex flex-col gap-2">
              <p className="rounded-lg border border-border/70 bg-muted/40 p-2 text-xs text-ink">
                Impact: {insight.impact}
              </p>
              <p className="text-xs text-muted-foreground">{insight.action}</p>
              <Button size="sm" variant="outline">
                {insight.actionLabel}
              </Button>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No insights found.
          </p>
        )}
      </div>
    </div>
  );
}

export { AIInsightsPageClient };