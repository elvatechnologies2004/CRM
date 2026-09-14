"use client";

import { Mail, MessageCircle, MessageSquareText, Phone, Search, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { inboxChannels } from "@/lib/mock-inbox";
import type { Conversation, InboxChannel } from "@/lib/types";

const channelIcons: Record<InboxChannel, LucideIcon> = {
  Email: Mail,
  WhatsApp: MessageCircle,
  SMS: MessageSquareText,
  Call: Phone,
};

const channelClass: Record<InboxChannel, string> = {
  Email: "bg-primary/10 text-primary",
  WhatsApp: "bg-green-500/10 text-green-600",
  SMS: "bg-blue-500/10 text-blue-600",
  Call: "bg-amber-500/10 text-amber-700",
};

export type ChannelFilter = "All" | InboxChannel;

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conversation: Conversation) => void;
  channel: ChannelFilter;
  onChannelChange: (channel: ChannelFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  statusFilter: "all" | Conversation["status"];
  onStatusChange: (status: "all" | Conversation["status"]) => void;
}

function timeLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  channel,
  onChannelChange,
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
}: ConversationListProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search inbox..."
            className="h-9 pl-9"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChannelChange("All")}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              channel === "All" ? "bg-ink text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            All
          </button>
            {inboxChannels.map((ch) => {
              const ChIcon = channelIcons[ch as InboxChannel];
              return (
              <button
                key={ch}
                type="button"
                onClick={() => onChannelChange(ch as ChannelFilter)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  channel === ch ? "bg-ink text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                <ChIcon className="h-3.5 w-3.5" />
                {ch}
              </button>
              );
            })}
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusChange(value as typeof statusFilter)}
          >
            <SelectTrigger className="ml-auto h-8 w-auto gap-1 text-xs" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
        {conversations.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No conversations match your filters.
          </p>
        )}
        {conversations.map((conversation) => {
          const Icon = channelIcons[conversation.channel];
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation)}
              className={cn(
                "flex w-full items-start gap-2.5 border-b border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                activeId === conversation.id && "bg-accent/60"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  channelClass[conversation.channel]
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-ink">
                    {conversation.contactName}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {timeLabel(conversation.lastMessageAt)}
                  </span>
                </span>
                <span className="mt-0.75 block max-w-[220px] truncate text-xs text-muted-foreground">
                  {conversation.preview}
                </span>
                <span className="mt-1 flex items-center gap-1">
                  {conversation.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                      {tag}
                    </Badge>
                  ))}
                  {conversation.openDeals.length > 0 && (
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {conversation.openDeals.length} deal
                      {conversation.openDeals.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ConversationList, timeLabel };