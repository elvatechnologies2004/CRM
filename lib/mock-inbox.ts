import type { Conversation, EmailTemplate, ThreadMessage } from "@/lib/types";

export const inboxChannels = ["Email", "WhatsApp", "SMS", "Call"] as const;

export const inboxConversations: Conversation[] = [];

export const threadByConversation: Record<string, ThreadMessage[]> = {};

export const emailTemplates: EmailTemplate[] = [
  {
    id: "et_001",
    name: "Implementation Timeline",
    subject: "Implementation timeline for {{company}}",
    body: "Hi {{contact}},\n\nAs promised, here is the phased implementation timeline for {{company}}. Phase 1 covers onboarding, permissions and approvals. Phase 2 covers data migration and integrations.\n\nLet me know if you'd like any adjustments.\n\nBest regards,\n{{owner}}",
    category: "Proposal",
  },
  {
    id: "et_002",
    name: "Proposal Follow-up",
    subject: "Following up on the proposal",
    body: "Hi {{contact}},\n\nI wanted to follow up on the proposal we shared. Do you have any questions, or should we schedule a walkthrough?\n\nBest,\n{{owner}}",
    category: "Follow-up",
  },
  {
    id: "et_003",
    name: "Pricing Breakdown",
    subject: "Pricing breakdown — {{company}}",
    body: "Hi {{contact}},\n\nPlease find the requested pricing breakdown below. We separate platform fees from implementation and migration services.\n\nHappy to walk through it.\n\nBest,\n{{owner}}",
    category: "Sales",
  },
  {
    id: "et_004",
    name: "Demo Recap",
    subject: "Recap of our demo",
    body: "Hi {{contact}},\n\nThanks for your time today. Here's a quick recap of the demo and the items we discussed. The recording and enablement guide are attached.\n\nBest,\n{{owner}}",
    category: "Demo",
  },
  {
    id: "et_005",
    name: "Security Whitepaper",
    subject: "Security & compliance overview",
    body: "Hi {{contact}},\n\nAs requested, here's our security whitepaper covering SSO (SAML), audit logs, encryption, and our compliance posture.\n\nHappy to schedule a security deep-dive.\n\nBest,\n{{owner}}",
    category: "Security",
  },
  {
    id: "et_006",
    name: "Contract Terms",
    subject: "Contract terms — {{company}}",
    body: "Hi {{contact}},\n\nAttached are the contract terms aligned with the 3-year plan we discussed. Please review and let me know your questions.\n\nBest,\n{{owner}}",
    category: "Contract",
  },
];

export function getConversation(id: string): Conversation | undefined {
  return inboxConversations.find((c) => c.id === id);
}

export function getThread(conversationId: string): ThreadMessage[] {
  return threadByConversation[conversationId] ?? [];
}

export function unreadConversationCount(): number {
  return inboxConversations.filter((c) => c.unreadCount > 0).length;
}

export function inboxChannelLabel(channel: Conversation["channel"]): string {
  if (channel === "Call") return "Call";
  if (channel === "WhatsApp") return "WhatsApp";
  if (channel === "SMS") return "SMS";
  return "Email";
}