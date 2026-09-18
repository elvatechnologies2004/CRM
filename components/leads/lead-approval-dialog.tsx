"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeadApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  summary: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onApprove: () => void;
  onCancel?: () => void;
  showAi?: boolean;
  onAi?: () => Promise<void> | void;
  aiSummary?: string | null;
  aiLoading?: boolean;
}

export function LeadApprovalDialog({
  open,
  onOpenChange,
  title,
  description,
  summary,
  primaryLabel = "Approve",
  secondaryLabel = "Not now",
  onApprove,
  onCancel,
  showAi = false,
  onAi,
  aiSummary,
  aiLoading = false,
}: LeadApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
          <p className="font-medium text-ink">What will happen</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>

        {showAi && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={onAi ?? (() => undefined)} disabled={aiLoading}>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                {aiLoading ? "Analyzing..." : "Use AI"}
              </Button>
            </div>
            {aiSummary && (
              <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                {aiSummary}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              onCancel?.();
            }}
          >
            {secondaryLabel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onApprove();
            }}
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
