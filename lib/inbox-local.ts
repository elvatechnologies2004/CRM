import { uid } from "@/lib/activity-local";
import type { Conversation, ThreadMessage } from "@/lib/types";

const CONVERSATIONS_KEY = "finlonexa.inbox.conversations";
const THREAD_KEY = "finlonexa.inbox.thread";

export function readStoredConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredConversations(conversations: Conversation[]): void {
  try {
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    /* storage unavailable */
  }
}

export function upsertConversation(conversation: Conversation): void {
  const stored = readStoredConversations();
  const next = stored.some((c) => c.id === conversation.id)
    ? stored.map((c) => (c.id === conversation.id ? conversation : c))
    : [conversation, ...stored];
  writeStoredConversations(next);
}

export function readStoredThread(conversationId: string): ThreadMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${THREAD_KEY}:${conversationId}`);
    return raw ? (JSON.parse(raw) as ThreadMessage[]) : [];
  } catch {
    return [];
  }
}

export function appendThreadMessage(message: ThreadMessage): void {
  try {
    const thread = readStoredThread(message.conversationId);
    window.localStorage.setItem(
      `${THREAD_KEY}:${message.conversationId}`,
      JSON.stringify([...thread, message])
    );
  } catch {
    /* storage unavailable */
  }
}

export { uid };