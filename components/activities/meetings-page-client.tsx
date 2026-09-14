"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Video,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/crm/toast";
import { ModuleHeader } from "@/components/crm/module-header";
import { StatGrid } from "@/components/crm/stat-grid";
import { PanelCard } from "@/components/crm/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScheduleMeetingDialog, type ScheduleMeetingForm } from "@/components/activities/schedule-meeting-dialog";
import { readStoredMeetings, upsertMeeting, uid } from "@/lib/activity-local";
import { toDayLabel, toShortTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CrmMeeting, MeetingStatus } from "@/lib/types";

interface MeetingsPageClientProps {
  initialMeetings: CrmMeeting[];
  owners: string[];
}

const meetingStatusConfig: Record<
  MeetingStatus,
  { variant: "success" | "warning" | "danger" | "outline" | "secondary"; label: string }
> = {
  scheduled: { variant: "secondary", label: "Scheduled" },
  in_progress: { variant: "warning", label: "In progress" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "danger", label: "Cancelled" },
  no_show: { variant: "danger", label: "No show" },
  rescheduled: { variant: "outline", label: "Rescheduled" },
};

const kindIcons: Record<CrmMeeting["meetingType"], LucideIcon> = {
  Discovery: CalendarDays,
  "Product Demo": Video,
  "Follow-up": CalendarDays,
  Negotiation: CalendarDays,
  "Contract Signing": CheckCircle2,
  Internal: CalendarDays,
  Kickoff: CalendarDays,
  "Check-in": CalendarDays,
};

function MeetingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[420px]" />
    </div>
  );
}

function MeetingsPageClient({ initialMeetings, owners }: MeetingsPageClientProps) {
  const [meetings, setMeetings] = useState<CrmMeeting[]>(initialMeetings);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MeetingStatus>("all");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readStoredMeetings();
      setMeetings((prev) => [...stored, ...prev.filter((m) => !stored.some((s) => s.id === m.id))]);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const stats = useMemo(() => {
    const todayKey = new Date().toDateString();
    const upcoming = meetings.filter(
      (m) =>
        m.status !== "cancelled" &&
        m.status !== "completed" &&
        +new Date(m.date) >= new Date().getTime()
    );
    const today = meetings.filter(
      (m) => new Date(m.date).toDateString() === todayKey && m.status !== "cancelled"
    );
    return {
      upcoming: upcoming.length,
      today: today.length,
      completed: meetings.filter((m) => m.status === "completed").length,
      cancelled: meetings.filter((m) => m.status === "cancelled").length,
    };
  }, [meetings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...meetings]
      .filter((m) => {
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        if (!q) return true;
        return (
          m.title.toLowerCase().includes(q) ||
          (m.relatedContactName?.toLowerCase().includes(q) || "") ||
          (m.relatedDealName?.toLowerCase().includes(q) || "") ||
          m.ownerName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [meetings, query, statusFilter]);

  const handleStatusChange = (meeting: CrmMeeting, status: MeetingStatus) => {
    const updated = { ...meeting, status };
    upsertMeeting(updated);
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setToast(`Meeting marked ${meetingStatusConfig[status].label.toLowerCase()}`);
  };

  const handleSchedule = (form: ScheduleMeetingForm) => {
    const meeting: CrmMeeting = {
      id: uid("mt"),
      title: form.title,
      meetingType: form.meetingType,
      date: form.date,
      time: form.time,
      duration: Number(form.duration) || 30,
      ownerId: "u_1",
      ownerName: form.ownerName,
      participants: [],
      status: "scheduled",
      meetingLink: "https://meet.example.com/preview",
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    upsertMeeting(meeting);
    setMeetings((prev) => [meeting, ...prev]);
    setToast("Meeting scheduled");
  };

  if (loading) return <MeetingsSkeleton />;

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Meetings"
        subtitle="Schedule, track and review external and internal meetings."
        actions={[{ label: "Schedule Meeting", onClick: () => setAddOpen(true) }]}
      />

      <StatGrid
        stats={[
          { label: "Upcoming", value: stats.upcoming, tone: "info" },
          { label: "Today", value: stats.today, tone: "purple" },
          { label: "Completed", value: stats.completed, tone: "success" },
          { label: "Cancelled", value: stats.cancelled },
        ]}
      />

      <PanelCard className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-9 max-w-[280px]"
            placeholder="Search meetings..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="h-9 w-[180px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(meetingStatusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-muted-foreground">{filtered.length} meetings</p>
        </div>
      </PanelCard>

      <div className="space-y-2">
        {filtered.map((meeting) => {
          const config = meetingStatusConfig[meeting.status];
          const Icon = kindIcons[meeting.meetingType] ?? CalendarDays;
          const isPast = +new Date(meeting.date) < new Date().getTime() && meeting.status === "scheduled";
          return (
            <div
              key={meeting.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{meeting.title}</p>
                    <Badge variant={config.variant}>{config.label}</Badge>
                    {isPast && (
                      <Badge variant="danger">Overdue</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {toDayLabel(meeting.date)} Â· {toShortTime(meeting.time)} Â· {meeting.duration} min
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {meeting.ownerName}
                    {meeting.relatedContactName ? ` Â· ${meeting.relatedContactName}` : ""}
                    {meeting.relatedDealName ? ` Â· ${meeting.relatedDealName}` : ""}
                    {meeting.meetingLink ? ` Â· ${meeting.meetingLink}` : ""}
                  </p>
                  {meeting.notes && (
                    <p className="mt-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                      {meeting.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={meeting.status}
                    onValueChange={(value) => handleStatusChange(meeting, value as MeetingStatus)}
                  >
                    <SelectTrigger className="h-8 w-[130px]" aria-label="Update status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(meetingStatusConfig).map(([key, entry]) => (
                        <SelectItem key={key} value={key}>
                          {entry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {meeting.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn("h-8 text-xs")}
                      onClick={() => handleStatusChange(meeting, "completed")}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <PanelCard className="p-10 text-center">
            <p className="text-sm font-medium text-ink">No meetings to show</p>
            <p className="mt-1 text-xs text-muted-foreground">Adjust the filter or schedule a new meeting.</p>
          </PanelCard>
        )}
      </div>

      <ScheduleMeetingDialog open={addOpen} onOpenChange={setAddOpen} owners={owners} onSubmit={handleSchedule} />
      <Toast message={toast} />
    </div>
  );
}

export { MeetingsPageClient };