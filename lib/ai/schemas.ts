/**
 * Zod schemas for AI output validation.
 * Validates raw AI model output before saving to the database.
 * Never trust raw model output.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Lead Scoring
// ---------------------------------------------------------------------------

export const LeadScoreSchema = z.object({
  score: z.number().min(0).max(100),
  temperature: z.enum(["cold", "warm", "hot"]),
  confidence: z.number().min(0).max(100),
  reasons: z.array(z.string()).min(1).max(5),
  nextBestAction: z.string().min(1),
});

export type LeadScoreResult = z.infer<typeof LeadScoreSchema>;

// ---------------------------------------------------------------------------
// Deal Risk
// ---------------------------------------------------------------------------

export const DealRiskSchema = z.object({
  healthScore: z.number().min(0).max(100),
  status: z.enum(["healthy", "needs_attention", "at_risk", "critical"]),
  risks: z.array(z.string()).min(0).max(5),
  opportunities: z.array(z.string()).min(0).max(5),
  nextBestAction: z.string().min(1),
  confidence: z.number().min(0).max(100),
});

export type DealRiskResult = z.infer<typeof DealRiskSchema>;

// ---------------------------------------------------------------------------
// Company Summary
// ---------------------------------------------------------------------------

export const CompanySummarySchema = z.object({
  summary: z.string().min(1),
  keyRelationships: z.array(z.string()).min(0).max(5),
  openIssues: z.array(z.string()).min(0).max(5),
  opportunities: z.array(z.string()).min(0).max(5),
  riskFactors: z.array(z.string()).min(0).max(5),
});

export type CompanySummaryResult = z.infer<typeof CompanySummarySchema>;

// ---------------------------------------------------------------------------
// Meeting Summary
// ---------------------------------------------------------------------------

export const MeetingSummarySchema = z.object({
  summary: z.string().min(1),
  keyDecisions: z.array(z.string()).min(0).max(5),
  actionItems: z.array(z.string()).min(0).max(5),
  followUps: z.array(z.string()).min(0).max(5),
});

export type MeetingSummaryResult = z.infer<typeof MeetingSummarySchema>;

// ---------------------------------------------------------------------------
// Email Draft
// ---------------------------------------------------------------------------

export const EmailDraftSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  salutation: z.string().min(1),
  closing: z.string().min(1),
});

export type EmailDraftResult = z.infer<typeof EmailDraftSchema>;

// ---------------------------------------------------------------------------
// WhatsApp Draft
// ---------------------------------------------------------------------------

export const WhatsAppDraftSchema = z.object({
  message: z.string().min(1).max(500),
});

export type WhatsAppDraftResult = z.infer<typeof WhatsAppDraftSchema>;

// ---------------------------------------------------------------------------
// Forecast Insight
// ---------------------------------------------------------------------------

export const ForecastInsightSchema = z.object({
  summary: z.string().min(1),
  confidence: z.number().min(0).max(100),
  keyDrivers: z.array(z.string()).min(0).max(5),
  risks: z.array(z.string()).min(0).max(5),
  recommendations: z.array(z.string()).min(0).max(5),
});

export type ForecastInsightResult = z.infer<typeof ForecastInsightSchema>;

// ---------------------------------------------------------------------------
// Next Best Action
// ---------------------------------------------------------------------------

export const NextBestActionSchema = z.object({
  action: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  reason: z.string().min(1),
  timeframe: z.string().min(1),
});

export type NextBestActionResult = z.infer<typeof NextBestActionSchema>;

// ---------------------------------------------------------------------------
// AI Approval Request
// ---------------------------------------------------------------------------

export const AIApprovalRequestSchema = z.object({
  actionType: z.string().min(1),
  recordType: z.string().min(1),
  recordId: z.string().min(1),
  proposedPayload: z.record(z.string(), z.unknown()),
  reasonSummary: z.string().min(1),
  riskLevel: z.enum(["Low", "Medium", "High"]),
});

export type AIApprovalRequest = z.infer<typeof AIApprovalRequestSchema>;