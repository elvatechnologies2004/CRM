/**
 * AI summaries for companies, meetings, and records.
 * Server-only. Validates AI output before returning.
 */

import "server-only";

import { generateStructuredOutput } from "@/lib/ai/provider";
import {
  buildCompanySummaryPrompt,
  buildMeetingSummaryPrompt,
} from "@/lib/ai/prompts";
import {
  CompanySummarySchema,
  MeetingSummarySchema,
} from "@/lib/ai/schemas";
import type {
  CompanySummaryResult,
  MeetingSummaryResult,
} from "@/lib/ai/schemas";

/**
 * Generate a company summary using AI.
 */
export async function summarizeCompany(
  company: Record<string, unknown>,
  context: {
    contacts?: Record<string, unknown>[];
    deals?: Record<string, unknown>[];
    activities?: Record<string, unknown>[];
    tasks?: Record<string, unknown>[];
  } = {}
): Promise<CompanySummaryResult> {
  const { systemPrompt, userPrompt } = buildCompanySummaryPrompt(company, context);

  return generateStructuredOutput(
    { systemPrompt, userPrompt },
    (parsed) => CompanySummarySchema.parse(parsed)
  );
}

/**
 * Generate a meeting summary using AI.
 */
export async function summarizeMeeting(
  meeting: Record<string, unknown>,
  notes: string
): Promise<MeetingSummaryResult> {
  const { systemPrompt, userPrompt } = buildMeetingSummaryPrompt(meeting, notes);

  return generateStructuredOutput(
    { systemPrompt, userPrompt },
    (parsed) => MeetingSummarySchema.parse(parsed)
  );
}

/**
 * Generate a generic record summary.
 * Returns a simple text summary.
 */
export async function summarizeRecord(
  recordType: string,
  record: Record<string, unknown>,
  context: Record<string, unknown> = {}
): Promise<string> {
  const systemPrompt = `You are a CRM assistant. Summarize the following ${recordType} record concisely in 2-3 sentences. Return ONLY the summary text, no JSON, no markdown.`;

  const userPrompt = `Record type: ${recordType}\nRecord: ${JSON.stringify(record, null, 2)}\nContext: ${JSON.stringify(context, null, 2)}`;

  const response = await generateStructuredOutput(
    { systemPrompt, userPrompt },
    (parsed) => {
      if (typeof parsed === "string") return parsed;
      if (typeof parsed === "object" && parsed !== null && "summary" in parsed) {
        return String((parsed as { summary?: unknown }).summary);
      }
      return JSON.stringify(parsed);
    }
  );

  return response;
}