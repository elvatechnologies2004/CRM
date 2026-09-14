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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface NewActivityForm {
  kind: "meeting" | "task" | "call";
  title: string;
  date: string;
  time: string;
  duration: string;
}

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

interface NewActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: NewActivityForm) => void;
}

function NewActivityDialog({ open, onOpenChange, onSubmit }: NewActivityDialogProps) {
  const [form, setForm] = useState<NewActivityForm>({
    kind: "task",
    title: "",
    date: toDateInput(new Date()),
    time: "09:00",
    duration: "30",
  });
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({ kind: "task", title: "", date: toDateInput(new Date()), time: "09:00", duration: "30" });
      setError(null);
    }
  }

  const update = (patch: Partial<NewActivityForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError("Title is required.");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Activity</DialogTitle>
          <DialogDescription>Add a task, meeting or call to the calendar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { kind: "task", label: "Task" },
                { kind: "meeting", label: "Meeting" },
                { kind: "call", label: "Call" },
              ] as const
            ).map((option) => (
              <Button
                key={option.kind}
                size="sm"
                variant={form.kind === option.kind ? "secondary" : "outline"}
                className="h-9"
                onClick={() => update({ kind: option.kind })}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activity-title">
              Title <span className="text-danger">*</span>
            </Label>
            <Input
              id="activity-title"
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Send proposal / Discovery call"
              autoFocus
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="activity-date">Date</Label>
              <Input
                id="activity-date"
                type="date"
                value={form.date}
                onChange={(event) => update({ date: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-time">Time</Label>
              <Input
                id="activity-time"
                type="time"
                value={form.time}
                onChange={(event) => update({ time: event.target.value })}
              />
            </div>
          </div>

          {form.kind === "meeting" && (
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
                      {duration} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Add to Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { NewActivityDialog };