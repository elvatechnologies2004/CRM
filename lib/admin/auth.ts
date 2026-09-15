import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/env";

import {
  hasPlatformPermission,
  isPlatformRole,
  ROLE_PERMISSIONS,
  type PlatformPermission,
} from "@/lib/admin/permissions";
import type {
  PlatformAdminContext,
  PlatformRole,
} from "@/lib/admin/types";

export type { PlatformPermission };

export type AdminGuardResult =
  | { status: "ok"; ctx: PlatformAdminContext }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

interface PlatformAdminRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
}

/**
 * Resolve the current platform-admin context, or null when the caller is
 * not an active platform admin (or Supabase is not configured).
 *
 * Reads the membership row through the USER-scoped client so RLS applies:
 * the `platform_admins_select` policy only returns rows to platform admins,
 * so a regular CRM user simply never sees the row.
 *
 * Memoized per request (`cache`) — the layout guard and each page's
 * `requirePlatformPermission` share ONE resolution instead of re-hitting
 * Supabase up to four times per render.
 */
export const getPlatformAdminContext = cache(async (): Promise<PlatformAdminContext | null> => {
  if (!supabaseEnv.isConfigured) return null;

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("platform_admins")
      .select("id, user_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!data || !isPlatformRole(data.role as string)) return null;

    const role = data.role as PlatformRole;

    let name: string | null = null;
    let email: string | null = user.email ?? null;
    let avatarUrl: string | null = null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      name = profile.full_name ?? null;
      email = profile.email ?? email;
      avatarUrl = profile.avatar_url ?? null;
    }

    return {
      recordId: (data as PlatformAdminRow).id,
      userId: user.id,
      name,
      email,
      avatarUrl,
      role,
      permissions: [...ROLE_PERMISSIONS[role]],
    };
  } catch {
    return null;
  }
});

async function isAuthenticated(): Promise<boolean> {
  if (!supabaseEnv.isConfigured) return false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

/**
 * Distinguish the three admin guard cases. Safe to call from app/admin/layout.tsx:
 * unauthenticated -> redirect to login, forbidden -> render the 403 UI inline,
 * ok -> render the admin shell.
 */
export async function getAdminGuardResult(): Promise<AdminGuardResult> {
  const ctx = await getPlatformAdminContext();
  if (ctx) return { status: "ok", ctx };

  const authed = await isAuthenticated();
  return authed ? { status: "forbidden" } : { status: "unauthenticated" };
}

/**
 * Require an active platform admin. Redirects to /login?next=/admin when
 * unauthenticated and /admin/forbidden when authenticated without a
 * platform-admin membership. Throws NEXT_REDIRECT (server-side).
 */
export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  const result = await getAdminGuardResult();
  if (result.status === "ok") return result.ctx;
  if (result.status === "unauthenticated") {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }
  redirect("/admin/forbidden");
  throw new Error("unreachable");
}

/**
 * Require a specific platform permission. Runs AFTER the layout's
 * platform-admin guard, so callers here are already platform admins;
 * this narrows to the requested permission and redirects to the 403 page
 * when missing.
 */
export async function requirePlatformPermission(
  permission: PlatformPermission,
): Promise<PlatformAdminContext> {
  const ctx = await requirePlatformAdmin();
  if (!hasPlatformPermission(ctx.role, permission)) {
    redirect("/admin/forbidden");
  }
  return ctx;
}