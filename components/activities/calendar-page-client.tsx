"use client";

import { useEffect, useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/crm/toast";
import { ModuleHeader } from "@/components/crm/module-header";
import { Button } from "@/components/ui/button";
import { CalendarView, type CalendarEntry, type CalendarViewMode } from "@/components/activities/calendar-grid";
import { NewActivityDialog, type NewActivityForm } from "@/components/activities/new-activity-dialog";
import { readStoredMeetings, upsertMeeting, readStoredTasks, upsertTask, uid } from "@/lib/activity-local";
import type { CrmMeeting, CrmTask } from "@/lib/types";

interface CalendarPageClientProps {
  initialTasks: CrmTask[];
  initialMeetings: CrmMeeting[];
}

function normalizeMeeting(meeting: CrmMeeting): CalendarEntry {
  return {
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    time: meeting.time,
    kind: "meeting",
    ownerName: meeting.ownerName,
    relatedName: meeting.relatedDealName ?? meeting.relatedContactName,
    status: meeting.status,
    duration: meeting.duration,
    meetingLink: meeting.meetingLink,
  };
}

function normalizeTask(task: CrmTask): CalendarEntry {
  return {
    id: task.id,
    title: task.title,
    date: task.dueDate,
    time: task.dueTime,
    kind: task.type === "Call" ? "call" : task.type === "Meeting" ? "meeting" : "task",
    ownerName: task.ownerName,
    relatedName: task.relatedName,
    status: task.status.toLowerCase() as CalendarEntry["status"],
    priority: task.priority,
  };
}

function CalendarPageClient({ initialTasks, initialMeetings }: CalendarPageClientProps) {
  const [tasks, setTasks] = useState<CrmTask[]>(initialTasks);
  const [meetings, setMeetings] = useState<CrmMeeting[]>(initialMeetings);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalendarViewMode>("month");
  const [toast, setToast] = useState<string | null>(null);
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
      const storedTasks = readStoredTasks();
      const storedMeetings = readStoredMeetings();
      setTasks((prev) => [...storedTasks, ...prev.filter((t) => !storedTasks.some((s) => s.id === t.id))]);
      setMeetings((prev) => [...storedMeetings, ...prev.filter((m) => !storedMeetings.some((s) => s.id === m.id))]);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const entries = useMemo<CalendarEntry[]>(() => {
    const taskEntries = tasks.map(normalizeTask);
    const meetingEntries = meetings.map(normalizeMeeting);
    return [...taskEntries, ...meetingEntries].sort(
      (a, b) => +new Date(a.date) - +new Date(b.date)
    );
  }, [tasks, meetings]);

  const handleNewActivity = (form: NewActivityForm) => {
    if (form.kind === "meeting") {
      const meeting: CrmMeeting = {
        id: uid("mt"),
        title: form.title,
        meetingType: "Follow-up",
        date: form.date,
        time: form.time,
        duration: Number(form.duration) || 30,
        ownerId: "u_1",
        ownerName: "Hussain Ali",
        participants: [],
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      upsertMeeting(meeting);
      setMeetings((prev) => [meeting, ...prev]);
    } else {
      const task: CrmTask = {
        id: uid("tk"),
        title: form.title,
        type: form.kind === "call" ? "Call" : "Meeting",
        priority: "Medium",
        status: "Open",
        ownerId: "u_1",
        ownerName: "Hussain Ali",
        dueDate: `${form.date}T09:00:00.000Z`,
        dueTime: form.time,
        relatedType: "Lead",
        createdAt: new Date().toISOString(),
      };
      upsertTask(task);
      setTasks((prev) => [task, ...prev]);
    }
    setToast("Activity added to calendar");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-[520px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Calendar"
        subtitle="Tasks, meetings, calls and follow-ups in one view."
        actions={[
          { label: "New Activity", onClick: () => setAddOpen(true), icon: <PlusIcon /> },
        ]}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={view === mode ? "secondary" : "ghost"}
            onClick={() => setView(mode)}
            className="h-8 text-xs capitalize"
          >
            {mode}
          </Button>
        ))}
      </div>

      <CalendarView entries={entries} view={view} />

      <NewActivityDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleNewActivity} />
      <Toast message={toast} />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export { CalendarPageClient };