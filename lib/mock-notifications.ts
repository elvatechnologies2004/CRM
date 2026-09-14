import type { SystemNotification } from "@/lib/types";

export const notificationTypes: SystemNotification["type"][] = [
  "System",
  "Task",
  "Follow-up",
  "Deal",
  "Invoice",
];

export const notificationMocks: SystemNotification[] = [
  {
    id: "ntf_001",
    type: "System",
    title: "System Update",
    message: "Maintenance scheduled for tonight at 02:00 AM",
    read: false,
    createdAt: "2024-12-15T10:00:00Z",
  },
  {
    id: "ntf_002",
    type: "Task",
    title: "Follow-up Call",
    message: "Follow up with Techno Solutions regarding automation setup",
    read: true,
    createdAt: "2024-12-14T14:30:00Z",
  },
  {
    id: "ntf_003",
    type: "Deal",
    title: "New Deal Created",
    message: "Deal d_001 created for Techno Automation Suite",
    read: false,
    createdAt: "2024-12-13T09:00:00Z",
  },
  {
    id: "ntf_004",
    type: "Invoice",
    title: "Invoice Overdue",
    message: "Invoice INV-2024-001 is overdue",
    read: true,
    createdAt: "2024-12-12T16:00:00Z",
  },
];