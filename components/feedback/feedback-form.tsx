"use client";

import { useState } from "react";
import { Bug, Lightbulb, Loader2, Wand2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/crm/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/beta/feedback";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "bug", label: "Bug report", icon: Bug },
  { value: "feedback", label: "Feedback", icon: Lightbulb },
  { value: "enhancement", label: "Feature request", icon: Wand2 },
] as const;

function FeedbackForm() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("feedback");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [page, setPage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await submitFeedback({ category, title, body, page: page || null });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Could not submit");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-semibold text-ink">Thanks — we&apos;ve received it</p>
        <p className="mt-1 text-sm text-muted-foreground">Your feedback is on the team&apos;s list.</p>
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CATEGORIES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              category === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-title">Title</Label>
        <Input id="feedback-title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-body">Details</Label>
        <Textarea id="feedback-body" required rows={5} minLength={10} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Steps, expectations, and what you saw…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-page">Where did this happen?</Label>
        <Input id="feedback-page" value={page} onChange={(e) => setPage(e.target.value)} placeholder="e.g. /pipeline" />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Sending…" : "Submit feedback"}
      </Button>
    </form>
  );
}

export { FeedbackForm };