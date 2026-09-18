"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { DealRecord } from "@/lib/types";

interface AIDealSummaryProps {
  deal: DealRecord;
}

function AIDealSummary({ deal }: AIDealSummaryProps) {
  const summaryText =
    deal.stageName === "New Opportunity" || deal.stageName === "New"
      ? `${deal.name} is a newly created opportunity. The next priority is to validate fit, confirm decision-maker access, and schedule a discovery meeting to move the deal forward.`
      : `${deal.name} is actively evaluating a proposal. The main decision maker has engaged with the proposal and requested clarification about implementation timeline and WhatsApp integration. The opportunity currently has a strong likelihood of closing this month.`;

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          AI Deal Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {summaryText}
        </p>
      </CardContent>
    </Card>
  );
}

export { AIDealSummary };