import { Activity, type LucideIcon } from "lucide-react";

import { toDayLabel, toShortTime } from "@/lib/mock-leads";
import { cn } from "@/lib/utils";

export interface CrmActivityItem {
  id: string;
  type: string;
  title: string;
  detail?: string;
  at: string;
  actor?: string;
}

export interface ActivityIconMeta {
  icon: LucideIcon;
  tint: string;
}

function groupByDay(activities: CrmActivityItem[]) {
  const groups: { label: string; items: CrmActivityItem[] }[] = [];
  for (const activity of activities) {
    const label = toDayLabel(activity.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(activity);
    else groups.push({ label, items: [activity] });
  }
  return groups;
}

interface ActivityTimelineProps {
  activities: CrmActivityItem[];
  iconMap: Record<string, ActivityIconMeta>;
  limit?: number;
  fallbackIcon?: ActivityIconMeta;
}

function ActivityTimeline({
  activities,
  iconMap,
  limit,
  fallbackIcon,
}: ActivityTimelineProps) {
  const visible = limit ? activities.slice(0, limit) : activities;
  const groups = groupByDay(visible);
  const fallback = fallbackIcon ?? {
    icon: Activity,
    tint: "bg-muted text-muted-foreground",
  };

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
      <span className="absolute bottom-2 left-[15px] top-2 w-px bg-border" aria-hidden />
      {groups.map((group) => (
        <li key={group.label}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <ul className="space-y-4">
            {group.items.map((activity) => {
              const meta = iconMap[activity.type] ?? fallback;
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

export { ActivityTimeline };