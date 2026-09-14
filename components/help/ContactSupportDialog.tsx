"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ContactSupportDialogProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  "Technical Issue",
  "Account",
  "CRM Setup",
  "Sales Module",
  "Automation",
  "AI",
  "Billing",
  "Integration",
  "Other",
];

const priorities = [
  { label: "Low", value: "Low" },
  { label: "Normal", value: "Normal" },
  { label: "High", value: "High" },
  { label: "Urgent", value: "Urgent" },
];

export function ContactSupportDialog({ open, onClose }: ContactSupportDialogProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "Technical Issue" as string,
    priority: "Normal" as string,
    message: "",
  });

  const handleSubmit = () => {
    alert("Support request submitted successfully.\nReference: SUP-1024");
    setForm({
      name: "",
      email: "",
      subject: "",
      category: "Technical Issue",
      priority: "Normal",
      message: "",
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-ink mb-2">Contact Support</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Our support team can help with technical issues, setup, or product questions.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <Input
            placeholder="Subject *"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
          <Textarea
            placeholder="Message *"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={4}
            required
          />
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
          <Button onClick={handleSubmit}>Submit Request</Button>
        </div>
      </div>
    </div>
  );
}