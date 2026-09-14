"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AILeadSummary } from "@/components/leads/ai-lead-summary";
import { NextBestAction } from "@/components/leads/next-best-action";
import { LeadActivityTimeline } from "@/components/leads/lead-activity-timeline";
import type { LeadActivity, LeadRecord } from "@/lib/types";

interface LeadOverviewProps {
  lead: LeadRecord;
  activities: LeadActivity[];
  onScheduleCall: () => void;
  onDraftEmail: () => void;
}

function LeadOverview({ lead, activities, onScheduleCall, onDraftEmail }: LeadOverviewProps) {
  return (
    <div className="space-y-4">
      <AILeadSummary lead={lead} />
      <NextBestAction lead={lead} onScheduleCall={onScheduleCall} onDraftEmail={onDraftEmail} />
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadActivityTimeline activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}

export { LeadOverview };