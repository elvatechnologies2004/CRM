"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquareText,
  Phone,
  Repeat,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/crm/toast";
import { ModuleHeader } from "@/components/crm/module-header";
import { StatGrid } from "@/components/crm/stat-grid";
import { PanelCard } from "@/components/crm/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/crm/status-badges";
import { cn } from "@/lib/utils";
import type { CrmSequence, SequenceEnrollment, SequenceStatus, SequenceStepType } from "@/lib/types";

const stepTypeIcons: Record<SequenceStepType, LucideIcon> = {
  Email: Mail,
  WhatsApp: MessageCircle,
  SMS: MessageSquareText,
  "Call Task": Phone,
  "Manual Task": Wrench,
  Wait: CalendarClock,
};

const stepTypeClass: Record<SequenceStepType, string> = {
  Email: "bg-primary/10 text-primary",
  WhatsApp: "bg-green-500/10 text-green-600",
  SMS: "bg-blue-500/10 text-blue-600",
  "Call Task": "bg-amber-500/10 text-amber-700",
  "Manual Task": "bg-violet-500/10 text-violet-600",
  Wait: "bg-muted text-muted-foreground",
};

const enrollmentStatusVariant: Record<SequenceEnrollment["status"], "success" | "warning" | "danger" | "secondary" | "info"> = {
  Active: "info",
  Paused: "warning",
  Replied: "success",
  Stopped: "danger",
  Completed: "success",
};

function SequencesSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[320px]" />
    </div>
  );
}

interface SequencesPageClientProps {
  initialSequences: CrmSequence[];
  initialEnrollments: SequenceEnrollment[];
}

