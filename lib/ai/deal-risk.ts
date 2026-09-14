/**
 * Deal risk analysis using AI.
 * Server-only. Validates AI output before returning.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import { generateStructuredOutput } from "@/lib/ai/provider";
import { buildDealRiskPrompt } from "@/lib/ai/prompts";
import { DealRiskSchema } from "@/lib/ai/schemas";
import type { DealRiskResult } from "@/lib/ai/schemas";

/**
 * Analyze deal risk using AI.
 * Fetches the deal and related CRM context from the database.
 */
export async function analyzeDealRisk(dealId: string): Promise<DealRiskResult> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  // Fetch deal with company and stage info
  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("*, stages(name, pipeline_id), companies(name, domain)")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .single();

  if (dealErr || !deal) {
    throw new Error("Deal not found");
  }

  // Fetch recent activities for this deal
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch open tasks for this deal
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("related_type", "deal")
    .eq("related_id", dealId)
    .neq("status", "Completed");

  // Fetch quotes for this deal
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, status, total, created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(5);

  const context = {
    deal,
    recentActivities: activities || [],
    openTasks: tasks || [],
    quotes: quotes || [],
  };

  const { systemPrompt, userPrompt } = buildDealRiskPrompt(context);

  return generateStructuredOutput(
    { systemPrompt, userPrompt },
    (parsed) => DealRiskSchema.parse(parsed)
  );
}

/**
 * Analyze risk for multiple deals in batch.
 */
export async function analyzeDealsRiskBatch(dealIds: string[]): Promise<
  Array<{
    dealId: string;
    healthScore: number;
    status: "healthy" | "needs_attention" | "at_risk" | "critical";
    risks: string[];
    opportunities: string[];
    nextBestAction: string;
    confidence: number;
  }>
> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  const { data: deals, error } = await supabase
    .from("deals")
    .select("*, stages(name), companies(name)")
    .in("id", dealIds)
    .eq("organization_id", orgId);

  if (error || !deals) {
    throw new Error("Failed to fetch deals");
  }

  const results = await Promise.all(
    deals.map(async (deal) => {
      try {
        const { systemPrompt, userPrompt } = buildDealRiskPrompt(deal as Record<string, unknown>);
        const result = await generateStructuredOutput(
          { systemPrompt, userPrompt },
          (parsed) => DealRiskSchema.parse(parsed)
        );
        return {
          dealId: deal.id,
          healthScore: result.healthScore,
          status: result.status,
          risks: result.risks,
          opportunities: result.opportunities,
          nextBestAction: result.nextBestAction,
          confidence: result.confidence,
        };
      } catch (error) {
        console.error(`Deal risk analysis failed for ${deal.id}:`, error);
        return {
          dealId: deal.id,
          healthScore: 50,
          status: "needs_attention" as const,
          risks: ["Analysis failed"],
          opportunities: [],
          nextBestAction: "Review manually",
          confidence: 0,
        };
      }
    })
  );

  return results;
}