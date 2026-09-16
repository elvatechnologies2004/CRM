"use client";

import { InboxPageClient } from "@/components/inbox/inbox-page-client";
import { inboxConversations } from "@/lib/mock-inbox";

export default function InboxPage() {
  return (
    <InboxPageClient
      initialConversations={inboxConversations}
      initialChannel="All"
    />
  );
}