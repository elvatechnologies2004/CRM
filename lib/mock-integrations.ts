import type { IntegrationCard } from "@/lib/types";
import { iso } from "@/lib/date-utils";

export const integrationMocks: IntegrationCard[] = [
  {
    id: "itg_001",
    name: "Google Workspace",
    description: "Sync contacts, emails and calendars with Google Workspace.",
    status: "Connected",
    connectedAt: iso(-40, "10:00"),
    color: "#4285f4",
  },
  {
    id: "itg_002",
    name: "Slack",
    description: "Push deal updates and alerts to Slack channels.",
    status: "Connected",
    connectedAt: iso(-35, "14:00"),
    color: "#611f69",
  },
  {
    id: "itg_003",
    name: "Zoom",
    description: "Schedule and log video meetings automatically.",
    status: "Connected",
    connectedAt: iso(-30, "09:00"),
    color: "#2d8cff",
  },
  {
    id: "itg_004",
    name: "Stripe",
    description: "Import payments and invoice statuses from Stripe.",
    status: "Not Connected",
    color: "#635bff",
  },
  {
    id: "itg_005",
    name: "HubSpot",
    description: "Two-way sync of contacts and companies.",
    status: "Not Connected",
    color: "#ff7a59",
  },
  {
    id: "itg_006",
    name: "QuickBooks",
    description: "Reconcile invoices with your accounting system.",
    status: "Coming Soon",
    color: "#2ca01c",
  },
];