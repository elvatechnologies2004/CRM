/**
 * Lead scoring assistance using AI.
 * Server-only. Validates AI output before returning.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import { generateStructuredOutput } from "@/lib/ai/provider";
import { buildLeadScoringPrompt } from "@/lib/ai/prompts";
import { LeadScoreSchema } from "@/lib/ai/schemas";
import type { LeadScoreResult } from "@/lib/ai/schemas";

/**
 * Score a lead using AI analysis.
 * Fetches the lead from the database and runs AI analysis on it.
 */
export async function scoreLead(leadId: string): Promise<LeadScoreResult> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("organization_id", orgId)
    .single();

  if (error || !lead) {
    throw new Error("Lead not found");
  }

  const { systemPrompt, userPrompt } = buildLeadScoringPrompt(lead as Record<string, unknown>);

  return generateStructuredOutput(
    { systemPrompt, userPrompt },
    (parsed) => LeadScoreSchema.parse(parsed)
  );
}

/**
 * Score multiple leads in batch.
 * Returns array of { leadId, score, temperature, confidence, reasons, nextBestAction }.
 */
export async function scoreLeadsBatch(leadIds: string[]): Promise<
  Array<{
    leadId: string;
    score: number;
    temperature: "cold" | "warm" | "hot";
    confidence: number;
    reasons: string[];
    nextBestAction: string;
  }>
> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .in("id", leadIds)
    .eq("organization_id", orgId);

  if (error || !leads) {
    throw new Error("Failed to fetch leads");
  }

  const results = await Promise.all(
    leads.map(async (lead) => {
      try {
        const { systemPrompt, userPrompt } = buildLeadScoringPrompt(lead as Record<string, unknown>);
        const result = await generateStructuredOutput(
          { systemPrompt, userPrompt },
          (parsed) => LeadScoreSchema.parse(parsed)
        );
        return {
          leadId: lead.id,
          score: result.score,
          temperature: result.temperature,
          confidence: result.confidence,
          reasons: result.reasons,
          nextBestAction: result.nextBestAction,
        };
      } catch (error) {
        console.error(`Lead scoring failed for ${lead.id}:`, error);
        return {
          leadId: lead.id,
          score: 0,
          temperature: "cold" as const,
          confidence: 0,
          reasons: ["Scoring failed"],
          nextBestAction: "Review manually",
        };
      }
    })
  );

  return results;
}