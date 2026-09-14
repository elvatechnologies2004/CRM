"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import type { DealContact, DealRecord } from "@/lib/types";

const appReceivedAt = Date.now();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface DealNextBestActionProps {
  deal: DealRecord;
}

function DealNextBestAction({ deal }: DealNextBestActionProps) {
  const buyingIntent =
    Number(deal.probability) >= 75
      ? "High"
      : Number(deal.probability) >= 50
        ? "Medium"
        : "Low";

  const engagement =
    deal.lastActivityAt
      ? appReceivedAt - new Date(deal.lastActivityAt).getTime() < SEVEN_DAYS_MS
        ? "High"
        : "Medium"
      : "Low";

  const decisionMaker =
    deal.contacts?.some((c: DealContact) => c.role === "Decision Maker" || c.role === "Champion")
      ? "Engaged"
      : "Not Identified";

  const budgetFit =
    deal.value > 10000 ? "Strong" : deal.value > 5000 ? "Moderate" : "Weak";

  const competitorRisk =
    deal.lostReason === "Competitor" ? "Low" : "Medium";

  const dealRisk =
    deal.healthStatus === "Healthy" ? "Low" : "Medium";

  const predictedWin = Math.round(deal.probability * 1.1);

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
          Recommended Next Action
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p className="text-sm font-semibold text-ink">
            {deal.probability >= 70
              ? "Schedule a pricing and implementation discussion with the primary contact within the next 24 hours."
              : "Re-engage the account and surface a new opportunity."}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {deal.probability >= 70
              ? "The customer has viewed the proposal twice and asked about implementation timing, but no follow-up meeting has been scheduled."
              : "No recent activity detected; schedule a touchpoint to renew interest."}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <Badge variant="default" className="text-xs">
              Buying Intent: {buyingIntent}
            </Badge>
            <Badge variant="default" className="text-xs">
              Engagement: {engagement}
            </Badge>
          </div>
          <div>
            <Badge variant="default" className="text-xs">
              Decision Maker: {decisionMaker}
            </Badge>
            <Badge variant="default" className="text-xs">
              Budget Fit: {budgetFit}
            </Badge>
          </div>
          <div>
            <Badge variant="default" className="text-xs">
              Competitor Risk: {competitorRisk}
            </Badge>
            <Badge variant="default" className="text-xs">
              Deal Risk: {dealRisk}
            </Badge>
          </div>
          <div>
            <Badge variant="default" className="text-xs">
              Predicted Win Probability: {predictedWin}%
            </Badge>
            <Badge variant="default" className="text-xs">
              Expected Close: {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "TBD"}
            </Badge>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="default">Schedule Meeting</Button>
          <Button size="sm" variant="outline">Draft Follow-up</Button>
          <Button size="sm" variant="ghost">Create Task</Button>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-muted-foreground">
            Why this recommendation?
          </summary>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {deal.probability >= 70
              ? "The customer has viewed the proposal twice and asked about implementation timing, but no follow-up meeting has been scheduled."
              : "No recent activity detected; schedule a touchpoint to renew interest."}
          </p>
        </details>
      </CardContent>
    </Card>
  );
}

export { DealNextBestAction };