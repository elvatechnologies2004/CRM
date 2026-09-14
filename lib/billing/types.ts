/**
 * Shared billing + SaaS entity types (Steps 95–96).
 */

export type PlanCode = "free" | "starter" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface OrgUsage {
  seats: number;
  contacts: number;
  deals: number;
  automations: number;
}

export interface PlanLimits {
  seats: number;
  contacts: number;
  deals: number;
  automations: number;
  storageGb: number;
}

export interface PlanEntitlements {
  ai: boolean;
  automations: boolean;
  integrations: boolean;
  apiAccess: boolean;
  sequences: boolean;
  reports: boolean;
  sso?: boolean;
  audit?: boolean;
}