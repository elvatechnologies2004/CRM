import type { PortalActivity, PortalMetric } from "@/lib/types";
import { iso } from "@/lib/date-utils";

export const portalMetrics: PortalMetric[] = [
  { id: "pm_001", label: "Active Customers", value: 47, unit: "accounts", trend: "up" },
  { id: "pm_002", label: "Portal Logins", value: 132, unit: "this month", trend: "up" },
  { id: "pm_003", label: "Open Tickets", value: 8, unit: "tickets", trend: "down" },
  { id: "pm_004", label: "Docs Viewed", value: 214, unit: "views", trend: "up" },
];

export const portalActivities: PortalActivity[] = [
  { id: "pa_001", customerName: "Acme Motors", action: "Downloaded invoice #INV-1043", channel: "Portal", at: iso(-1, "11:30") },
  { id: "pa_002", customerName: "Skyline Retail", action: "Opened support ticket #TK-2091", channel: "Support", at: iso(-1, "14:05") },
  { id: "pa_003", customerName: "Nova Systems", action: "Viewed project milestones", channel: "Portal", at: iso(-2, "09:45") },
  { id: "pa_004", customerName: "BrightWave Media", action: "Replied to renewal email", channel: "Email", at: iso(-2, "16:20") },
  { id: "pa_005", customerName: "Acme Motors", action: "Resolved your latest update", channel: "Portal", at: iso(-3, "12:10") },
  { id: "pa_006", customerName: "Echo Furnishings", action: "Requested a new product demo", channel: "Portal", at: iso(-4, "15:00") },
  { id: "pa_007", customerName: "Lotus Digital", action: "Paid invoice #INV-1039", channel: "Email", at: iso(-5, "10:35") },
];