"use client";

import { useState } from "react";
import {
  Bot,
  MessageCircle,
  Mic,
  Paperclip,
  Send,
  SmilePlus,
  Sparkles,
} from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { LeadWhatsAppMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const messageTemplates = [
  {
    label: "Follow-up",
    text: "Hi, following up on our last conversation — happy to answer any questions you have.",
  },
  {
    label: "Walkthrough invite",
    text: "Would you be open to a 20-minute walkthrough this week? I can show you how it works.",
  },
  {
    label: "Pricing overview",
    text: "Here is a quick pricing overview of the plans we discussed. Let me know which fits best.",
  },
];

interface LeadWhatsAppProps {
  messages: LeadWhatsAppMessage[];
  onSend: (text: string, attachment?: string) => void;
}

function LeadWhatsApp({ messages, onSend }: LeadWhatsAppProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const handleSend = () => {
    if (!draft.trim()) {
      setError("Type a message to send.");
      return;
    }
    setError(null);
    onSend(draft.trim());
    setDraft("");
  };

  const sendAttachment = () => {
    onSend("I sent you a document — let me know what you think.", "proposal-v2.pdf");
    setDraft("");
    setError(null);
  };

  const replyWithAI = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setGenerating(false);
      onSend(
        "Hi, thanks for getting back! I can share more details about the plan that fits your goals and set up a quick walkthrough."
      );
    }, 800);
  };

  const insertTemplate = (text: string) => {
    setDraft((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text));
    setError(null);
  };

  const sendVoiceNote = () => {
    onSend("Voice message · 0:24", "voice-note-0-24.m4a");
    setError(null);
  };

  return (
    <Card className="flex h-[560px] flex-col shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <MessageCircle className="h-4 w-4" aria-hidden />
          </span>
          WhatsApp
        </CardTitle>
        {generating && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-purple" aria-hidden />
            AI is thinking…
          </span>
        )}
      </CardHeader>

      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="h-5 w-5 text-muted-foreground/60" aria-hidden />
            <p className="text-sm font-medium text-ink">Start the conversation</p>
            <p className="max-w-[240px] text-xs text-muted-foreground">
              Send a warm introduction or use the AI reply to draft the first message.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          )))}
      </div>

      {error && <p className="px-4 pb-1 text-xs text-danger">{error}</p>}

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={sendAttachment}
            aria-label="Attach file"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
          >
            <Paperclip className="h-4 w-4" aria-hidden />
          </button>
          <Input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            className="h-10"
            aria-label="WhatsApp message"
          />
          <DropdownMenu open={templateOpen} onOpenChange={setTemplateOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Choose template"
                className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-ink sm:block"
              >
                <SmilePlus className="h-4 w-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Templates
              </p>
              {messageTemplates.map((template) => (
                <DropdownMenuItem
                  key={template.label}
                  onSelect={() => insertTemplate(template.text)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {template.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {template.text}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={sendVoiceNote}
            aria-label="Voice message"
            className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-ink sm:block"
          >
            <Mic className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={replyWithAI}
            aria-label="Reply with AI"
            disabled={generating}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-brand-purple/30 bg-brand-purple/10 px-2.5 text-[13px] font-medium text-[#6d28d9] transition-colors hover:bg-brand-purple/20 disabled:opacity-50"
          >
            <Bot className="h-4 w-4" aria-hidden />
            <span className="hidden lg:inline">AI Reply</span>
          </button>
          <button
            type="button"
            onClick={handleSend}
            aria-label="Send message"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({
  message,
}: {
  message: LeadWhatsAppMessage;
}) {
  const isCustomer = message.from === "customer";
  return (
    <div className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]",
          isCustomer
            ? "rounded-bl-sm border border-border bg-card text-ink"
            : "rounded-br-sm bg-primary/90 text-primary-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        {message.attachment && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-white/20 px-2 py-1 text-xs font-medium">
            <Paperclip className="h-3 w-3" aria-hidden />
            {message.attachment}
          </p>
        )}
        <p
          className={cn(
            "mt-1 text-right text-[10px] tabular-nums",
            isCustomer ? "text-muted-foreground" : "text-primary-foreground/70"
          )}
        >
          {formatTime(message.time)}
        </p>
      </div>
    </div>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

export { LeadWhatsApp };