function SequencesPageClient({ initialSequences, initialEnrollments }: SequencesPageClientProps) {
  const [sequences, setSequences] = useState(initialSequences);
  const [enrollmentsBySeq] = useState<Record<string, SequenceEnrollment[]>>(() => {
    const map: Record<string, SequenceEnrollment[]> = {};
    initialEnrollments.forEach((enrollment) => {
      (map[enrollment.sequenceId] = map[enrollment.sequenceId] ?? []).push(enrollment);
    });
    return map;
  });
  const [activeSequenceId, setActiveSequenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SequenceStatus>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeSequence = useMemo(
    () => sequences.find((s) => s.id === activeSequenceId) ?? null,
    [sequences, activeSequenceId]
  );

  const enrollments = useMemo(
    () => (activeSequenceId ? enrollmentsBySeq[activeSequenceId] ?? [] : []),
    [activeSequenceId, enrollmentsBySeq]
  );

  const stats = useMemo(() => {
    const active = sequences.filter((s) => s.status === "Active").length;
    const totalEnrolled = sequences.reduce((sum, s) => sum + s.enrollmentCount, 0);
    const weightedReplies = sequences.reduce((sum, s) => {
      const enrolled = s.enrollmentCount;
      if (enrolled === 0 && s.replyRate > 0) return sum + s.replyRate;
      return sum + enrolled * (s.replyRate / 100);
    }, 0);
    const meetings = sequences.reduce((sum, s) => sum + s.meetingsBooked, 0);
    return {
      active,
      enrolled: totalEnrolled,
      replied: Math.round(weightedReplies),
      meetings,
    };
  }, [sequences]);

  const handleToggleStatus = (sequence: CrmSequence) => {
    const nextStatus: SequenceStatus = sequence.status === "Active" ? "Paused" : "Active";
    setSequences((prev) =>
      prev.map((s) => (s.id === sequence.id ? { ...s, status: nextStatus } : s))
    );
    setToast(nextStatus === "Active" ? "Sequence activated" : "Sequence paused");
  };

  const filtered = useMemo(() => {
    let result = [...sequences];
    if (statusFilter !== "all") result = result.filter((s) => s.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [sequences, statusFilter, query]);

  if (loading) return <SequencesSkeleton />;

  if (activeSequence) {
    const total = activeSequence.steps.length;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setActiveSequenceId(null)}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> All sequences
          </Button>
        </div>

        <PanelCard className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-ink">{activeSequence.name}</h1>
                <StatusBadge status={activeSequence.status} />
              </div>
              {activeSequence.description && (
                <p className="mt-1 text-sm text-muted-foreground">{activeSequence.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Owner: {activeSequence.ownerName} · Created{" "}
                {new Date(activeSequence.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeSequence.status !== "Draft" && activeSequence.status !== "Archived" && (
                <Button size="sm" variant="outline" onClick={() => handleToggleStatus(activeSequence)}>
                  {activeSequence.status === "Active" ? "Pause" : "Activate"}
                </Button>
              )}
              <div className="flex flex-wrap gap-1.5">
                {activeSequence.stopEvents.map((event) => (
                  <Badge key={event} variant="secondary" className="text-[11px] font-normal">
                    Stop: {event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </PanelCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PanelCard title="Steps" description={`${total} steps in this sequence`} className="p-5">
            <div className="space-y-2.5">
              {activeSequence.steps.map((step, index) => {
                const Icon = stepTypeIcons[step.type];
                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                          step.type === "Wait" ? "bg-muted-foreground" : "bg-primary"
                        )}
                      >
                        {index + 1}
                      </span>
                      {index < total - 1 && <span className="h-4 w-px bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Icon className={cn("h-4 w-4", stepTypeClass[step.type])} aria-hidden />
                        <p className="text-sm font-medium text-ink">{step.title}</p>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {step.type}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Send after {step.delayDays} day{step.delayDays === 1 ? "" : "s"}
                        {step.content ? ` · ${step.content}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelCard>

          <PanelCard
            title="Enrolled"
            description={`${enrollments.length} leads/contacts enrolled`}
            className="p-5"
          >
            {enrollments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No enrollments for this sequence yet.
              </p>
            ) : (
              <div className="space-y-2">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{enrollment.relatedName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Step {Math.min(enrollment.currentStep + 1, total)} of {total} · Enrolled{" "}
                        {new Date(enrollment.enrolledAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </p>
                    </div>
                    <Badge
                      variant={enrollmentStatusVariant[enrollment.status]}
                      className="text-[11px] font-normal"
                    >
                      {enrollment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Sequences"
        subtitle="Automate multi-step outreach with email, WhatsApp, SMS and calls."
      />

      <StatGrid
        stats={[
          { label: "Active sequences", value: stats.active, tone: "info" },
          { label: "Total enrolled", value: stats.enrolled, tone: "purple" },
          { label: "Replies tracked", value: stats.replied, tone: "success" },
          { label: "Meetings booked", value: stats.meetings, tone: "warning" },
        ]}
      />

      <PanelCard className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-9 max-w-[260px]"
            placeholder="Search sequences..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-muted-foreground">{filtered.length} sequences</p>
        </div>
      </PanelCard>

      <div className="space-y-2.5">
        {filtered.map((sequence) => {
          const replyRate = sequence.replyRate;
          const steps = sequence.steps.length;
          return (
            <button
              key={sequence.id}
              type="button"
              onClick={() => setActiveSequenceId(sequence.id)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Repeat className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{sequence.name}</p>
                    <StatusBadge status={sequence.status} />
                    {sequence.status !== "Archived" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleStatus(sequence);
                        }}
                      >
                        {sequence.status === "Active" ? "Pause" : "Activate"}
                      </Button>
                    )}
                  </div>
                  {sequence.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{sequence.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {steps} steps
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Inbox className="h-3.5 w-3.5" aria-hidden /> {sequence.enrollmentCount} enrolled
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden /> {replyRate}% reply
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {sequence.meetingsBooked} meetings
                    </span>
                  </div>
                </div>
                <div className="w-full max-w-[220px] sm:w-44">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Reply rate</span>
                    <span className="font-medium text-ink">{replyRate}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(replyRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <PanelCard className="p-10 text-center">
            <p className="text-sm font-medium text-ink">No sequences match your filters</p>
            <p className="mt-1 text-xs text-muted-foreground">Adjust filters or create a new sequence.</p>
          </PanelCard>
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}

export { SequencesPageClient };