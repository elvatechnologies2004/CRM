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
import { meetingTypes } from "@/lib/mock-meetings";
import type { MeetingType } from "@/lib/types";

export interface ScheduleMeetingForm {
  title: string;
  meetingType: MeetingType;
  date: string;
  time: string;
  duration: string;
  ownerName: string;
  notes?: string;
}

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: string[];
  onSubmit: (form: ScheduleMeetingForm) => void;
}

function ScheduleMeetingDialog({ open, onOpenChange, owners, onSubmit }: ScheduleMeetingDialogProps) {
  const [form, setForm] = useState<ScheduleMeetingForm>({
    title: "",
    meetingType: "Discovery",
    date: toDateInput(new Date()),
    time: "10:00",
    duration: "30",
    ownerName: owners[0] ?? "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({
        title: "",
        meetingType: "Discovery",
        date: toDateInput(new Date()),
        time: "10:00",
        duration: "30",
        ownerName: owners[0] ?? "",
        notes: "",
      });
      setError(null);
    }
  }

  const update = (patch: Partial<ScheduleMeetingForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError("Meeting title is required.");
      return;
    }
    if (!form.date) {
      setError("Pick a date.");
      return;
    }
    setError(null);
    onSubmit({ ...form, title: form.title.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>Plan an external or internal meeting.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-title">
              Meeting title <span className="text-danger">*</span>
            </Label>
            <Input
              id="meeting-title"
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Discovery call — Ahmed & Co"
              autoFocus
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.meetingType}
                onValueChange={(value) => update({ meetingType: value as MeetingType })}
              >
                <SelectTrigger aria-label="Meeting type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="meeting-date">Date</Label>
              <Input
                id="meeting-date"
                type="date"
                value={form.date}
                onChange={(event) => update({ date: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-time">Time</Label>
              <Input
                id="meeting-time"
                type="time"
                value={form.time}
                onChange={(event) => update({ time: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select
                value={form.duration}
                onValueChange={(value) => update({ duration: value })}
              >
                <SelectTrigger aria-label="Duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["15", "30", "45", "60", "90"].map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-notes">Notes / agenda</Label>
            <Textarea
              id="meeting-notes"
              value={form.notes ?? ""}
              onChange={(event) => update({ notes: event.target.value })}
              rows={2}
              placeholder="Discuss requirements and next steps..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ScheduleMeetingDialog };