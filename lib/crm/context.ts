import "server-only";

import { createUserServerContext } from "@/lib/crm/user-context";

export type { CurrentUserContext } from "@/lib/crm/user-context";

/**
 * Server-side current user + organization context for Server Components,
 * Server Actions and Route Handlers.
 *
 * Returns null when Supabase is not configured or the user is not signed in.
 * Includes profile, organization, active membership, role and the list of
 * granted permission keys (Steps 86–87).
 */
export const getCurrentUser = createUserServerContext;

/** Convenience: fetch the context and require a signed-in, org-scoped user. */
export async function requireUser() {
  const ctx = await getCurrentUser();
  return ctx;
}

/**
 * Server-side permission check (Step 48). The real enforcement lives in the
 * database via RLS (`has_permission` sql function); this mirrors it for UX.
 */
export async function can(permission: string): Promise<boolean> {
  const ctx = await getCurrentUser();
  if (!ctx?.permissions) return false;
  return ctx.permissions.includes(permission);
}