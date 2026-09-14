"use client";

import { useState } from "react";
import { Loader2, Rocket } from "lucide-react";

import { Alert, AlertDescription } from "@/components/crm/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBetaSignup } from "@/lib/beta/signup";

function BetaSignupForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", reason: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await submitBetaSignup(form);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Submission failed");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Rocket className="mx-auto h-8 w-8 text-primary" aria-hidden />
        <p className="mt-3 font-semibold text-ink">You&apos;re on the list!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you when beta access is ready.
        </p>
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
      <div className="space-y-2">
        <Label htmlFor="beta-name">Name</Label>
        <Input id="beta-name" name="name" required value={form.name} onChange={handleChange} placeholder="Jane Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="beta-email">Work email</Label>
        <Input id="beta-email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@company.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="beta-company">Company</Label>
        <Input id="beta-company" name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="beta-reason">What would you like to try?</Label>
        <Textarea id="beta-reason" name="reason" rows={4} value={form.reason} onChange={handleChange} placeholder="Tell us what you're building and what you want to test…" />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" aria-hidden />}
        {loading ? "Applying…" : "Request beta access"}
      </Button>
    </form>
  );
}

export { BetaSignupForm };