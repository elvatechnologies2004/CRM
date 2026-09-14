import { NextRequest, NextResponse } from "next/server";

import { generateText } from "@/lib/ai/gemini";
import { getActiveOrgId } from "@/lib/crm/base";
import { isGeminiConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AiInsight, AiInsightKind } from "@/lib/types";

export const runtime = "nodejs";

const KIND_VALUES: AiInsightKind[] = [
  "Revenue Opportunity",
  "At-Risk Deals",
  "Inactive Customers",
  "Sales Bottleneck",
  "High-Performing Source",
  "Team Performance",
];

const cannedInsight: AiInsight = {
  id: `ins_${Date.now()}`,
  kind: "Revenue Opportunity",
  headline: "3 deals are showing strong buying signals this week",
  detail:
    "Multiple open deals have moved stages recently and are ready for a focused close push.",
  impact: "~$150,000 revenue this quarter",
  action: "Create follow-up tasks for the affected deal owners",
  actionLabel: "Create Tasks",
};

function safeJsonExtract(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toInsight(raw: Record<string, unknown>): AiInsight | null {
  const headline = typeof raw.headline === "string" ? raw.headline.trim() : "";
  const detail = typeof raw.detail === "string" ? raw.detail.trim() : "";
  const impact = typeof raw.impact === "string" ? raw.impact.trim() : "";
  const action = typeof raw.action === "string" ? raw.action.trim() : "";
  const actionLabel = typeof raw.actionLabel === "string" ? raw.actionLabel.trim() : action;
  const rawKind = typeof raw.kind === "string" ? raw.kind.trim() : "";
  const kind = KIND_VALUES.find((k) => rawKind.toLowerCase().includes(k.toLowerCase()));
  if (!headline || !detail || !kind) return null;
  return {
    id: `ins_${Date.now()}`,
    kind,
    headline,
    detail,
    impact: impact || "No quantified impact",
    action: action || headline,
    actionLabel: actionLabel || "Review",
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) {
    return NextResponse.json({ error: "no active workspace" }, { status: 400 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json({ insight: cannedInsight, source: "fallback" });
  }

  try {
    const [{ data: deals }, { data: leads }] = await Promise.all([
      supabase
        .from("deals")
        .select("name, value, probability, won_at, lost_at, stages(name)")
        .eq("organization_id", organizationId)
        .order("value", { ascending: false })
        .limit(25),
      supabase
        .from("leads")
        .select("full_name, company_name, status, score, source")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const dealLines = (deals ?? []).map((d) => {
      const stage = Array.isArray(d.stages)
        ? null
        : (d.stages as { name: string | null } | null);
      const state = d.won_at ? "Won" : d.lost_at ? "Lost" : "Open";
      return `- ${d.name ?? "Untitled"}: Rs ${d.value ?? 0} @ ${d.probability ?? 0}% (${state}, stage ${stage?.name ?? "unknown"})`;
    });
    const leadLines = (leads ?? []).map((l) => {
      const name = l.full_name || l.company_name || "Untitled";
      return `- ${name}: status ${l.status ?? "?"}, score ${l.score ?? "-"}, source ${l.source ?? "?"}`;
    });
    const context = [
      `Open/won/lost deals (${(deals ?? []).length} shown):`,
      ...dealLines,
      "",
      `Recent leads (${(leads ?? []).length} shown):`,
      ...leadLines,
    ].join("\n");

    const system =
      "You are a sales intelligence analyst for a CRM. Given CRM data as text, " +
      "produce exactly ONE actionable insight as STRICT JSON with these fields: " +
      "kind (one of: Revenue Opportunity, At-Risk Deals, Inactive Customers, " +
      "Sales Bottleneck, High-Performing Source, Team Performance), headline " +
      "(short, punchy), detail (2-3 sentences referencing real account or deal names " +
      "from the data), impact (quantified where possible, e.g. '~$120,000 pipeline'), " +
      "action (a concrete next step), actionLabel (3 words max). Output ONLY the JSON object.";

    const raw = await generateText({
      system,
      prompt: `CRM snapshot:\n${context}`,
      temperature: 0.4,
      maxOutputTokens: 1024,
    });

    const parsed = safeJsonExtract(raw);
    const insight = parsed ? toInsight(parsed) : null;
    if (!insight) {
      return NextResponse.json({ insight: cannedInsight, source: "fallback" });
    }
    return NextResponse.json({ insight, source: "gemini" });
  } catch {
    return NextResponse.json({ insight: cannedInsight, source: "fallback" });
  }
}