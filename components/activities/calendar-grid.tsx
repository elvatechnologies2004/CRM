"use client";

import { useMemo, useState } from "react";

import { PanelCard } from "@/components/crm/panel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthKey, monthLabelShort, toDayLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { MeetingStatus } from "@/lib/types";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  time?: string;
  kind: "task" | "meeting" | "call";
  ownerName?: string;
  relatedName?: string;
  status?: string | MeetingStatus;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  duration?: number;
  meetingLink?: string;
}

const kindStyles: Record<CalendarEntry["kind"], string> = {
  task: "border-l-primary bg-primary/10 text-primary",
  meeting: "border-l-violet-500 bg-violet-500/10 text-violet-600",
  call: "border-l-amber-500 bg-amber-500/10 text-amber-700",
};

const statusDot: Record<string, string> = {
  completed: "bg-emerald-500",
  scheduled: "bg-violet-500",
  open: "bg-primary",
  "in progress": "bg-blue-500",
};

function entryComparator(a: CalendarEntry, b: CalendarEntry): number {
  const dateDiff = +new Date(a.date) - +new Date(b.date);
  if (dateDiff !== 0) return dateDiff;
  return (a.time ?? "").localeCompare(b.time ?? "");
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - ((day + 6) % 7));
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function currentDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function entriesOn(entries: CalendarEntry[], date: Date): CalendarEntry[] {
  const key = currentDayKey(date);
  return entries.filter((entry) => {
    const d = new Date(entry.date);
    return currentDayKey(d) === key;
  });
}

function ViewEvent({ entry, compact }: { entry: CalendarEntry; compact?: boolean }) {
  return (
    <div
      className={cn(
        "cursor-pointer truncate rounded-r border-l-2 px-1.5 py-0.5 text-[11px] font-medium leading-4",
        kindStyles[entry.kind]
      )}
      title={`${entry.title}${entry.time ? ` · ${entry.time}` : ""}`}
    >
      {!compact && entry.time && <span className="mr-1 font-normal opacity-70">{entry.time}</span>}
      {entry.title}
    </div>
  );
}

interface CalendarViewProps {
  entries: CalendarEntry[];
  view: CalendarViewMode;
}

function CalendarView({ entries, view }: CalendarViewProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [cursor, setCursor] = useState<Date>(new Date());

  const nav = (delta: number) => {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(next.getMonth() + delta);
    else if (view === "week") next.setDate(next.getDate() + delta * 7);
    else if (view === "day") next.setDate(next.getDate() + delta);
    else next.setDate(next.getDate() + delta * 7);
    next.setHours(12, 0, 0, 0);
    setCursor(next);
  };

  const title = useMemo(() => {
    if (view === "month") return monthLabelShort(cursor.getTime());
    if (view === "day") return toDayLabel(cursor.toISOString());
    const weekStart = startOfWeek(cursor);
    const weekEnd = addDays(weekStart, 6);
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${monthLabelShort(weekStart.getTime())} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
    }
    return `${monthLabelShort(weekStart.getTime())} ${weekStart.getDate()} – ${monthLabelShort(weekEnd.getTime())} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }, [cursor, view]);

  const sortedEntries = useMemo(() => [...entries].sort(entryComparator), [entries]);

  const weekDays = useMemo(() => {
    if (view === "week" || view === "day") {
      const weekStart = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
    return [];
  }, [cursor, view]);

  const monthGrid = useMemo(() => {
    if (view !== "month") return [];
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor, view]);

  const todayKey = currentDayKey(today);

  return (
    <PanelCard className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold capitalize text-ink">{title}</p>
        <div className="flex items-center gap-1.5">
          <Button size="icon-sm" variant="outline" aria-label="Previous" onClick={() => nav(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Next" onClick={() => nav(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "month" && (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="bg-muted/50 px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {day}
            </div>
          ))}
          {monthGrid.map((date) => {
            const key = currentDayKey(date);
            const isCurrentMonth = date.getMonth() === cursor.getMonth();
            const isToday = key === todayKey;
            const dayEntries = entriesOn(sortedEntries, date);
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[92px] bg-card p-1.5",
                  !isCurrentMonth && "bg-muted/40 opacity-60"
                )}
              >
                <div className="flex items-center justify-between px-0.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                      isToday ? "bg-primary text-white" : "text-muted-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {dayEntries.slice(0, 3).map((entry) => (
                    <ViewEvent key={entry.id} entry={entry} />
                  ))}
                  {dayEntries.length > 3 && (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{dayEntries.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-8 gap-px overflow-hidden rounded-lg border border-border bg-border">
          <div className="bg-muted/50 px-2 py-1" />
          {weekDays.map((date) => {
            const key = currentDayKey(date);
            const isToday = key === todayKey;
            return (
              <div key={key} className="bg-muted/50 px-2 py-1 text-center">
                <p className={cn("text-[11px] font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                  {date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                </p>
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                    isToday ? "bg-primary text-white" : "text-muted-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
            );
          })}
          {[9, 11, 13, 15, 17].map((hour) => (
            <div key={hour} className="flex">
              <div className="w-14 border-t border-border bg-muted/30 px-1 py-0.5 text-right text-[10px] text-muted-foreground">
                {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              {weekDays.map((date) => {
                const dayEntries = entriesOn(sortedEntries, date).filter(
                  (e) => Number((e.time ?? "09:00").split(":")[0]) === hour
                );
                return (
                  <div key={currentDayKey(date)} className="min-h-[46px] flex-1 border-t border-l border-border p-0.5">
                    {dayEntries.map((entry) => (
                      <ViewEvent key={entry.id} entry={entry} compact />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {view === "day" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {toDayLabel(cursor.toISOString())} · {entriesOn(sortedEntries, cursor).length} activities
          </p>
          {entriesOn(sortedEntries, cursor).map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">{entry.time ?? "All day"}</span>
              <span className={cn("h-4 w-0.5 rounded-full", statusDot[String(entry.status ?? "")] ?? "bg-primary")} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{entry.title}</span>
              {entry.relatedName && (
                <span className="hidden truncate text-xs text-muted-foreground sm:inline">{entry.relatedName}</span>
              )}
            </div>
          ))}
          {entriesOn(sortedEntries, cursor).length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No activities scheduled for this day.</p>
          )}
        </div>
      )}

      {view === "agenda" && (
        <div className="space-y-0.5">
          {sortedEntries.slice(0, 40).map((entry) => {
            const [datePart] = entry.date.split("T");
            return (
              <div key={entry.id} className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                <div className="w-24 shrink-0 text-xs text-muted-foreground">
                  <p className="font-medium text-ink">{toDayLabel(datePart)}</p>
                  {entry.time && <p>{entry.time}</p>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.kind} · {entry.ownerName ?? "Unassigned"}
                    {entry.relatedName ? ` · ${entry.relatedName}` : ""}
                  </p>
                </div>
                <span className={cn("h-2 w-2 shrink-0 self-center rounded-full", statusDot[String(entry.status ?? "")] ?? "bg-primary")} />
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

export { CalendarView, monthKey };