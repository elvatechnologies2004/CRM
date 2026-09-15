import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface CurrentUserContext {
  userId: string;
  email: string | null;
  profile: {
    id: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
    jobTitle: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string | null;
    defaultCurrency: string | null;
    timezone: string | null;
  } | null;
  membership: {
    roleId: string | null;
    roleName: string | null;
    teamId: string | null;
    status: string | null;
  } | null;
  permissions: string[];
}

const EMPTY: CurrentUserContext | null = null;

/** Memoized per request: the shell layout + pages share ONE context resolution. */
export const createUserServerContext = cache(
  async (): Promise<CurrentUserContext | null> => {
    if (!isSupabaseConfigured()) return EMPTY;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  // Profile + organization + membership
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, avatar_url, job_title, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = profile?.organization_id as string | undefined;

  let organization: CurrentUserContext["organization"] = null;
  let membership: CurrentUserContext["membership"] = null;
  let permissions: string[] = [];

  if (orgId) {
    const [{ data: orgData }, { data: memberData }] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, slug, default_currency, timezone")
        .eq("id", orgId)
        .maybeSingle(),
      supabase
        .from("organization_members")
        .select("role_id, team_id, status, roles(id, name)")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    organization = orgData
      ? {
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          defaultCurrency: orgData.default_currency,
          timezone: orgData.timezone,
        }
      : null;

    const rawRole = Array.isArray(memberData?.roles) ? null : memberData?.roles;
    const role = rawRole ? (rawRole as { id: string; name: string }) : null;

    membership = memberData
      ? {
          roleId: memberData.role_id,
          roleName: role?.name ?? null,
          teamId: memberData.team_id,
          status: memberData.status,
        }
      : null;

    if (memberData?.role_id) {
      const { data: permRows } = await supabase
        .from("role_permissions")
        .select("permissions(key)")
        .eq("role_id", memberData.role_id as string)
        .eq("organization_id", orgId);
      permissions = (permRows ?? [])
        .map((r) => (r.permissions as { key?: string } | null)?.key)
        .filter((k): k is string => Boolean(k));
    }
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile
      ? {
          id: profile.id,
          fullName: profile.full_name,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          jobTitle: profile.job_title,
        }
      : null,
    organization,
    membership,
    permissions,
  };
  },
);