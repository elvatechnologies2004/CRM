import Link from "next/link";
import { ArrowUpRight, Phone, Video } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Meeting } from "@/lib/types";

interface MeetingsCardProps {
  meetings: Meeting[];
  leadHrefs?: Record<string, string>;
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  return (
    <>
      <span className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-border bg-muted/40 py-1.5 text-center">
        <span className="text-[11px] font-medium text-ink">{meeting.time}</span>
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        {meeting.type === "call" ? (
          <Phone className="h-4 w-4" aria-hidden />
        ) : (
          <Video className="h-4 w-4" aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-ink">{meeting.title}</span>
        <span className="truncate text-xs text-muted-foreground">{meeting.company}</span>
      </span>
    </>
  );
}

function MeetingsCard({ meetings, leadHrefs }: MeetingsCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Today&apos;s Meetings</CardTitle>
        <Link
          href="/meetings"
          scroll={false}
          className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          View all
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-1">
        {meetings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No meetings today</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {meetings.map((meeting) => {
            const href = leadHrefs?.[meeting.company.toLowerCase()];
            const rowClass = "flex items-center gap-3 rounded-lg py-3 transition-colors";
            return (
              <li key={meeting.id}>
                {href ? (
                  <a href={href} className={`${rowClass} group hover:bg-muted/40`}>
                    <MeetingRow meeting={meeting} />
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </a>
                ) : (
                  <div className={rowClass}>
                    <MeetingRow meeting={meeting} />
                  </div>
                )}
              </li>
            );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { MeetingsCard };