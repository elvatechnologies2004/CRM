"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const unqualifiedReasons = [
  "Budget",
  "No Response",
  "Not Interested",
  "Competitor",
  "Wrong Fit",
  "Duplicate",
  "Other",
] as const;

interface UnqualifiedReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  busy?: boolean;
  onConfirm: (reason: string, notes: string) => void;
}

function UnqualifiedReasonDialog({
  open,
  onOpenChange,
  leadName,
  busy = false,
  onConfirm,
}: UnqualifiedReasonDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setReason("");
      setNotes("");
    }
  }

  const canConfirm = reason.trim().length > 0 && !busy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Why is this lead unqualified?</DialogTitle>
          <DialogDescription>
            {leadName ? `${leadName} will be marked as Unqualified.` : "Mark this lead as Unqualified."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Reason <span className="text-danger">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger aria-label="Unqualified reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {unqualifiedReasons.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unqualified-notes">Notes (optional)</Label>
            <Textarea
              id="unqualified-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any context…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm(reason, notes)}
            disabled={!canConfirm}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Mark Unqualified
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { UnqualifiedReasonDialog };
