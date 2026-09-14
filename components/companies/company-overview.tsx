"use client";

import {
  ArrowRight,
  Building2,
  FileText,
  Handshake,
  Headset,
  Layers,
  Mail,
  Phone,
  Sparkles,
  StickyNote,
  UserPlus,
  Video,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline, type ActivityIconMeta } from "@/components/crm/activity-timeline";
import { CompanyStatusBadge } from "@/components/crm/status-badges";
import { formatCurrency } from "@/lib/crm-meta";
import { lastActivityLabel } from "@/lib/mock-leads";
import type {
  AccountHealth,
  CompanyActivity,
  CompanyProject,
  CompanyRecord,
  CrmDeal,
  SupportTicket,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const companyActivityIcons: Record<string, ActivityIconMeta> = {
  created: { icon: Building2, tint: "bg-brand-blue/10 text-brand-blue" },
  contact: { icon: UserPlus, tint: "bg-emerald-500/10 text-emerald-600" },
  email: { icon: Mail, tint: "bg-brand-purple/10 text-brand-purple" },
  call: { icon: Phone, tint: "bg-warning/10 text-[#b45309]" },
  meeting: { icon: Video, tint: "bg-sky-500/10 text-sky-700" },
  note: { icon: StickyNote, tint: "bg-muted text-muted-foreground" },
  deal: { icon: Handshake, tint: "bg-brand-purple/10 text-brand-purple" },
  invoice: { icon: FileText, tint: "bg-amber-500/10 text-amber-600" },
  payment: { icon: Wallet, tint: "bg-success/10 text-[#15803d]" },
  support: { icon: Headset, tint: "bg-warning/10 text-[#b45309]" },
};

interface CompanyOverviewProps {
  company: CompanyRecord;
  deals: CrmDeal[];
  projects: CompanyProject[];
  tickets: SupportTicket[];
  health: AccountHealth | null | undefined;
  activities: CompanyActivity[];
  onViewAllActivity: () => void;
  onAddDeal: () => void;
  onAddContact: () => void;
}

function healthToneClass(tone: AccountHealth["factors"][number]["tone"]) {
  switch (tone) {
    case "good":
      return "text-[#15803d]";
    case "medium":
      return "text-[#b45309]";
    case "low":
      return "text-danger";
    default:
      return "text-muted-foreground";
  }
}

function CompanyOverview({
  company,
  deals,
  projects,
  tickets,
  health,
  activities,
  onViewAllActivity,
  onAddDeal,
  onAddContact,
}: CompanyOverviewProps) {
  const openDeals = deals.filter((deal) => deal.status === "Open");
  const openPipeline = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = deals.filter((deal) => deal.status === "Won");
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const activeProjects = projects.filter((project) => project.status === "Active");
  const openTickets = tickets.filter((ticket) => ticket.status === "Open" || ticket.status === "In Progress");

  const sparkline = deals
    .filter((deal) => deal.status === "Open" || deal.status === "Won")
    .slice(0, 5)
    .sort((a, b) => +new Date(a.expectedClose) - +new Date(b.expectedClose));

  const bars = sparkline.map((deal) =>
    Math.max(18, Math.min(100, Math.round((deal.value / Math.max(openPipeline, wonValue, 1)) * 100)))
  );

  const aiSummary = `${company.name} is a ${company.companySize.toLowerCase()}-employee ${company.industry.toLowerCase()} organization in ${company.city}, current status is ${company.accountStatus.toLowerCase()}. ${openPipeline > 0 ? `You have ${openDeals.length} open ${openDeals.length === 1 ? "deal" : "deals"} worth ${formatCurrency(openPipeline)} with a strong probability pipeline.` : "There are no open deals at the moment."} ${activeProjects.length > 0 ? `${activeProjects.length} active ${activeProjects.length === 1 ? "project" : "projects"} are in motion.` : "No active projects right now."} ${
    openTickets.length > 0
      ? `${openTickets.length} support ${openTickets.length === 1 ? "request is" : "requests are"} pending attention.`
      : "Support requests are all resolved."
  } Next best step: ${openDeals.length > 0 ? "advance the largest open deal in negotiation." : "reach out to re-engage the account and surface a new opportunity."}`;

  const bestActionLabel = openDeals.length > 0 ? "Review open deals" : "Re-engage account";
  const bestActionDetail =
    openDeals.length > 0
      ? `Follow up on ${openDeals.length} open ${openDeals.length === 1 ? "opportunity" : "opportunities"} worth ${formatCurrency(openPipeline)}.`
      : `Book a touchpoint with ${company.name} to renew interest and uncover new needs.`;

  const metrics: { label: string; value: string; icon: typeof Building2; iconClass: string }[] = [
    {
      label: "Open Pipeline",
      value: formatCurrency(openPipeline),
      icon: Layers,
      iconClass: "bg-brand-purple/10 text-[#6d28d9]",
    },
    {
      label: "Won Revenue",
      value: formatCurrency(wonValue),
      icon: Handshake,
      iconClass: "bg-success/10 text-[#15803d]",
    },
    {
      label: "Active Projects",
      value: String(activeProjects.length),
      icon: Building2,
      iconClass: "bg-brand-blue/10 text-brand-blue",
    },
    {
      label: "Open Tickets",
      value: String(openTickets.length),
      icon: Headset,
      iconClass: openTickets.length > 0 ? "bg-warning/10 text-[#b45309]" : "bg-success/10 text-[#15803d]",
    },
  ];

  const healthScore = health?.score ?? 0;
  const healthRingClass =
    healthScore >= 70 ? "text-[#15803d]" : healthScore >= 50 ? "text-warning" : "text-danger";

  return (
    <div className="space-y-4">
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            AI Account Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{aiSummary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="flex items-center gap-3 p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", metric.iconClass)}>
                <MetricIcon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{metric.label}</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-ink">
                  {metric.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Next Best Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">{bestActionLabel}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{bestActionDetail}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={onAddDeal}>
                <Handshake className="h-4 w-4" aria-hidden />
                New Deal
              </Button>
              <Button variant="outline" size="sm" onClick={onAddContact}>
                <UserPlus className="h-4 w-4" aria-hidden />
                Add Contact
              </Button>
            </div>
          </CardContent>
        </Card>

        {health && (
          <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                Account Health
                <CompanyStatusBadge
                  status={health.status === "Healthy" ? "Customer" : "Churned"}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" className="stroke-border" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className={cn("transition-all", healthRingClass)}
                    strokeDasharray={`${healthScore * 1.68} 100`}
                  />
                </svg>
                <span className="absolute text-lg font-bold tabular-nums text-ink">
                  {healthScore}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {health.status} · last activity {lastActivityLabel(company.lastActivityAt)}
                </p>
                {health.factors.map((factor) => (
                  <div
                    key={factor.label}
                    className="flex items-center justify-between gap-2 text-[13px]"
                  >
                    <span className="text-muted-foreground">{factor.label}</span>
                    <span className={cn("font-medium", healthToneClass(factor.tone))}>
                      {factor.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {bars.length > 0 && (
        <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pipeline Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end justify-between gap-2">
              {sparkline.map((deal, index) => (
                <div key={deal.id} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
                  <div
                    className="w-full rounded-md bg-primary/80 transition-colors group-hover:bg-primary"
                    style={{ height: `${bars[index]}%` }}
                  />
                  <span className="max-w-full truncate text-[10px] text-muted-foreground">
                    {deal.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAllActivity}>
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            activities={activities.slice(0, 4)}
            iconMap={companyActivityIcons}
          />
          {activities.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity recorded for this account yet.
            </p>
          )}
        </CardContent>
      </Card>

      {company.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {company.tags.length} {company.tags.length === 1 ? "tag" : "tags"}
          </Badge>
          {company.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export { CompanyOverview };