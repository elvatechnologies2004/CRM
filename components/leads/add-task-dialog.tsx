"use client";

import * as React from "react";
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
import type { TaskPriority, User } from "@/lib/types";

export interface NewTaskData {
  title: string;
  due: string;
  priority: TaskPriority;
  owner: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: User[];
  defaultOwner?: string;
  onSubmit: (task: NewTaskData) => void;
}

function AddTaskDialog({
  open,
  onOpenChange,
  owners,
  defaultOwner = "",
  onSubmit,
}: AddTaskDialogProps) {
  const [form, setForm] = useState<NewTaskData>({
    title: "",
    due: getDefaultDue(),
    priority: "medium",
    owner: defaultOwner,
  });
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({ title: "", due: getDefaultDue(), priority: "medium", owner: defaultOwner });
      setError(null);
    }
  }

  const update = (patch: Partial<NewTaskData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError("Task title is required.");
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
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>
            Create a task to keep follow-up moving forward.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">
              Task title <span className="text-danger">*</span>
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
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={form.due}
                onChange={(event) => update({ due: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => update({ priority: value as TaskPriority })}
              >
                <SelectTrigger aria-label="Task priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select
              value={form.owner}
              onValueChange={(value) => update({ owner: value })}
            >
              <SelectTrigger aria-label="Task owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.name}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultDue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export { AddTaskDialog };