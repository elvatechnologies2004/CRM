"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
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
import { LogCallDialog, type LogCallForm } from "@/components/activities/log-call-dialog";
import { readStoredCalls, upsertCall, uid } from "@/lib/activity-local";
import { toDayLabel } from "@/lib/date-utils";
import { callOutcomes } from "@/lib/mock-calls";
import { cn } from "@/lib/utils";
import type { CallDirection, CallOutcome, CallRecord } from "@/lib/types";

interface CallsPageClientProps {
  initialCalls: CallRecord[];
  owners: string[];
}

const callOutcomeConfig: Record<CallOutcome, { variant: "success" | "warning" | "danger" | "secondary" | "outline"; label: string }> = {
  Connected: { variant: "success", label: "Connected" },
  "No Answer": { variant: "warning", label: "No answer" },
  Voicemail: { variant: "secondary", label: "Voicemail" },
  Busy: { variant: "warning", label: "Busy" },
  "Follow-up Needed": { variant: "outline", label: "Follow-up needed" },
};

const directionConfig: Record<CallDirection, { icon: LucideIcon; label: string; classes: string }> = {
  Inbound: { icon: ArrowDownLeft, label: "Inbound", classes: "text-green-600" },
  Outbound: { icon: ArrowUpRight, label: "Outbound", classes: "text-primary" },
};

function CallsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
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

function CallsPageClient({ initialCalls, owners }: CallsPageClientProps) {
  const [calls, setCalls] = useState<CallRecord[]>(initialCalls);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | CallOutcome>("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | CallDirection>("all");
  const [logOpen, setLogOpen] = useState(false);

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
      const stored = readStoredCalls();
      setCalls((prev) => [...stored, ...prev.filter((c) => !stored.some((s) => s.id === c.id))]);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const stats = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = calls.filter((c) => new Date(c.date).toDateString() === todayKey).length;
    const inbound = calls.filter(
      (c) => c.direction === "Inbound" && (c.outcome === "Connected" || c.outcome === "Voicemail")
    ).length;
    const outbound = calls.filter(
      (c) => c.direction === "Outbound" && (c.outcome === "Connected" || c.outcome === "Voicemail")
    ).length;
    const missed = calls.filter((c) => c.outcome === "No Answer" || c.outcome === "Busy").length;
    return { today, inbound, outbound, missed };
  }, [calls]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...calls]
      .filter((c) => {
        if (outcomeFilter !== "all" && c.outcome !== outcomeFilter) return false;
        if (directionFilter !== "all" && c.direction !== directionFilter) return false;
        if (!q) return true;
        return (
          (c.contactName?.toLowerCase().includes(q) || "") ||
          (c.companyName?.toLowerCase().includes(q) || "") ||
          (c.relatedDealName?.toLowerCase().includes(q) || "") ||
          c.ownerName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [calls, query, outcomeFilter, directionFilter]);

  const handleOutcome = (call: CallRecord, outcome: CallOutcome) => {
    const updated = { ...call, outcome };
    upsertCall(updated);
    setCalls((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setToast("Call outcome updated");
  };

  const handleLog = (form: LogCallForm) => {
    const minutes = Number(form.durationMinutes) || 0;
    const call: CallRecord = {
      id: uid("cl"),
      contactName: form.contactName,
      companyName: form.companyName,
      direction: form.direction,
      duration: minutes > 0 ? minutes : undefined,
      date: form.date,
      time: form.time,
      ownerId: "u_1",
      ownerName: form.ownerName,
      outcome: "Connected",
      notes: form.notes,
    };
    upsertCall(call);
    setCalls((prev) => [call, ...prev]);
    setToast("Call logged");
  };

  if (loading) return <CallsSkeleton />;

  const durationLabel = (minutes?: number) => {
    if (!minutes || minutes <= 0) return "—";
    return `${minutes} min`;
  };

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Calls"
        subtitle="Track inbound, outbound and missed calls with outcomes."
        actions={[{ label: "Log a Call", onClick: () => setLogOpen(true) }]}
      />

      <StatGrid
        stats={[
          { label: "Calls today", value: stats.today, tone: "info" },
          { label: "Inbound", value: stats.inbound, tone: "success" },
          { label: "Outbound", value: stats.outbound, tone: "purple" },
          { label: "Missed", value: stats.missed, tone: "danger" },
        ]}
      />

      <PanelCard className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-9 max-w-[260px]"
            placeholder="Search calls..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            value={directionFilter}
            onValueChange={(value) => setDirectionFilter(value as typeof directionFilter)}
          >
            <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Both directions</SelectItem>
              <SelectItem value="Inbound">Inbound</SelectItem>
              <SelectItem value="Outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={outcomeFilter}
            onValueChange={(value) => setOutcomeFilter(value as typeof outcomeFilter)}
          >
            <SelectTrigger className="h-9 w-[170px]" aria-label="Filter by outcome">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All outcomes</SelectItem>
              {callOutcomes.map((outcome) => (
                <SelectItem key={outcome} value={outcome}>
                  {outcome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-muted-foreground">{filtered.length} calls</p>
        </div>
      </PanelCard>

      <div className="space-y-2">
        {filtered.map((call) => {
          const config = callOutcomeConfig[call.outcome];
          const direction = directionConfig[call.direction];
          const DirectionIcon = direction.icon;
          return (
            <div
              key={call.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted",
                    direction.classes
                  )}
                >
                  <DirectionIcon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{call.contactName ?? call.companyName ?? "—"}</p>
                    <Badge variant="secondary">{direction.label}</Badge>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {toDayLabel(call.date)} · {call.time} · {durationLabel(call.duration)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {call.ownerName}
                    {call.companyName ? ` · ${call.companyName}` : ""}
                    {call.relatedDealName ? ` · ${call.relatedDealName}` : ""}
                  </p>
                  {call.notes && (
                    <p className="mt-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                      {call.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => handleOutcome(call, "Follow-up Needed")}
                    title="Flag for follow-up"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Select
                    value={call.outcome}
                    onValueChange={(value) => handleOutcome(call, value as CallOutcome)}
                  >
                    <SelectTrigger className="h-8 w-[150px]" aria-label="Update outcome">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {callOutcomes.map((outcome) => (
                        <SelectItem key={outcome} value={outcome}>
                          {outcome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <PanelCard className="p-10 text-center">
            <p className="text-sm font-medium text-ink">No calls to show</p>
            <p className="mt-1 text-xs text-muted-foreground">Adjust the filter or log a new call.</p>
          </PanelCard>
        )}
      </div>

      <LogCallDialog open={logOpen} onOpenChange={setLogOpen} owners={owners} onSubmit={handleLog} />
      <Toast message={toast} />
    </div>
  );
}

export { CallsPageClient };