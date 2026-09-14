"use client";

import { useState } from "react";
import { ChevronDown, Handshake, Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LeadRecord, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const recommendations: Record<LeadStatus, { title: string; reason: string; bullets: string[] }> = {
  New: {
    title: "Send a personalized intro email today",
    reason:
      "This lead was recently captured and the odds of a reply are highest within the first 48 hours.",
    bullets: [
      "Reference the source and their specific interest.",
      "Include one relevant customer story.",
      "Propose a concrete 20-minute call with a time option.",
    ],
  },
  Contacted: {
    title: "Book a discovery call",
    reason:
      "They have engaged with your outreach but a conversation is needed to confirm budget and authority.",
    bullets: [
      "Prepare 2–3 discovery questions around their stated interest.",
      "Confirm who else is involved in the decision.",
      "Add a follow-up task scheduled within 2 days.",
    ],
  },
  Qualified: {
    title: "Prepare and send a tailored proposal",
    reason:
      "BANT is largely confirmed with strong need and a near-term timeline — the next step is a concrete proposal.",
    bullets: [
      "Include the agreed scope and a reference customer.",
      "Give two plan options to anchor value.",
      "Set a review date for the proposal walkthrough.",
    ],
  },
  Proposal: {
    title: "Schedule the proposal follow-up",
    reason:
      "Proposals without a scheduled follow-up lose momentum and stall in review.",
    bullets: [
      "Book a walkthrough within 5 days.",
      "Prepare answers for scope and pricing objections.",
      "Ask for the decision date to protect the timeline.",
    ],
  },
  Unqualified: {
    title: "Run a re-engagement sequence",
    reason:
      "This lead did not meet current criteria, but a low-touch nurture can revive them later.",
    bullets: [
      "Add them to a monthly nurture list.",
      "Share one case study relevant to their industry.",
      "Check back in 90 days.",
    ],
  },
};

interface NextBestActionProps {
  lead: LeadRecord;
  onScheduleCall: () => void;
  onDraftEmail: () => void;
}

function NextBestAction({ lead, onScheduleCall, onDraftEmail }: NextBestActionProps) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const rec = recommendations[lead.status] ?? recommendations.New;

  const handleGenerate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 900);
  };

  return (
    <Card className="border-brand-blue/30 bg-brand-blue/[0.04] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
            <Handshake className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-ink">Recommended Next Action</span>
        </span>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleGenerate}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Regenerate
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {generating ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-brand-blue" aria-hidden />
            Analyzing {lead.firstName}&apos;s activity…
          </div>
        ) : generated ? (
          <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-[#15803d]">
            Next action saved — a follow-up task was queued for {lead.firstName} on{" "}
            {lead.firstName}&apos;s tasks tab.
          </div>
        ) : (
          <>
            <div>
              <p className="text-[15px] font-semibold text-ink">{rec.title}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{rec.reason}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onScheduleCall}>
                Schedule Call
              </Button>
              <Button variant="outline" size="sm" onClick={onDraftEmail}>
                <Send className="h-3.5 w-3.5" aria-hidden />
                Draft Email
              </Button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Why this recommendation?
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                  aria-hidden
                />
              </button>
              {expanded && (
                <ul className="mt-2 space-y-1.5">
                  {rec.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { NextBestAction };