import type { CrmSupportTicket, SupportStatus, SupportPriority } from "@/lib/types";

export const supportStatuses: SupportStatus[] = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
];

export const supportPriorities: SupportPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export const supportTicketMocks: CrmSupportTicket[] = [];

export function getTicketById(id: string): CrmSupportTicket | undefined {
  return supportTicketMocks.find((t) => t.id === id);
}