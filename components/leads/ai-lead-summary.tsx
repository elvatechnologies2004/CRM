"use client";

import { Bot, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getScoreLevel, type ScoreLevel } from "@/components/leads/lead-score-badge";
import type { LeadRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QualityChip {
  label: string;
  value: string;
  tone: "good" | "medium" | "low";
}

function buildChips(lead: LeadRecord): QualityChip[] {
  const level = getScoreLevel(lead.score) as ScoreLevel;
  const scoreGood = level === "hot";
  const scoreMedium = level === "warm";

  const intentValue =
    lead.qualification.need === "Strong" ? "High" : lead.qualification.need === "Moderate" ? "Medium" : "Low";
  const intentTone = lead.qualification.need === "Strong" ? "good" : lead.qualification.need === "Moderate" ? "medium" : "low";

  const budgetTone = lead.qualification.budget === "Confirmed" ? "good" : lead.qualification.budget === "Estimated" ? "medium" : "low";

  const timelineTone = lead.qualification.timeline === "< 1 Month" || lead.qualification.timeline === "1–2 Months" ? "good" : lead.qualification.timeline === "This Quarter" ? "medium" : "low";

  const decisionTone = lead.qualification.authority === "Likely Decision Maker" ? "good" : lead.qualification.authority === "Influencer" ? "medium" : "low";

  return [
    { label: "Buying intent", value: intentValue, tone: intentTone },
    { label: "Budget fit", value: lead.qualification.budget, tone: budgetTone },
    { label: "Decision maker", value: lead.qualification.authority === "Likely Decision Maker" ? "Likely" : lead.qualification.authority, tone: decisionTone },
    { label: "Timeline", value: lead.qualification.timeline, tone: timelineTone },
    { label: "Score", value: scoreGood ? "Hot" : scoreMedium ? "Warm" : "Cold", tone: scoreGood ? "good" : scoreMedium ? "medium" : "low" },
    { label: "Engagement", value: scoreGood ? "High" : scoreMedium ? "Medium" : "Low", tone: scoreGood ? "good" : scoreMedium ? "medium" : "low" },
  ];
}

function summaryText(lead: LeadRecord): string {
  if (lead.qualification.need === "Strong" && lead.score >= 80) {
    return `${lead.firstName} has a clear, budget-backed need for ${lead.interest.toLowerCase() || "your product"} and is actively evaluating vendors. Engagement is strong and the timeline is near-term, making this a high-priority opportunity.`;
  }
  if (lead.status === "New") {
    return `${lead.firstName} was recently added from ${lead.source} and has not been contacted yet. Early qualification is recommended to confirm budget and decision-making authority before investing more time.`;
  }
  if (lead.status === "Proposal") {
    return `${lead.firstName} is reviewing your proposal. Maintain momentum with a scheduled follow-up and be ready to negotiate scope or pricing to move toward a close.`;
  }
  return `${lead.firstName} at ${lead.companyName} is engaged in the sales cycle. Continue nurturing with relevant content and keep the next follow-up scheduled to avoid the lead going cold.`;
}

const toneStyles = {
  good: "border-success/30 bg-success/10 text-[#15803d]",
  medium: "border-warning/30 bg-warning/10 text-[#b45309]",
  low: "border-muted bg-muted/60 text-muted-foreground",
} as const;

const toneDot = {
  good: "bg-success",
  medium: "bg-warning",
  low: "bg-slate-400",
} as const;

interface AILeadSummaryProps {
  lead: LeadRecord;
}

function AILeadSummary({ lead }: AILeadSummaryProps) {
  const chips = buildChips(lead);

  return (
    <Card className="overflow-hidden shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-brand-purple to-brand-cyan" aria-hidden />
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-ink">AI Lead Summary</span>
        </span>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" aria-hidden />
          Generated just now
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {summaryText(lead)}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
                toneStyles[chip.tone]
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[chip.tone])} aria-hidden />
              <span className="truncate font-medium">{chip.value}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { AILeadSummary };