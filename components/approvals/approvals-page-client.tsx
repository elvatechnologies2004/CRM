"use client";

import { useState, useTransition } from "react";

import { approveRequestAction, cancelRequestAction, rejectRequestAction } from "@/lib/approvals/actions";
import type { ApprovalPolicyRecord, ApprovalRequestView, ApprovalStepView } from "@/lib/approvals/engine";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";

interface ApprovalsPageClientProps {
  requests: ApprovalRequestView[];
  policies: ApprovalPolicyRecord[];
  canManage: boolean;
}

function ApprovalsPageClient({ requests, policies, canManage }: ApprovalsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"inbox" | "policies">("inbox");

  function act(
    requestId: string,
    action: "approve" | "reject" | "cancel",
  ) {
    startTransition(async () => {
      const c = comment[requestId];
      let res: { ok: boolean; status?: string } | { ok: boolean };
      if (action === "approve") res = await approveRequestAction(requestId, c || undefined);
      else if (action === "reject") res = await rejectRequestAction(requestId, c || undefined);
      else res = await cancelRequestAction(requestId);
      if (res.ok) {
        setComment((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Real approval engine — sequential, any-one, all-required, multiple and single (Phase A – Step 124).
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "inbox" ? "default" : "outline"}
          onClick={() => setTab("inbox")}
        >
          My Inbox ({requests.length})
        </Button>
        <Button
          size="sm"
          variant={tab === "policies" ? "default" : "outline"}
          onClick={() => setTab("policies")}
        >
          Policies ({policies.length})
        </Button>
      </div>

      {tab === "inbox" ? (
        requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No pending approvals in your inbox.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const myStep = req.steps.find((s) => s.can_act);
              return (
                <div key={req.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{req.subject_summary ?? req.subject}</p>
                        <Badge variant={req.status === "pending" ? "warning" : req.status === "approved" ? "success" : "danger"}>
                          {req.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {req.requester_name ?? req.requested_by} · {req.subject}
                        {req.subject_id ? ` / ${req.subject_id.slice(0, 8)}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  {req.steps.length > 0 && (
                    <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Approvers</p>
                      <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {req.steps.map((step) => (
                          <StepRow key={step.id} step={step} />
                        ))}
                      </div>
                    </div>
                  )}

                  {req.actions.length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {req.actions.map((a) => (
                        <span key={a.id} className="block truncate">
                          {a.user_name ?? a.user_id}: {a.action}
                          {a.comment ? ` — ${a.comment}` : ""}
                        </span>
                      ))}
                    </div>
                  )}

                  {req.status === "pending" && (myStep || canManage) && (
                    <div className="mt-4 flex items-center gap-2">
                      <Input
                        className="h-8 max-w-xs"
                        value={comment[req.id] ?? ""}
                        onChange={(e) => setComment((p) => ({ ...p, [req.id]: e.target.value }))}
                        placeholder="Comment (optional)"
                      />
                      <Button size="sm" onClick={() => act(req.id, "approve")} disabled={isPending}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => act(req.id, "reject")}
                        disabled={isPending}
                      >
                        Reject
                      </Button>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => act(req.id, "cancel")}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {policies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No approval policies configured yet.
            </div>
          ) : (
            policies.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{p.name}</p>
                  <Badge variant="info">{p.subject}</Badge>
                  <Badge variant="outline">{p.approval_type}</Badge>
                  <Badge variant={p.is_active ? "success" : "secondary"}>
                    {p.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {p.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Required approvers: {p.required_approvers} · Timeout: {p.timeout_hours}h
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StepRow({ step }: { step: ApprovalStepView }) {
  const tone: Record<string, "warning" | "success" | "danger" | "secondary"> = {
    waiting: "secondary",
    pending: "warning",
    approved: "success",
    rejected: "danger",
    skipped: "secondary",
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink">{step.approver_name ?? step.approver_user_id ?? step.approver_role_key ?? "—"}</span>
      <Badge variant={tone[step.status] ?? "secondary"}>
        {step.status}
        {step.comment ? ` · ${step.comment}` : ""}
      </Badge>
    </div>
  );
}

export { ApprovalsPageClient };