import type { SystemNotification } from "@/lib/types";

export const notificationTypes: SystemNotification["type"][] = [
  "System",
  "Task",
  "Follow-up",
  "Deal",
  "Invoice",
];

export const notificationMocks: SystemNotification[] = [];
