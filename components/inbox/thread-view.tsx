"use client";

import { useState } from "react";

import { CheckCheck, FileText, Send, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { emailTemplates } from "@/lib/mock-inbox";
import { toDayLabel, toShortTime } from "@/lib/date-utils";
import type { Conversation, ThreadMessage } from "@/lib/types";

interface ThreadViewProps {
  conversation: Conversation;
  messages: ThreadMessage[];
  owners: string[];
  onSend: (content: string) => void;
  onAssign: (ownerName: string) => void;
  onToggleStatus: () => void;
  onAiDraft: (templateName: string) => void;
}

function ThreadView({
  conversation,
  messages,
  owners,
  onSend,
  onAssign,
  onToggleStatus,
  onAiDraft,
}: ThreadViewProps) {
  const [draft, setDraft] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>("all");

  const insertTemplate = (templateId: string) => {
    const template = emailTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setDraft((prev) => (prev ? `${prev}\n\n${template.body}` : template.body));
  };

  const categories = ["all", ...Array.from(new Set(emailTemplates.map((t) => t.category)))];
  const filteredTemplates =
    templateCategory === "all"
      ? emailTemplates
      : emailTemplates.filter((t) => t.category === templateCategory);

  const grouped = messages.reduce<Record<string, ThreadMessage[]>>((acc, message) => {
    const key = toDayLabel(message.sentAt);
    (acc[key] = acc[key] ?? []).push(message);
    return acc;
  }, {});

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{conversation.contactName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.companyName}
            {conversation.subject ? ` · ${conversation.subject}` : ""}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {conversation.openDealValue !== undefined && (
            <Badge variant="success" className="text-[11px]">
              ${conversation.openDealValue.toLocaleString()} in open deals
            </Badge>
          )}
          <Select value={conversation.assignedToName ?? ""} onValueChange={onAssign}>
            <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Assign owner">
              <SelectValue placeholder="Assign to" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={conversation.status === "closed" ? "secondary" : "outline"}
            className="h-8 text-xs"
            onClick={onToggleStatus}
          >
            {conversation.status === "closed" ? "Reopen" : "Mark closed"}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {Object.entries(grouped).map(([day, dayMessages]) => (
          <div key={day}>
            <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {day}
            </p>
            <div className="space-y-2.5">
              {dayMessages.map((message) => {
                const outbound = message.direction === "out";
                return (
                  <div key={message.id} className="flex flex-col gap-1">
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                        outbound
                          ? "self-end rounded-br-md bg-primary text-white"
                          : "self-start rounded-bl-md bg-muted/70 text-ink"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[11px] text-muted-foreground",
                        outbound ? "self-end" : "self-start"
                      )}
                    >
                      <span>{toShortTime(message.sentAt)}</span>
                      {outbound && <CheckCheck className="h-3 w-3" aria-hidden />}
                      <span>{message.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No messages yet in this thread.</p>
        )}
      </div>

      <div className="border-t border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => setShowTemplates((prev) => !prev)}
          >
            <FileText className="mr-1.5 h-4 w-4" /> Insert template
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => onAiDraft("Email Templates")}
          >
            <Sparkles className="mr-1.5 h-4 w-4 text-primary" /> AI draft reply
          </Button>
          <div className="ml-auto flex items-center gap-1.5">
            <Select value={templateCategory} onValueChange={setTemplateCategory}>
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Template category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showTemplates && (
          <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-border bg-card p-1.5">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => insertTemplate(template.id)}
                className="w-full rounded-md px-2.5 py-1.5 text-left hover:bg-muted/60"
              >
                <p className="text-xs font-medium text-ink">{template.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{template.subject}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            className="min-h-0 flex-1 resize-none rounded-xl bg-card"
            placeholder={`Reply to ${conversation.contactName}...`}
          />
          <Button
            className="h-9 gap-1.5"
            disabled={draft.trim().length === 0}
            onClick={() => {
              onSend(draft.trim());
              setDraft("");
            }}
          >
            <Send className="h-4 w-4" aria-hidden /> Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ThreadView };