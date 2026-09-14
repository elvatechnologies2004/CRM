"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FeatureRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

const categories = ["Leads", "Deals", "Inbox", "Automation", "AI", "Reports", "Settings", "Other"];
const priorities = [
  { label: "Nice to Have", value: "Nice to Have" },
  { label: "Important", value: "Important" },
  { label: "Critical", value: "Critical" },
];

export function FeatureRequestDialog({ open, onClose }: FeatureRequestDialogProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Leads" as string,
    priority: "Nice to Have" as string,
  });

  const handleSubmit = () => {
    alert("Feature request submitted successfully.\nReference: FR-2024-001");
    setForm({ title: "", description: "", category: "Leads", priority: "Nice to Have" });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-ink mb-2">Request a Feature</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tell us what you&apos;d like to see, and our product team will review your request.
        </p>
        <div className="space-y-4">
          <Input
            placeholder="Feature Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            placeholder="Describe the feature and the problem it solves *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.category}
              onValueChange={(val) => setForm({ ...form, category: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Category *" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.priority}
              onValueChange={(val) => setForm({ ...form, priority: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Priority *" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Request</Button>
        </div>
      </div>
    </div>
  );
}