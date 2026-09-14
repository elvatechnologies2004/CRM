"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ReportProblemDialogProps {
  open: boolean;
  onClose: () => void;
}

const severities = [
  { label: "Minor", value: "Minor" },
  { label: "Moderate", value: "Moderate" },
  { label: "Major", value: "Major" },
  { label: "Critical", value: "Critical" },
];

export function ReportProblemDialog({ open, onClose }: ReportProblemDialogProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    pageFeature: "Leads" as string,
    severity: "Moderate" as string,
  });

  const handleSubmit = () => {
    alert("Problem report submitted successfully.\nReference: SUP-1025");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-ink mb-2">Report a Problem</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Help us improve the CRM by reporting any issues you encounter.
        </p>
        <div className="space-y-4">
          <Input
            placeholder="Problem Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            placeholder="Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.pageFeature}
              onValueChange={(val) => setForm({ ...form, pageFeature: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Page / Feature *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Leads">Leads</SelectItem>
                <SelectItem value="Deals">Deals</SelectItem>
                <SelectItem value="Inbox">Inbox</SelectItem>
                <SelectItem value="Automation">Automation</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="Reports">Reports</SelectItem>
                <SelectItem value="Settings">Settings</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.severity}
              onValueChange={(val) => setForm({ ...form, severity: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Severity *" />
              </SelectTrigger>
              <SelectContent>
                {severities.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3">
            <label className="cursor-pointer text-sm text-muted-foreground">
              <input type="file" accept="image/*, .pdf" className="hidden" />
              Attach Screenshot / File
            </label>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Report</Button>
        </div>
      </div>
    </div>
  );
}