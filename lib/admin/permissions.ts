import "server-only";

import type { PlatformRole } from "@/lib/admin/types";

export type PlatformPermission =
  | "platform.dashboard.view"
  | "organizations.view"
  | "organizations.manage"
  | "users.view"
  | "users.manage"
  | "region.manage"
  | "sales.hierarchy.manage"
  | "subscriptions.view"
  | "subscriptions.manage"
  | "region.manage"
  | "sales.hierarchy.manage"
  | "billing.view"
  | "billing.manage"
  | "support.view"
  | "support.manage"
  | "usage.view"
  | "ai.view"
  | "ai.manage"
  | "automations.view"
  | "automations.manage"
  | "integrations.view"
  | "integrations.manage"
  | "system.view"
  | "audit.view"
  | "feature_flags.view"
  | "feature_flags.manage"
  | "platform_settings.manage";

export const ALL_PLATFORM_PERMISSIONS: readonly PlatformPermission[] = [
  "platform.dashboard.view",
  "organizations.view",
  "organizations.manage",
  "users.view",
  "users.manage",
  "subscriptions.view",
  "subscriptions.manage",
  "billing.view",
  "billing.manage",
  "support.view",
  "support.manage",
  "usage.view",
  "ai.view",
  "ai.manage",
  "automations.view",
  "automations.manage",
  "integrations.view",
  "integrations.manage",
  "system.view",
  "audit.view",
  "feature_flags.view",
  "feature_flags.manage",
  "platform_settings.manage",
] as const;

export const ROLE_LABELS: Record<PlatformRole, string> = {
  super_admin: "Super Admin",
  platform_admin: "Platform Admin",
  support_admin: "Support Admin",
  billing_admin: "Billing Admin",
  viewer: "Viewer",
};

/**
 * Server-only role -> permission mapping. Mirrors the database seed in
 * supabase/migrations/20260915000000_platform_admin.sql. The database
 * (`has_platform_permission`) is the authoritative source; this keeps a
 * fast in-process mirror for guard checks and UI gating.
 */
export const ROLE_PERMISSIONS: Record<PlatformRole, readonly string[]> = {
  super_admin: ALL_PLATFORM_PERMISSIONS,
  platform_admin: ALL_PLATFORM_PERMISSIONS,
  support_admin: ALL_PLATFORM_PERMISSIONS,
  billing_admin: ALL_PLATFORM_PERMISSIONS,
  viewer: ALL_PLATFORM_PERMISSIONS,
};

export function hasPlatformPermission(
  role: PlatformRole,
  permission: PlatformPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isPlatformRole(value: string): value is PlatformRole {
  return value in ROLE_LABELS;
}
