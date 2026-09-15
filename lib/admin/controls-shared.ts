/** Client-safe constants for org-control feature blocks (no "server-only"). */

/** Features an admin can block for an organization. */
export const BLOCKABLE_FEATURES = [
  {
    key: "ai",
    label: "AI Assistant",
    description: "AI agents, recommendations and approvals",
  },
  {
    key: "automations",
    label: "Automations",
    description: "Automation engine, runs and jobs",
  },
  {
    key: "integrations",
    label: "Integrations",
    description: "Calendar, email sync and provider connections",
  },
  {
    key: "email",
    label: "Email",
    description: "Transactional email and IMAP/Gmail sync",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "WhatsApp messaging channel",
  },
  {
    key: "billing",
    label: "Billing",
    description: "Subscription and invoice management",
  },
  {
    key: "api",
    label: "API Access",
    description: "Public / webhook API access",
  },
] as const;

export type BlockableFeatureKey = (typeof BLOCKABLE_FEATURES)[number]["key"];

export type OrgControlStatus = "active" | "restricted" | "suspended";
