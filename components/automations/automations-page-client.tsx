"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Bell,
  GitBranch,
  Mail,
  MessageCircle,
  PenLine,
  Sparkles,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/crm/toast";
import { ModuleHeader } from "@/components/crm/module-header";
import { StatGrid } from "@/components/crm/stat-grid";
import { PanelCard } from "@/components/crm/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAutomations } from "@/lib/supabase/automations";
import type {
  AutomationActionType,
  AutomationConditionField,
  AutomationCondition,
  AutomationStatus,
  AutomationTrigger,
  CrmAutomation,
} from "@/lib/types";
import {
  automationActionTypes,
  automationConditionFields,
  automationStatuses,
  automationTriggers,
} from "@/lib/mock-automations";

const triggerIcons: Record<AutomationTrigger, LucideIcon> = {
  "Lead Created": Sparkles,
  "Lead Status Changed": Sparkles,
  "Deal Created": GitBranch,
  "Deal Stage Changed": GitBranch,
  "Deal Won": Sparkles,
  "Deal Lost": Bell,
  "Task Overdue": Bell,
  "Email Opened": Mail,
  "Email Replied": Mail,
  "Form Submitted": PenLine,
  "Quote Accepted": Sparkles,
  "Invoice Overdue": Bell,
  "Customer Inactive": Bell,
};

const actionIcons: Record<AutomationActionType, LucideIcon> = {
  "Assign Owner": GitBranch,
  "Change Status": GitBranch,
  "Create Task": Zap,
  "Send Email": Mail,
  "Send WhatsApp": MessageCircle,
  "Add Tag": PenLine,
  "Remove Tag": Trash2,
  "Move Deal Stage": GitBranch,
  "Add to Sequence": GitBranch,
  "Create Notification": Bell,
  "Update Field": PenLine,
};

const statusTone: Record<AutomationStatus, "info" | "success" | "warning"> = {
  Active: "success",
  Paused: "warning",
  Draft: "info",
};

function AutomationsSkeleton() {
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
      <Skeleton className="h-[360px]" />
    </div>
  );
}

interface AutomationsPageClientProps {
  initialAutomations: CrmAutomation[];
}

