"use client";

import {
  Activity,
  ArrowLeftRight,
  CheckSquare,
  FileText,
  Mail,
  MailOpen,
  MessageCircle,
  Phone,
  Reply,
  StickyNote,
  UserPlus,
  Video,
  Zap,
} from "lucide-react";

import { toDayLabel, toShortTime } from "@/lib/mock-leads";
import type { LeadActivity, LeadActivityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const activityMeta: Record<LeadActivityType, { icon: typeof Mail; tint: string }> = {
  created: { icon: UserPlus, tint: "bg-brand-blue/10 text-brand-blue" },
  "email-sent": { icon: Mail, tint: "bg-brand-purple/10 text-brand-purple" },
  "email-opened": { icon: MailOpen, tint: "bg-brand-cyan/10 text-[#0e7490]" },
  "email-replied": { icon: Reply, tint: "bg-success/10 text-[#15803d]" },
  whatsapp: { icon: MessageCircle, tint: "bg-emerald-500/10 text-emerald-600" },
  call: { icon: Phone, tint: "bg-warning/10 text-[#b45309]" },
  meeting: { icon: Video, tint: "bg-sky-500/10 text-sky-700" },
  note: { icon: StickyNote, tint: "bg-muted text-muted-foreground" },
  "task-completed": { icon: CheckSquare, tint: "bg-success/10 text-[#15803d]" },
  "status-change": { icon: ArrowLeftRight, tint: "bg-brand-purple/10 text-brand-purple" },
  "score-change": { icon: Zap, tint: "bg-warning/10 text-[#b45309]" },
  proposal: { icon: FileText, tint: "bg-brand-blue/10 text-brand-blue" },
  quote: { icon: FileText, tint: "bg-brand-cyan/10 text-[#0e7490]" },
};

function groupByDay(activities: LeadActivity[]) {
  const groups: { label: string; items: LeadActivity[] }[] = [];
  for (const activity of activities) {
    const label = toDayLabel(activity.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(activity);
    else groups.push({ label, items: [activity] });
  }
  return groups;
}

interface LeadActivityTimelineProps {
  activities: LeadActivity[];
  limit?: number;
}

function LeadActivityTimeline({ activities, limit }: LeadActivityTimelineProps) {
  const visible = limit ? activities.slice(0, limit) : activities;
  const groups = groupByDay(visible);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
        <Activity className="h-4 w-4 text-muted-foreground/60" aria-hidden />
        <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-6">
      <span
        className="absolute bottom-2 left-[15px] top-2 w-px bg-border"
        aria-hidden
      />
      {groups.map((group) => (
        <li key={group.label}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <ul className="space-y-4">
            {group.items.map((activity) => {
              const meta = activityMeta[activity.type] ?? activityMeta.note;
              const Icon = meta.icon;
              return (
                <li key={activity.id} className="relative flex gap-3">
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      meta.tint
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-[13px] font-medium text-ink">{activity.title}</p>
                      <time className="text-xs tabular-nums text-muted-foreground">
                        {toShortTime(activity.at)}
                      </time>
                    </div>
                    {activity.detail && (
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {activity.detail}
                      </p>
                    )}
                    {activity.actor && (
                      <p className="mt-0.5 text-xs text-muted-foreground/80">
                        by {activity.actor}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export { LeadActivityTimeline };