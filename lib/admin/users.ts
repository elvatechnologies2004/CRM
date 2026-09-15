import "server-only";

import {
  buildPagedResult,
  getAdminDb,
  normalizePage,
} from "@/lib/admin/db";
import type { PagedResult } from "@/lib/admin/types";

export interface PlatformUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  status: string;
  createdAt: string;
  organizationName: string | null;
  organizationRoleName: string | null;
  orgCount: number;
  isPlatformAdmin: boolean;
}

export interface UserFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface UserQueryRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  job_title: string | null;
  status: string | null;
  created_at: string;
}

export async function listUsers(
  filters: UserFilters = {},
): Promise<PagedResult<PlatformUser>> {
  try {
    const { page, pageSize, from, to } = normalizePage(filters);
    const db = getAdminDb();

    let query = db.from("profiles").select("*", { count: "exact" });
    const search = filters.search?.trim();
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return buildPagedResult([], 0, page, pageSize);
    }

    const rows = (data ?? []) as unknown as UserQueryRow[];
    const userIds = rows.map((r) => r.id);

    const [memberships, admins] = await Promise.all([
      db
        .from("organization_members")
        .select("user_id, organization_id, roles(name), organizations(name)")
        .in("user_id", userIds),
      db
        .from("platform_admins")
        .select("user_id")
        .in("user_id", userIds),
    ]);

    interface MembershipRow {
      user_id: string;
      organization_id: string;
      roles: { name: string | null } | { name: string | null }[] | null;
      organizations: { name: string | null } | { name: string | null }[] | null;
    }
    const memberRows = (memberships?.data ?? []) as unknown as MembershipRow[];

    const adminIds = new Set(
      (admins?.data ?? []).map((a: { user_id: string }) => a.user_id),
    );

    const orgByUser = new Map<string, { name: string; role: string }>();
    const orgCount = new Map<string, number>();
    for (const m of memberRows) {
      orgCount.set(m.user_id, (orgCount.get(m.user_id) ?? 0) + 1);
      if (!orgByUser.has(m.user_id)) {
        const org = Array.isArray(m.organizations) ? null : m.organizations;
        const role = Array.isArray(m.roles) ? null : m.roles;
        orgByUser.set(m.user_id, {
          name: (org as { name: string | null } | null)?.name ?? "—",
          role: (role as { name: string | null } | null)?.name ?? "—",
        });
      }
    }

    const result: PlatformUser[] = rows.map((row) => {
      const primary = orgByUser.get(row.id);
      return {
        id: row.id,
        name: row.full_name,
        email: row.email,
        avatarUrl: row.avatar_url,
        jobTitle: row.job_title,
        status: row.status ?? "active",
        createdAt: row.created_at,
        organizationName: primary?.name ?? null,
        organizationRoleName: primary?.role ?? null,
        orgCount: orgCount.get(row.id) ?? 0,
        isPlatformAdmin: adminIds.has(row.id),
      };
    });

    return buildPagedResult(result, count ?? result.length, page, pageSize);
  } catch {
    return buildPagedResult([], 0, filters.page ?? 1, filters.pageSize ?? 25);
  }
}

export async function getTotalUserCount(): Promise<number> {
  try {
    const db = getAdminDb();
    const { count } = await db
      .from("profiles")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}