import type { DataQualityMetric, DataIssue } from "@/lib/types";

export const dataQualityMetrics: DataQualityMetric[] = [
  { metric: "Contact Completeness", score: 95, totalContacts: 120, completeContacts: 114, issues: ["Missing phone numbers", "Incomplete company names"] },
  { metric: "Deal Stage Accuracy", score: 88, totalDeals: 35, completeDeals: 31, issues: ["Stage migration delays", "Missing close dates"] },
  { metric: "Pipeline Coverage", score: 92, totalPipelineValue: 2450000, coveredPipeline: 2275000, issues: [] },
  { metric: "Data Freshness", score: 90, lastUpdate: "2024-12-15", issues: ["Old activity logs", "Stale deal notes"] },
  { metric: "Duplicate Records", score: 93, totalRecords: 200, uniqueRecords: 185, issues: ["3 duplicate customer profiles", "2 overlapping deal records"] },
];

export const dataIssues: DataIssue[] = [
  { id: "dq_001", metric: "Contact Completeness", issue: "Missing phone numbers for 6 contacts", severity: "Medium", resolved: false },
  { id: "dq_002", metric: "Deal Stage Accuracy", issue: "3 deals stuck in 'Negotiation' stage", severity: "High", resolved: false },
  { id: "dq_003", metric: "Data Freshness", issue: "Activity logs older than 30 days", severity: "Low", resolved: true },
];