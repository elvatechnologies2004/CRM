"use client";

import { useState } from "react";
import { Mail, MailOpen, PenLine, Send, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LeadEmail } from "@/lib/types";

interface LeadEmailsProps {
  emails: LeadEmail[];
  authorEmail: string;
  recipient: string;
  onSend: (subject: string, body: string) => void;
}

function LeadEmails({ emails, authorEmail, recipient, onSend }: LeadEmailsProps) {
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "" });
  const [error, setError] = useState<string | null>(null);

  const sorted = [...emails].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const handleSend = () => {
    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!form.body.trim()) {
      setError("Email body is required.");
      return;
    }
    setError(null);
    onSend(form.subject.trim(), form.body.trim());
    setForm({ subject: "", body: "" });
    setComposing(false);
  };

  const draftWithAI = () => {
    setForm((prev) => ({
      ...prev,
      body:
        "Hi there,\n\nFollowing up on our recent conversation — I wanted to share how we can help with your goals. Would you be open to a short call this week?\n\nBest regards,\n" +
        authorEmail,
    }));
  };

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
          Emails
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {emails.length}
          </span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setComposing((prev) => !prev)}>
          <PenLine className="h-3.5 w-3.5" aria-hidden />
          Compose
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {composing && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2.5 text-[13px] font-medium text-ink">New email</p>
            <div className="space-y-2">
              <Input
                value={recipient}
                readOnly
                disabled
                className="text-xs text-muted-foreground"
                aria-label="Recipient"
              />
              <Input
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Subject"
                aria-label="Email subject"
              />
              <Textarea
                rows={6}
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                placeholder="Write your message…"
                aria-label="Email body"
              />
            </div>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            <div className="mt-2.5 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={draftWithAI}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Draft with AI
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSend}>
                <Send className="h-3.5 w-3.5" aria-hidden />
                Send
              </Button>
            </div>
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <Mail className="h-4 w-4 text-muted-foreground/60" aria-hidden />
            <p className="text-xs text-muted-foreground">
              No emails yet. Compose the first message to start the conversation.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((email) => {
              const unreadIn = email.direction === "in" && !email.opened;
              return (
                <li key={email.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {email.direction === "in" ? (
                        unreadIn ? (
                          <Mail className="h-4 w-4 text-primary" aria-hidden />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground" aria-hidden />
                        )
                      ) : (
                        <Send className="h-4 w-4 text-brand-purple" aria-hidden />
                      )}
                      <p className="text-[13px] font-medium text-ink">{email.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={email.direction === "in" ? "secondary" : "purple"}>
                        {email.direction === "in" ? "Inbound" : "Outbound"}
                      </Badge>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatWhen(email.date)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    <span className="font-medium">{email.direction === "in" ? email.from : `to: ${email.to}`}</span>
                  </p>
                  {unreadIn && (
                    <p className="mt-1 text-[11px] font-medium text-primary">Unread</p>
                  )}
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/40 p-2.5 text-[13px] leading-relaxed text-muted-foreground">
                    {email.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export { LeadEmails };