function AutomationsPageClient({ initialAutomations }: AutomationsPageClientProps) {
  const [automations, setAutomations] = useState<CrmAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | AutomationStatus>("all");
  const [draft, setDraft] = useState<CrmAutomation | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [testRecord, setTestRecord] = useState<{ type: string; id: string } | null>(null);
  const [testResults, setTestResults] = useState<{
    conditionsPassed: boolean;
    actions: Array<{ type: string; wouldExecute: boolean; description: string }>;
  } | null>(null);

  // Fetch real automations from Supabase on mount
  useEffect(() => {
    fetchAutomations().then(({ automations, error }) => {
      if (error) {
        // Fall back to mock data if real fetch fails
        setAutomations(initialAutomations);
      } else {
        setAutomations(automations);
      }
      setLoading(false);
    });
  }, [initialAutomations]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Initialize test mode state from localStorage if enabled
  useEffect(() => {
    const stored = localStorage.getItem("automation_test_mode");
    if (stored === "true") {
      setTestMode(true);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const editing = useMemo(
    () => automations.find((a) => a.id === editingId) ?? null,
    [automations, editingId]
  );

  const stats = useMemo(() => {
    const active = automations.filter((a) => a.status === "Active").length;
    const totalRuns = automations.reduce((sum, a) => sum + a.runsCount, 0);
    const actionCount = automations.reduce((sum, a) => sum + a.actions.length, 0);
    return { active, total: automations.length, runs: totalRuns, actions: actionCount };
  }, [automations]);

  const filtered = useMemo(() => {
    let result = [...automations];
    if (statusFilter !== "all") result = result.filter((a) => a.status === statusFilter);
    return result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [automations, statusFilter]);

  const toggleStatus = (automation: CrmAutomation) => {
    const next: AutomationStatus =
      automation.status === "Active" ? "Paused" : automation.status === "Draft" ? "Active" : "Active";
    setAutomations((prev) =>
      prev.map((a) => (a.id === automation.id ? { ...a, status: next } : a))
    );
    setToast(next === "Active" ? "Automation activated" : "Automation paused");
  };

  const openBuilder = (automation: CrmAutomation) => {
    setDraft({ ...automation, conditions: automation.conditions.map((c) => ({ ...c })) });
    setEditingId(automation.id);
  };

  const saveDraft = () => {
    if (!draft) return;
    setAutomations((prev) => prev.map((a) => (a.id === draft.id ? draft : a)));
    setEditingId(null);
    setDraft(null);
    setToast("Rule saved");
  };

  const patchDraft = (patch: Partial<CrmAutomation>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
  };

  const addCondition = () => {
    if (!draft) return;
    const condition: AutomationCondition = {
      id: `con_${draft.conditions.length + 1}_${Date.now()}`,
      field: "Lead Score",
      operator: ">",
      value: "",
    };
    patchDraft({ conditions: [...draft.conditions, condition] });
  };

  const updateCondition = (id: string, patch: Partial<AutomationCondition>) => {
    if (!draft) return;
    patchDraft({
      conditions: draft.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeCondition = (id: string) => {
    if (!draft) return;
    patchDraft({ conditions: draft.conditions.filter((c) => c.id !== id) });
  };

  const addAction = (type: AutomationActionType) => {
    if (!draft) return;
    patchDraft({
      actions: [...draft.actions, { id: `act_${Date.now()}`, type, target: "Record", value: "" }],
    });
  };

  const removeAction = (id: string) => {
    if (!draft) return;
    patchDraft({ actions: draft.actions.filter((a) => a.id !== id) });
  };

  if (loading) return <AutomationsSkeleton />;

  if (editing && draft) {
    const TriggerIcon = triggerIcons[draft.trigger];
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> All automations
          </Button>
        </div>

        <PanelCard className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">{draft.name}</h1>
              {draft.description && (
                <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p>
              )}
            </div>
            <Badge variant={statusTone[draft.status]}>{draft.status}</Badge>
          </div>
        </PanelCard>

        <PanelCard title="Trigger" className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TriggerIcon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">When this happens</p>
              <p className="text-sm font-medium text-ink">{draft.trigger}</p>
            </div>
            <div className="ml-auto">
              <Select value={draft.trigger} onValueChange={(value) => patchDraft({ trigger: value as AutomationTrigger })}>
                <SelectTrigger className="w-[200px]" aria-label="Trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {automationTriggers.map((trigger) => (
                    <SelectItem key={trigger} value={trigger}>
                      {trigger}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Conditions"
          description="(Optional) only run when these are met"
          actions={
            <Button size="sm" variant="outline" onClick={addCondition}>
              + Condition
            </Button>
          }
          className="p-5"
        >
          {draft.conditions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No conditions — this automation will run for every matching trigger.
            </p>
          ) : (
            <div className="space-y-2">
              {draft.conditions.map((condition) => (
                <div
                  key={condition.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5"
                >
                  <span className="text-xs font-medium text-muted-foreground">Field</span>
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(condition.id, { field: value as AutomationConditionField })}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Condition field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {automationConditionFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs font-medium text-muted-foreground">Operator</span>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(condition.id, { operator: value as AutomationCondition["operator"] })}
                  >
                    <SelectTrigger className="h-8 w-[120px] text-xs" aria-label="Operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[">", "<", "=", "!=", "contains", "not contains"].map((op) => (
                        <SelectItem key={op} value={op}>
                          {op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    className="h-8 min-w-[100px] flex-1 rounded-md border border-border bg-card px-2.5 text-sm outline-none focus:border-primary"
                    value={condition.value}
                    onChange={(event) => updateCondition(condition.id, { value: event.target.value })}
                    placeholder="Value"
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Remove condition"
                    onClick={() => removeCondition(condition.id)}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Actions"
          description="What to do when the rule matches"
          actions={
            <div className="flex items-center gap-1.5">
              <Select
                value=""
                onValueChange={(value) => {
                  addAction(value as AutomationActionType);
                }}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Add action">
                  <SelectValue placeholder="+ Add action" />
                </SelectTrigger>
                <SelectContent>
                  {automationActionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          className="p-5"
        >
          <div className="space-y-2">
            {draft.actions.map((action) => {
              const Icon = actionIcons[action.type];
              return (
                <div
                  key={action.id}
                  className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-muted/30 p-2.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-ink">{action.type}</p>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {action.target}
                    {action.value ? ` → ${action.value}` : ""}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Remove action"
                    onClick={() => removeAction(action.id)}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              );
            })}
          </div>
        </PanelCard>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditingId(null)}>
            Cancel
          </Button>
          <Button onClick={saveDraft}>Save rule</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Automations"
        subtitle="Trigger-based rules that assign, notify, task and follow up automatically."
      />

      <StatGrid
        stats={[
          { label: "Active", value: stats.active, tone: "success" },
          { label: "Total rules", value: stats.total },
          { label: "Runs (all time)", value: stats.runs, tone: "info" },
          { label: "Actions", value: stats.actions, tone: "purple" },
        ]}
      />

      <PanelCard className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {automationStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-muted-foreground">{filtered.length} automations</p>
        </div>
      </PanelCard>

      <div className="space-y-2.5">
        {filtered.map((automation) => {
          const TriggerIcon = triggerIcons[automation.trigger];
          return (
            <div
              key={automation.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TriggerIcon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openBuilder(automation)}
                      className="font-medium text-ink hover:text-primary"
                    >
                      {automation.name}
                    </button>
                    <Badge variant={statusTone[automation.status]}>{automation.status}</Badge>
                  </div>
                  {automation.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{automation.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
                      When: {automation.trigger}
                    </span>
                    <span>If: {automation.conditions.length} condition{automation.conditions.length === 1 ? "" : "s"}</span>
                    <span>Then: {automation.actions.length} action{automation.actions.length === 1 ? "" : "s"}</span>
                    <span>{automation.runsCount} runs</span>
                    {automation.lastRunAt && (
                      <span>
                        Last run: {new Date(automation.lastRunAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => openBuilder(automation)}
                  >
                    Edit rule
                  </Button>
                  <Button
                    size="sm"
                    variant={automation.status === "Active" ? "secondary" : "default"}
                    className="h-8 text-xs"
                    onClick={() => toggleStatus(automation)}
                  >
                    {automation.status === "Active" ? "Pause" : "Activate"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <PanelCard className="p-10 text-center">
            <p className="text-sm font-medium text-ink">No automations match your filters</p>
          </PanelCard>
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}

export { AutomationsPageClient };