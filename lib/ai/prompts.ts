/**
 * AI prompt templates for CRM analysis.
 * Each prompt defines the system and user prompt for a specific AI task.
 */

import type {
  Lead,
  Deal,
  Company,
  Contact,
  Task,
  CrmTask,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Lead Scoring
// ---------------------------------------------------------------------------

export function buildLeadScoringPrompt(lead: Record<string, unknown>): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are a sales intelligence analyst. Given a lead record, produce a JSON score with these fields:
- score: number 0-100 (higher = hotter)
- temperature: "cold" | "warm" | "hot"
- confidence: number 0-100
- reasons: string[] (2-4 short reasons explaining the score)
- nextBestAction: string (one concrete action)

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Lead record:\n${JSON.stringify(lead, null, 2)}`,
  };
}

// ---------------------------------------------------------------------------
// Deal Risk Analysis
// ---------------------------------------------------------------------------

export function buildDealRiskPrompt(deal: Record<string, unknown>): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are a sales intelligence analyst. Given a deal record with CRM context, produce a JSON risk assessment with these fields:
- healthScore: number 0-100
- status: "healthy" | "needs_attention" | "at_risk" | "critical"
- risks: string[] (1-4 short risk factors)
- opportunities: string[] (1-4 positive factors)
- nextBestAction: string (one concrete action)
- confidence: number 0-100

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Deal record:\n${JSON.stringify(deal, null, 2)}`,
  };
}

// ---------------------------------------------------------------------------
// Customer / Company Summary
// ---------------------------------------------------------------------------

export function buildCompanySummaryPrompt(
  company: Record<string, unknown>,
  context: {
    contacts?: Record<string, unknown>[];
    deals?: Record<string, unknown>[];
    activities?: Record<string, unknown>[];
    tasks?: Record<string, unknown>[];
  }
): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are a customer success analyst. Given a company record and related CRM data, produce a concise JSON summary with these fields:
- summary: string (2-3 sentences)
- keyRelationships: string[] (key people and their roles)
- openIssues: string[]
- opportunities: string[]
- riskFactors: string[]

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Company:\n${JSON.stringify(company, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`,
  };
}

// ---------------------------------------------------------------------------
// Meeting Summary
// ---------------------------------------------------------------------------

export function buildMeetingSummaryPrompt(
  meeting: Record<string, unknown>,
  notes: string
): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are an assistant. Given a meeting record and notes, produce a JSON summary with these fields:
- summary: string (2-3 sentences)
- keyDecisions: string[]
- actionItems: string[] (each with owner and due date if mentioned)
- followUps: string[]

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Meeting:\n${JSON.stringify(meeting, null, 2)}\n\nNotes:\n${notes}`,
  };
}

// ---------------------------------------------------------------------------
// Email Draft
// ---------------------------------------------------------------------------

export function buildEmailDraftPrompt(params: {
  recipient: string;
  purpose: string;
  context: Record<string, unknown>;
  tone?: string;
}): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are a professional email writer for a sales team. Draft an email based on the user's request. Return JSON with:
- subject: string
- body: string (plain text, professional)
- salutation: string
- closing: string

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Recipient: ${params.recipient}\nPurpose: ${params.purpose}\nTone: ${params.tone || "professional"}\nContext: ${JSON.stringify(params.context, null, 2)}`,
  };
}

// ---------------------------------------------------------------------------
// WhatsApp Draft
// ---------------------------------------------------------------------------

export function buildWhatsAppDraftPrompt(params: {
  recipient: string;
  purpose: string;
  context: Record<string, unknown>;
}): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are a WhatsApp message writer. Draft a concise message based on the user's request. Return JSON with:
- message: string (concise, friendly, 2-4 sentences max)

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Recipient: ${params.recipient}\nPurpose: ${params.purpose}\nContext: ${JSON.stringify(params.context, null, 2)}`,
  };
}

// ---------------------------------------------------------------------------
// Forecast Insights
// ---------------------------------------------------------------------------

export function buildForecastInsightPrompt(
  forecast: Record<string, unknown>,
  deals: Record<string, unknown>[]
): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are a sales forecasting analyst. Given forecast metrics and deal data, produce a JSON insight with these fields:
- summary: string (2-3 sentences)
- confidence: number 0-100
- keyDrivers: string[]
- risks: string[]
- recommendations: string[]

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Forecast:\n${JSON.stringify(forecast, null, 2)}\n\nDeals:\n${JSON.stringify(deals, null, 2)}`,
  };
}

// ---------------------------------------------------------------------------
// Next Best Action
// ---------------------------------------------------------------------------

export function buildNextBestActionPrompt(params: {
  recordType: string;
  record: Record<string, unknown>;
  context: Record<string, unknown>;
}): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: `You are a sales assistant. Given a CRM record and context, produce a JSON recommendation with these fields:
- action: string (one concrete next step)
- priority: "low" | "medium" | "high"
- reason: string (why this action)
- timeframe: string (when to act)

Output ONLY the JSON object. No markdown, no explanation.`,
    userPrompt: `Record type: ${params.recordType}\nRecord: ${JSON.stringify(params.record, null, 2)}\nContext: ${JSON.stringify(params.context, null, 2)}`,
  };
}