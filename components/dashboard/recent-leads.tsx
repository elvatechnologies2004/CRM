"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Globe,
  Link as LinkIcon,
  MessageCircle,
  Trash2,
  UserPlus,
} from "lucide-react";

import { deleteLeadAction } from "@/app/leads/actions";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lead, LeadScoreLevel, LeadSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const sourceIcons: Record<LeadSource, React.ReactNode> = {
  Website: <Globe className="h-3.5 w-3.5" aria-hidden />,
  LinkedIn: <LinkIcon className="h-3.5 w-3.5" aria-hidden />,
  Referral: <UserPlus className="h-3.5 w-3.5" aria-hidden />,
  WhatsApp: <MessageCircle className="h-3.5 w-3.5" aria-hidden />,
  Email: <Globe className="h-3.5 w-3.5" aria-hidden />,
  "Cold Call": <MessageCircle className="h-3.5 w-3.5" aria-hidden />,
};

function getScoreLevel(score: number): LeadScoreLevel {
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  return "low";
}

const scoreBadgeStyles: Record<LeadScoreLevel, string> = {
  high: "bg-success/10 text-[#15803d]",
  medium: "bg-warning/10 text-[#b45309]",
  low: "bg-danger/10 text-[#b91c1c]",
};

interface RecentLeadsProps {
  leads: Lead[];
  leadHrefs?: Record<string, string>;
}

function RecentLeads({ leads, leadHrefs }: RecentLeadsProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleLeads, setVisibleLeads] = useState<Lead[]>(leads);

  const openLead = (lead: Lead) => {
    router.push(leadHrefs?.[lead.name.toLowerCase()] ?? "/leads");
  };

  const handleDelete = async (lead: Lead) => {
    const confirmed = window.confirm(`Delete ${lead.name} from recent leads?`);
    if (!confirmed) return;

    setVisibleLeads((current) => current.filter((item) => item.id !== lead.id));
    setDeletingId(lead.id);

    const result = await deleteLeadAction(lead.id);
    setDeletingId(null);

    if (!result.ok) {
      setVisibleLeads(leads);
      window.alert(result.error ?? "Failed to delete lead");
      return;
    }

    router.refresh();
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Leads</CardTitle>
        <Link
          href="/leads"
          className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          View all
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="scrollbar-thin -mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-3 py-2.5 font-semibold">Name</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Company</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Source</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Score</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((lead) => {
                const level = getScoreLevel(lead.score);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className="group cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/50"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openLead(lead);
                      }
                    }}
                    aria-label={`Open lead ${lead.name}`}
                  >
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2.5">
                        <InitialsAvatar
                          name={lead.name}
                          className="h-8 w-8 transition-transform group-hover:scale-105"
                        />
                        <span className="text-[13px] font-medium text-ink">
                          {lead.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-muted-foreground">
                      {lead.company}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <span className="text-muted-foreground/70">
                          {sourceIcons[lead.source]}
                        </span>
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        className={cn(
                          "border-transparent",
                          scoreBadgeStyles[level]
                        )}
                      >
                        {lead.score}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] text-muted-foreground">
                      <div className="flex items-center justify-end gap-2">
                        <span>{lead.time}</span>
                        {!lead.convertedDealId && (
                          <button
                            type="button"
                            aria-label={`Delete ${lead.name}`}
                            disabled={deletingId === lead.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDelete(lead);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export { RecentLeads };