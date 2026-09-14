"use client";

import { useState, useTransition } from "react";

import type { WorkflowRunView, WorkflowStatus, WorkflowTriggerType } from "@/lib/workflows/types";
import { WORKFLOW_TRIGGERS } from "@/lib/workflows/types";
import {
  createWorkflowAction,
  deleteWorkflowAction,
  runWorkflowManuallyAction,
  toggleWorkflowAction,
} from "@/lib/workflows/actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface WorkflowsClientProps {
  workflows: {
    id: string;
    name: string;
    description: string | null;
    trigger_type: string;
    status: WorkflowStatus;
    allow_loops: boolean;
    updated_at: string;
  }[];
  canManage: boolean;
  runs: WorkflowRunView[];
}

const DEFAULT_DEFINITION = JSON.stringify(
  {
    start: "action",
    nodes: [
      {
        id: "action",
        type: "action",
        name: "Notify team",
        config: { action: "notify", title: "New lead", message: "A new lead was created" },
      },
    ],
  },
  null,
  2,
);

function WorkflowsClient({ workflows, canManage, runs }: WorkflowsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<WorkflowTriggerType>("lead.created");
  const [definitionText, setDefinitionText] = useState(DEFAULT_DEFINITION);
  const [definitionError, setDefinitionError] = useState<string | null>(null);

  function parseDefinition(): unknown {
    try {
      const parsed = JSON.parse(definitionText);
      return parsed;
    } catch {
      return null;
    }
  }

  function create() {
    setDefinitionError(null);
    const definition = parseDefinition();
    if (!definition) {
      setDefinitionError("Definition must be valid JSON");
      return;
    }
    startTransition(async () => {
      const res = await createWorkflowAction({
        name: name.trim(),
        trigger_type: trigger,
        definition: definition as never,
        status: "draft",
      });
      if (res.ok) {
        setOpen(false);
        setName("");
        router.refresh();
      }
    });
  }

  const tone: Record<WorkflowStatus, "secondary" | "success" | "warning" | "outline"> = {
    draft: "secondary",
    active: "success",
    paused: "warning",
    archived: "outline",
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Workflow Engine</h1>
          <p className="text-sm text-muted-foreground">
            Node-based automation: conditions, actions, delays, approvals and parallel branches (Phase A – Step 125).
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setOpen(true)}>
            New Workflow
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-semibold text-ink">Workflows</h2>
          {workflows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No workflows yet.
            </div>
          ) : (
            workflows.map((wf) => (
              <div key={wf.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{wf.name}</p>
                      <Badge variant={tone[wf.status]}>{wf.status}</Badge>
                      <span className="text-xs text-muted-foreground">{wf.trigger_type}</span>
                    </div>
                    {wf.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{wf.description}</p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      {wf.trigger_type === "manual" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            startTransition(async () => {
                              const res = await runWorkflowManuallyAction(wf.id);
                              if (res.ok) router.refresh();
                            })
                          }
                        >
                          Run now
                        </Button>
                      )}
                      {wf.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            startTransition(async () => {
                              const next: WorkflowStatus =
                                wf.status === "active" ? "paused" : "active";
                              const res = await toggleWorkflowAction(wf.id, next);
                              if (res.ok) router.refresh();
                            })
                          }
                        >
                          {wf.status === "active" ? "Pause" : "Activate"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteWorkflowAction(wf.id);
                            if (res.ok) router.refresh();
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-ink">Recent Runs</h2>
          <div className="space-y-2">
            {runs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No runs yet. Runs appear when active workflows fire.
              </div>
            ) : (
              runs.slice(0, 12).map((run) => (
                <div key={run.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{run.workflow_name}</p>
                    <Badge variant={runStatusTone(run.status)}>{run.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {run.trigger_event} · {run.subject_type} ·{" "}
                    {new Date(run.started_at).toLocaleString()}
                  </p>
                  {run.error_message && (
                    <p className="mt-1 text-xs text-[#b91c1c]">{run.error_message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
        Node types: <code>condition</code> (true/false branches), <code>action</code> (12 actions incl. task,
        assign, notify, webhook, AI analysis, email), <code>delay</code>, <code>wait_until</code>,{" "}
        <code>approval</code> (links to the approval engine), <code>parallel</code>, <code>end</code>. Loops are
        blocked per run unless <code>allow_loops</code> is enabled. Every event run is recorded in{" "}
        <code>workflow_runs</code>.
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wf-name">Name</Label>
              <Input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Route high-value leads" />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger</Label>
              <Select value={trigger} onValueChange={(v) => setTrigger(v as WorkflowTriggerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-def">Definition (JSON)</Label>
              <Textarea
                id="wf-def"
                value={definitionText}
                onChange={(e) => setDefinitionText(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
              {definitionError && <p className="text-xs text-[#b91c1c]">{definitionError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending || !name.trim()} onClick={create}>
              Create (draft)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function runStatusTone(status: WorkflowRunView["status"]): "warning" | "success" | "danger" | "secondary" {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    case "awaiting_approval":
      return "warning";
    case "running":
    case "waiting":
    case "partial":
      return "secondary";
    case "cancelled":
      return "secondary";
    default:
      return "secondary";
  }
}

export { WorkflowsClient };