"use client";

import { useEffect, useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/crm/toast";
import { ModuleHeader } from "@/components/crm/module-header";
import { StatGrid } from "@/components/crm/stat-grid";
import { ConversationList, type ChannelFilter } from "@/components/inbox/conversation-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { readStoredConversations, upsertConversation, uid, appendThreadMessage } from "@/lib/inbox-local";
import { getThread, emailTemplates } from "@/lib/mock-inbox";
import { leadOwners } from "@/lib/mock-leads";
import type { Conversation, InboxChannel, ThreadMessage } from "@/lib/types";

const channelMap: Record<string, InboxChannel> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  call: "Call",
};

const ownerNames = leadOwners.map((owner) => owner.name);

interface InboxPageClientProps {
  initialConversations: Conversation[];
  initialChannel?: string;
}

function InboxSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-60" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-[76px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-[520px]" />
      </div>
    </div>
  );
}

function InboxPageClient({ initialConversations, initialChannel }: InboxPageClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [channel, setChannel] = useState<ChannelFilter>(
    initialChannel ? channelMap[initialChannel] ?? "All" : "All"
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Conversation["status"]>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [threadMap, setThreadMap] = useState<Record<string, ThreadMessage[]>>(() => {
    const map: Record<string, ThreadMessage[]> = {};
    initialConversations.forEach((c) => {
      map[c.id] = getThread(c.id);
    });
    return map;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readStoredConversations();
      const merged = [...stored, ...initialConversations.filter((c) => !stored.some((s) => s.id === c.id))];
      setConversations(merged);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialConversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const activeMessages = useMemo(() => {
    if (!activeId) return [];
    return [...(threadMap[activeId] ?? [])].sort(
      (a, b) => +new Date(a.sentAt) - +new Date(b.sentAt)
    );
  }, [threadMap, activeId]);

  const filtered = useMemo(() => {
    let result = [...conversations];
    if (channel !== "All") result = result.filter((c) => c.channel === channel);
    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.contactName.toLowerCase().includes(q) ||
          (c.companyName?.toLowerCase().includes(q) || "") ||
          c.preview.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  }, [conversations, channel, statusFilter, query]);

  const stats = useMemo(() => {
    const open = conversations.filter((c) => c.status === "open");
    return {
      open: open.length,
      pending: conversations.filter((c) => c.status === "pending").length,
      unread: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    };
  }, [conversations]);

  const selectConversation = (conversation: Conversation) => {
    setActiveId(conversation.id);
    if (conversation.unreadCount > 0) {
      const updated = { ...conversation, unreadCount: 0 };
      upsertConversation(updated);
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
  };

  const handleSend = (content: string) => {
    if (!activeId) return;
    const message: ThreadMessage = {
      id: uid("tm"),
      conversationId: activeId,
      direction: "out",
      authorName: "Hussain Ali",
      authorEmail: "hussain.ali@relvo.io",
      content,
      channel: activeConversation?.channel ?? "Email",
      sentAt: new Date().toISOString(),
      status: "sent",
    };
    appendThreadMessage(message);
    setThreadMap((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), message],
    }));
    const now = new Date().toISOString();
    if (activeConversation) {
      const updated: Conversation = {
        ...activeConversation,
        lastMessageAt: now,
        preview: content.slice(0, 120),
      };
      upsertConversation(updated);
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
    setToast("Message sent");
  };

  const handleAssign = (ownerName: string) => {
    if (!activeConversation) return;
    const updated = { ...activeConversation, assignedToName: ownerName };
    upsertConversation(updated);
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setToast(`Assigned to ${ownerName}`);
  };

  const handleToggleStatus = () => {
    if (!activeConversation) return;
    const nextStatus: Conversation["status"] =
      activeConversation.status === "closed" ? "open" : "closed";
    const updated = { ...activeConversation, status: nextStatus };
    upsertConversation(updated);
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setToast(nextStatus === "closed" ? "Conversation closed" : "Conversation reopened");
  };

  const handleAiDraft = (category: string) => {
    if (!activeConversation) return;
    const template = emailTemplates.find((t) => t.category === category) ?? emailTemplates[0];
    const message: ThreadMessage = {
      id: uid("tm"),
      conversationId: activeConversation.id,
      direction: "out",
      authorName: "AI Assistant",
      content: template.body
        .replace(/\{\{contact\}\}/g, activeConversation.contactName)
        .replace(/\{\{company\}\}/g, activeConversation.companyName ?? "")
        .replace(/\{\{owner\}\}/g, "Hussain Ali"),
      channel: activeConversation.channel,
      sentAt: new Date().toISOString(),
      status: "sent",
    };
    appendThreadMessage(message);
    setThreadMap((prev) => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] ?? []), message],
    }));
    setToast("AI draft generated and sent (demo)");
  };

  if (loading) return <InboxSkeleton />;

  return (
    <div className="space-y-4">
      <ModuleHeader title="Inbox" subtitle="Unified email, WhatsApp, SMS and call inbox." />

      <StatGrid
        stats={[
          { label: "Open", value: stats.open, tone: "info" },
          { label: "Pending", value: stats.pending, tone: "warning" },
          { label: "Unread", value: stats.unread, tone: "danger" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <ConversationList
          conversations={filtered}
          activeId={activeId}
          onSelect={selectConversation}
          channel={channel}
          onChannelChange={setChannel}
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <div className="min-h-[480px]">
          {activeConversation ? (
            <ThreadView
              conversation={activeConversation}
              messages={activeMessages}
              owners={ownerNames}
              onSend={handleSend}
              onAssign={handleAssign}
              onToggleStatus={handleToggleStatus}
              onAiDraft={handleAiDraft}
            />
          ) : (
            <div className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
              Select a conversation to begin.
            </div>
          )}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}

export { InboxPageClient };