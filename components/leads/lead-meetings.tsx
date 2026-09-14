"use client";

import { useState } from "react";
import { CalendarDays, ExternalLink, Plus, Trash2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LeadMeeting, LeadMeetingKind } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeadMeetingsProps {
  meetings: LeadMeeting[];
  onAdd: (meeting: LeadMeeting) => void;
  onDelete: (id: string) => void;
}

function LeadMeetings({ meetings, onAdd, onDelete }: LeadMeetingsProps) {
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "10:00", duration: "30 min" });
  const [error, setError] = useState<string | null>(null);

  const upcoming = meetings.filter((meeting) => meeting.kind === "upcoming");
  const past = meetings.filter((meeting) => meeting.kind === "past");

  const handleAdd = () => {
    if (!form.title.trim()) {
      setError("Meeting title is required.");
      return;
    }
    if (!form.date) {
      setError("Meeting date is required.");
      return;
    }
    setError(null);
    const date = new Date(`${form.date}T${form.time}`);
    const timeLabel = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
    onAdd({
      id: `m_${Date.now().toString(36)}`,
      title: form.title.trim(),
      date: date.toISOString(),
      time: timeLabel,
      duration: form.duration,
      kind: "upcoming",
      join: "https://meet.relvo.io/generated",
    });
    setForm({ title: "", date: "", time: "10:00", duration: "30 min" });
    setComposing(false);
  };

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
          Meetings
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setComposing((prev) => !prev)}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add Meeting
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {composing && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2.5 text-[13px] font-medium text-ink">New meeting</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Meeting title"
                  aria-label="Meeting title"
                />
              </div>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                aria-label="Meeting date"
              />
              <Input
                type="time"
                value={form.time}
                onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
                aria-label="Meeting time"
              />
              <SelectDuration
                value={form.duration}
                onChange={(duration) => setForm((prev) => ({ ...prev, duration }))}
              />
            </div>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            <div className="mt-2.5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd}>
                Schedule
              </Button>
            </div>
          </div>
        )}

        <MeetingSection
          title="Upcoming"
          kind="upcoming"
          meetings={upcoming}
          onDelete={onDelete}
        />
        <MeetingSection title="Past" kind="past" meetings={past} onDelete={onDelete} />
      </CardContent>
    </Card>
  );
}

function SelectDuration({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label="Meeting duration"
    >
      <option value="15 min">15 min</option>
      <option value="30 min">30 min</option>
      <option value="45 min">45 min</option>
      <option value="60 min">60 min</option>
    </select>
  );
}

function MeetingSection({
  title,
  kind,
  meetings,
  onDelete,
}: {
  title: string;
  kind: LeadMeetingKind;
  meetings: LeadMeeting[];
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title} · {meetings.length}
      </p>
      {meetings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          No {kind} meetings.
        </p>
      ) : (
        <ul className="space-y-2">
          {meetings.map((meeting) => (
            <li
              key={meeting.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  kind === "upcoming" ? "bg-brand-blue/10 text-brand-blue" : "bg-muted text-muted-foreground"
                )}
              >
                <Video className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">{meeting.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {meeting.time} · {meeting.duration} · {formatDate(meeting.date)}
                </p>
                {meeting.join && kind === "upcoming" && (
                  <a
                    href={meeting.join}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    Join meeting
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDelete(meeting.id)}
                aria-label={`Delete meeting "${meeting.title}"`}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export { LeadMeetings };