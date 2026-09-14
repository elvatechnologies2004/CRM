import { InboxPageClient } from "@/components/inbox/inbox-page-client";
import { inboxConversations } from "@/lib/mock-inbox";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const channelParam = typeof query.channel === "string" ? query.channel : undefined;

  return (
    <InboxPageClient
      initialConversations={inboxConversations}
      initialChannel={channelParam}
    />
  );
}