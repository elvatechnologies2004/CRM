"use client";

import * as React from "react";
import { useCallback, useTransition } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { saveOrgControl } from "./actions";
import {
  BLOCKABLE_FEATURES,
  type BlockableFeatureKey,
  type OrgControlStatus,
} from "@/lib/admin/controls-shared";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: OrgControlStatus; label: string; hint: string }[] = [
  { value: "active", label: "Active", hint: "All permitted features enabled" },
  { value: "restricted", label: "Restricted", hint: "Blocked features are disabled" },
  { value: "suspended", label: "Suspended", hint: "Organization fully blocked" },
];

export function OrgControlEditor({
  organizationId,
  organizationName,
  initial,
  disabled,
}: {
  organizationId: string;
  organizationName?: string | null;
  initial?: {
    status: OrgControlStatus;
    blockedFeatures: BlockableFeatureKey[];
    reason: string | null;
  };
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [status, setStatus] = React.useState<OrgControlStatus>(initial?.status ?? "active");
  const [blocked, setBlocked] = React.useState<Set<BlockableFeatureKey>>(
    new Set(initial?.blockedFeatures ?? []),
  );
  const [reason, setReason] = React.useState(initial?.reason ?? "");

  const toggleFeature = useCallback((key: BlockableFeatureKey, checked: boolean) => {
    setBlocked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const onSave = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await saveOrgControl({
        organizationId,
        status,
        blockedFeatures: [...blocked],
        reason: reason.trim() || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Controls
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Organization Controls</DialogTitle>
          <DialogDescription>
            {organizationName ?? "Organization"} — block features or restrict access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">Status</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    status === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/40",
                  )}
                >
                  <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">Blocked features</p>
            <div className="grid gap-2">
              {BLOCKABLE_FEATURES.map((feature) => (
                <label
                  key={feature.key}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <Checkbox
                    checked={blocked.has(feature.key)}
                    disabled={status === "suspended"}
                    onCheckedChange={(checked) =>
                      toggleFeature(feature.key, checked === true)
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      {feature.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {feature.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium text-ink">
              Reason <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. overdue invoice — restricted until payment"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {success ? (
            <p className="flex items-center gap-1 text-xs text-emerald-600">Saved.</p>
          ) : null}
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={onSave} disabled={pending} className="gap-1.5">
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            Save controls
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}