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
import {
  taskPriorities,
  taskStatuses,
  taskTypes,
} from "@/lib/mock-tasks";
import type { CrmTask, RelatedRecordType, TaskStatus } from "@/lib/types";

export interface TaskFormValues {
  title: string;
  description?: string;
  type: CrmTask["type"];
  priority: CrmTask["priority"];
  status: TaskStatus;
  ownerName: string;
  dueDate: string;
  dueTime?: string;
  relatedType: RelatedRecordType;
  relatedName?: string;
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function dayInputToDue(input: string): string {
  return `${input}T09:00:00.000Z`;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: string[];
  initial?: CrmTask | null;
  onSubmit: (form: TaskFormValues) => void;
}

const relatedTypes: RelatedRecordType[] = ["Lead", "Contact", "Company", "Deal"];

function AddTaskDialog({ open, onOpenChange, owners, initial, onSubmit }: AddTaskDialogProps) {
  const [form, setForm] = useState<TaskFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "Follow-up",
    priority: initial?.priority ?? "Medium",
    status: initial?.status ?? "Open",
    ownerName: initial?.ownerName ?? owners[0] ?? "",
    dueDate: toDateInput(initial?.dueDate ?? new Date().toISOString()),
    dueTime: initial?.dueTime ?? "",
    relatedType: initial?.relatedType ?? "Lead",
    relatedName: initial?.relatedName ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        type: initial?.type ?? "Follow-up",
        priority: initial?.priority ?? "Medium",
        status: initial?.status ?? "Open",
        ownerName: initial?.ownerName ?? owners[0] ?? "",
        dueDate: toDateInput(initial?.dueDate ?? new Date().toISOString()),
        dueTime: initial?.dueTime ?? "",
        relatedType: initial?.relatedType ?? "Lead",
        relatedName: initial?.relatedName ?? "",
      });
      setError(null);
    }
  }

  const update = (patch: Partial<TaskFormValues>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }
    setError(null);
    onSubmit({ ...form, title: form.title.trim(), dueDate: dayInputToDue(form.dueDate) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            Plan a sales activity and link it to a record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">
              Title <span className="text-danger">*</span>
            </Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Send formal proposal"
              autoFocus
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => update({ type: value as CrmTask["type"] })}>
                <SelectTrigger aria-label="Task type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => update({ priority: value as CrmTask["priority"] })}
              >
                <SelectTrigger aria-label="Task priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskPriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
              placeholder="Short description of the activity..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update({ status: value as TaskStatus })}
              >
                <SelectTrigger aria-label="Task status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select
                value={form.ownerName}
                onValueChange={(value) => update({ ownerName: value })}
              >
                <SelectTrigger aria-label="Task owner">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={form.dueDate}
                onChange={(event) => update({ dueDate: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-time">Time</Label>
              <Input
                id="task-time"
                type="time"
                value={form.dueTime ?? ""}
                onChange={(event) => update({ dueTime: event.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Related record</Label>
              <Select
                value={form.relatedType}
                onValueChange={(value) => update({ relatedType: value as RelatedRecordType })}
              >
                <SelectTrigger aria-label="Related record type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relatedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-related-name">Related record name</Label>
              <Input
                id="task-related-name"
                value={form.relatedName ?? ""}
                onChange={(event) => update({ relatedName: event.target.value })}
                placeholder="Ahmed Khan"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {initial ? "Save Task" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AddTaskDialog };