"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface NewTaskData {
  title: string;
  due: string;
  priority: "high" | "medium" | "low";
  status?: "Open" | "Done";
  owner: string;
}

type OwnerLike = string | { name?: string; fullName?: string; email?: string };

function toOwnerName(value: OwnerLike | undefined): string {
  if (typeof value === "string") return value;
  return value?.name ?? value?.fullName ?? value?.email ?? "";
}

export function AddTaskDialog({ open, onOpenChange, owners, defaultOwner, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: OwnerLike[];
  defaultOwner?: string;
  onSubmit: (task: NewTaskData) => void;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<NewTaskData["priority"]>("medium");
  const [owner, setOwner] = useState<string>(defaultOwner ?? toOwnerName(owners[0]) ?? "");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), due, priority, owner: owner.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Create a follow-up task for this record.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="legacy-task-title" required>Title</Label>
            <Input id="legacy-task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="legacy-task-due">Due date</Label>
              <Input id="legacy-task-due" type="date" value={due} onChange={(event) => setDue(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as NewTaskData["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
              <SelectContent>
                {owners.map((candidate) => {
                  const value = typeof candidate === "string" ? candidate : candidate.name ?? candidate.fullName ?? candidate.email ?? "Unknown";
                  return <SelectItem key={value} value={value}>{value}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
