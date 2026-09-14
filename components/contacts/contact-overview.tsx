"use client";

import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Handshake,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  StickyNote,
  Video,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline, type ActivityIconMeta } from "@/components/crm/activity-timeline";
import { contactFullName } from "@/components/contacts/contacts-table";
import { formatCurrency } from "@/lib/crm-meta";
import { getContactActivities, getContactDeals, getContactInvoices } from "@/lib/mock-contacts";
import { lastActivityLabel, nextFollowUpLabel } from "@/lib/mock-leads";
import type { ContactRecord } from "@/lib/types";

export const contactActivityIcons: Record<string, ActivityIconMeta> = {
  created: { icon: Sparkles, tint: "bg-brand-blue/10 text-brand-blue" },
  email: { icon: Mail, tint: "bg-brand-purple/10 text-brand-purple" },
  whatsapp: { icon: MessageCircle, tint: "bg-emerald-500/10 text-emerald-600" },
  call: { icon: Phone, tint: "bg-warning/10 text-[#b45309]" },
  meeting: { icon: Video, tint: "bg-sky-500/10 text-sky-700" },
  task: { icon: CheckCircle2, tint: "bg-success/10 text-[#15803d]" },
  note: { icon: StickyNote, tint: "bg-muted text-muted-foreground" },
  "deal-created": { icon: Handshake, tint: "bg-brand-purple/10 text-brand-purple" },
  "deal-stage-change": { icon: Handshake, tint: "bg-warning/10 text-[#b45309]" },
  proposal: { icon: Handshake, tint: "bg-brand-blue/10 text-brand-blue" },
  quote: { icon: Handshake, tint: "bg-brand-cyan/10 text-[#0e7490]" },
  invoice: { icon: Wallet, tint: "bg-amber-500/10 text-amber-600" },
  payment: { icon: CheckCircle2, tint: "bg-success/10 text-[#15803d]" },
  "support-ticket": { icon: LifeBuoy, tint: "bg-rose-500/10 text-rose-600" },
};

interface ContactOverviewProps {
  contact: ContactRecord;
  onScheduleCall: () => void;
  onDraftEmail: () => void;
  onViewAllActivity: () => void;
}

function ContactOverview({
  contact,
  onScheduleCall,
  onDraftEmail,
  onViewAllActivity,
}: ContactOverviewProps) {
  const activities = getContactActivities(contact.id);
  const deals = getContactDeals(contact.id);
  const invoices = getContactInvoices(contact.id);

  const openDeals = deals.filter((deal) => deal.status === "Open");
  const wonDeals = deals.filter((deal) => deal.status === "Won");
  const openPipeline = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const lifetimeValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const openInvoices = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const highlight = openDeals.length > 0 ? "open deals" : "renewal";
  const accent = openDeals.length > 0
    ? `${openDeals.length} open deal${openDeals.length === 1 ? "" : "s"} (${formatCurrency(openPipeline)})`
    : "no qualifying deals";

  return (
    <div className="space-y-4">
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            {contactFullName(contact)} is a{" "}
            <span className="font-medium text-ink">{contact.lifecycleStage}</span> at{" "}
            {contact.companyName} who communicates best over{" "}
            {contact.preferredChannel}. They have{" "}
            <span className="font-medium text-ink">{accent}</span> and a lifetime value
            of <span className="font-medium text-ink">{formatCurrency(lifetimeValue)}</span>.
            Last activity was {lastActivityLabel(contact.lastActivityAt).toLowerCase()}.
          </p>
          <p className="flex items-center gap-1.5">
            <Handshake className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            Focus on {highlight} this cycle.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
            Next Best Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-muted-foreground">
            {contact.nextActivityAt
              ? `Follow up scheduled ${nextFollowUpLabel(contact.nextActivityAt).toLowerCase()}.`
              : "No follow-up scheduled yet. Set a meeting or draft an email to keep momentum."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onScheduleCall}>
              <Video className="h-3.5 w-3.5" aria-hidden />
              Schedule a call
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onDraftEmail}>
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Draft email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Relationship Data</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Open pipeline" value={formatCurrency(openPipeline)} />
          <Metric label="Closed won" value={formatCurrency(lifetimeValue)} />
          <Metric label="Open invoices" value={formatCurrency(openInvoices)} />
          <Metric label="Deals" value={`${deals.length} total`} />
        </CardContent>
      </Card>

      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="text-sm">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onViewAllActivity}>
            View all
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            activities={activities}
            iconMap={contactActivityIcons}
            limit={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}

export { ContactOverview };