"use client";

import { Activity, BarChart4, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSnapshot } from "@/lib/analytics/metrics";

function AnalyticsClient({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const maxCount = Math.max(1, ...snapshot.events.map((p) => p.count));
  const usage = snapshot.usage;
  const usageRows: { label: string; value: number }[] = [
    { label: "Leads", value: usage.leads },
    { label: "Contacts", value: usage.contacts },
    { label: "Companies", value: usage.companies },
    { label: "Deals", value: usage.deals },
    { label: "Tasks", value: usage.tasks },
    { label: "Emails", value: usage.emails },
    { label: "Automations", value: usage.automations },
    { label: "Quotes", value: usage.quotes },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={Activity} label="Events (14d)" value={snapshot.events.reduce((s, p) => s + p.count, 0)} />
        <Stat icon={BarChart4} label="Top event" value={snapshot.topEvents[0]?.event_name ?? "—"} small />
        <Stat icon={Clock3} label="Last activity" value={snapshot.lastEvent?.created_at?.slice(0, 10) ?? "—"} small />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product activity — last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No product events recorded yet.</p>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {snapshot.events.map((point) => (
                <div key={point.date} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-sm bg-primary/80 transition-colors group-hover:bg-primary"
                    style={{ height: `${Math.round((point.count / maxCount) * 100)}%`, minHeight: 4 }}
                  />
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground shadow group-hover:block">
                    {point.date.slice(5)}: {point.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record counts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {usageRows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-lg font-semibold text-ink">{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {snapshot.topEvents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Frequent actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {snapshot.topEvents.map((ev) => (
                <li key={ev.event_name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ev.event_name}</span>
                  <span className="font-medium text-ink">{ev.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ icon: Icon, label, value, small }: { icon: typeof Activity; label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`mt-2 ${small ? "truncate text-sm font-semibold" : "text-2xl font-bold"} text-ink`}>{value}</p>
    </div>
  );
}

export { AnalyticsClient };