import "server-only";

import {
  buildPagedResult,
  getAdminDb,
  normalizePage,
} from "@/lib/admin/db";
import type { PagedResult } from "@/lib/admin/types";

export interface PlatformAuditEntry {
  id: string;
  adminUser: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  organizationName: string | null;
  createdAt: string;
}

export interface AuditFilters {
  action?: string;
  page?: number;
  pageSize?: number;
}

export interface PlatformAuditInput {
  adminUserId?: string | null;
  organizationId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown>;
}

/** Append a platform audit entry. Caller must already hold platform permission. */
export async function writePlatformAuditLog(input: PlatformAuditInput): Promise<void> {
  try {
    const db = getAdminDb();
    await db.from("platform_audit_log").insert({
      admin_user_id: input.adminUserId ?? null,
      organization_id: input.organizationId ?? null,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      target_label: input.targetLabel ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Audit failures must never block the underlying admin action.
  }
}

export async function listPlatformAuditLog(
  filters: AuditFilters = {},
): Promise<PagedResult<PlatformAuditEntry>> {
  try {
    const { page, pageSize, from, to } = normalizePage(filters);
    const db = getAdminDb();

    let query = db
      .from("platform_audit_log")
      .select("*, organizations(name)", { count: "exact" });

    if (filters.action && filters.action !== "all") {
      query = query.eq("action", filters.action);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return buildPagedResult([], 0, page, pageSize);
    }

    interface AuditRow {
      id: string;
      admin_user_id: string | null;
      action: string;
      target_type: string | null;
      target_id: string | null;
      target_label: string | null;
      created_at: string;
      organizations: { name: string } | { name: string }[] | null;
      metadata: Record<string, unknown> | null;
    }

    const rows = (data ?? []) as unknown as AuditRow[];

    const adminUserIds = [
      ...new Set(
        rows.map((r) => r.admin_user_id).filter((id): id is string => Boolean(id)),
      ),
    ];

    const adminNames = new Map<string, string>();
    if (adminUserIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminUserIds);
      for (const p of profiles ?? []) {
        adminNames.set(p.id, p.full_name ?? (p.email ?? ""));
      }
    }

    const result: PlatformAuditEntry[] = rows.map((row) => {
      const org = Array.isArray(row.organizations) ? null : row.organizations;
      return {
        id: row.id,
        adminUser: row.admin_user_id ? adminNames.get(row.admin_user_id) ?? null : null,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        targetLabel: row.target_label,
        organizationName: (org as { name: string } | null)?.name ?? null,
        createdAt: row.created_at,
      };
    });

    return buildPagedResult(result, count ?? result.length, page, pageSize);
  } catch {
    return buildPagedResult([], 0, filters.page ?? 1, filters.pageSize ?? 25);
  }
}