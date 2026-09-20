"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/crm/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm } from "@/lib/contact";

const TEAM_SIZES = ["1–5", "6–20", "21–50", "51–200", "200+"];

function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const res = await submitContactForm({
      name: form.name,
      email: form.email,
      company: form.company,
      teamSize: form.teamSize,
      subject: form.subject,
      message: form.message,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Submission failed");
      return;
    }
    setSuccess(true);
    setForm({ name: "", email: "", company: "", teamSize: "", subject: "", message: "" });
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-semibold text-ink">Message sent</p>
        <p className="mt-1 text-sm text-muted-foreground">Thanks for reaching out — we&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      {error ? (
        <Alert tone="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name" required>Name</Label>
          <Input id="contact-name" name="name" required value={form.name} onChange={handleChange} placeholder="Jane Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email" required>Email</Label>
          <Input id="contact-email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@company.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-company">Company</Label>
          <Input id="contact-company" name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-team-size">Team size</Label>
          <select
            id="contact-team-size"
            name="teamSize"
            value={form.teamSize}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {TEAM_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input id="contact-subject" name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message" required>Message</Label>
        <Textarea id="contact-message" name="message" required rows={5} value={form.message} onChange={handleChange} placeholder="Tell us a bit more…" />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Sending…" : "Send message"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Protected against automated spam. We never use your message for marketing without consent.
      </p>
    </form>
  );
}

export { ContactForm };