"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CallDirection } from "@/lib/types";

export interface LogCallForm {
  contactName: string;
  companyName: string;
  direction: CallDirection;
  ownerName: string;
  date: string;
  time: string;
  durationMinutes: string;
  notes?: string;
}

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toTimeInput = (date: Date) => {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

interface LogCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: string[];
  onSubmit: (form: LogCallForm) => void;
}

function LogCallDialog({ open, onOpenChange, owners, onSubmit }: LogCallDialogProps) {
  const [form, setForm] = useState<LogCallForm>({
    contactName: "",
    companyName: "",
    direction: "Outbound",
    ownerName: owners[0] ?? "",
    date: toDateInput(new Date()),
    time: toTimeInput(new Date()),
    durationMinutes: "5",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({
        contactName: "",
        companyName: "",
        direction: "Outbound",
        ownerName: owners[0] ?? "",
        date: toDateInput(new Date()),
        time: toTimeInput(new Date()),
        durationMinutes: "5",
        notes: "",
      });
      setError(null);
    }
  }

  const update = (patch: Partial<LogCallForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!form.contactName.trim()) {
      setError("Contact name is required.");
      return;
    }
    setError(null);
    onSubmit({ ...form, contactName: form.contactName.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a Call</DialogTitle>
          <DialogDescription>Record a call with a contact and its outcome.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="call-contact">
              Contact name <span className="text-danger">*</span>
            </Label>
            <Input
              id="call-contact"
              value={form.contactName}
              onChange={(event) => update({ contactName: event.target.value })}
              placeholder="Ahmed Khan"
              autoFocus
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="call-company">Company</Label>
              <Input
                id="call-company"
                value={form.companyName}
                onChange={(event) => update({ companyName: event.target.value })}
                placeholder="Techno Solutions"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select
                value={form.direction}
                onValueChange={(value) => update({ direction: value as CallDirection })}
              >
                <SelectTrigger aria-label="Direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Outbound">Outbound</SelectItem>
                  <SelectItem value="Inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select
                value={form.ownerName}
                onValueChange={(value) => update({ ownerName: value })}
              >
                <SelectTrigger aria-label="Owner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="call-duration">Duration (min)</Label>
              <Input
                id="call-duration"
                type="number"
                min={0}
                value={form.durationMinutes}
                onChange={(event) => update({ durationMinutes: event.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="call-date">Date</Label>
              <Input
                id="call-date"
                type="date"
                value={form.date}
                onChange={(event) => update({ date: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="call-time">Time</Label>
              <Input
                id="call-time"
                type="time"
                value={form.time}
                onChange={(event) => update({ time: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="call-notes">Notes</Label>
            <Textarea
              id="call-notes"
              value={form.notes ?? ""}
              onChange={(event) => update({ notes: event.target.value })}
              rows={2}
              placeholder="Summary of the call..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Log Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { LogCallDialog };