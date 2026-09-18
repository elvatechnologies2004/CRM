"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ScheduleMeetingForm {
  title: string;
  meetingType: "Discovery" | "Product Demo" | "Follow-up" | "Negotiation" | "Contract Signing" | "Internal" | "Kickoff" | "Check-in";
  date: string;
  time: string;
  duration: string;
  ownerName: string;
  notes?: string;
}

export function ScheduleMeetingDialog({ open, onOpenChange, owners, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; owners: string[]; onSubmit: (form: ScheduleMeetingForm) => boolean }) {
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState<ScheduleMeetingForm["meetingType"]>("Discovery");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [ownerName, setOwnerName] = useState(owners[0] ?? "");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    const ok = onSubmit({ title: title.trim(), meetingType, date, time, duration, ownerName, notes: notes.trim() || undefined });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule meeting</DialogTitle>
          <DialogDescription>Create a new meeting for the team.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-title">Title</Label>
            <Input id="schedule-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={meetingType} onValueChange={(value) => setMeetingType(value as ScheduleMeetingForm["meetingType"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[
                    "Discovery",
                    "Product Demo",
                    "Follow-up",
                    "Negotiation",
                    "Contract Signing",
                    "Internal",
                    "Kickoff",
                    "Check-in",
                  ].map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={ownerName} onValueChange={setOwnerName}>
                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-date">Date</Label>
              <Input id="schedule-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schedule-time">Time</Label>
              <Input id="schedule-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schedule-duration">Duration</Label>
              <Input id="schedule-duration" value={duration} onChange={(event) => setDuration(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-notes">Notes</Label>
            <Textarea id="schedule-notes" value={notes} rows={3} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save meeting</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
