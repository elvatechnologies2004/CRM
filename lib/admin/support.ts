import "server-only";

import {
  buildPagedResult,
  getAdminDb,
  normalizePage,
} from "@/lib/admin/db";
import type { PagedResult } from "@/lib/admin/types";

export interface PlatformSupportTicket {
  id: string;
  ticketNumber: string | null;
  organizationId: string;
  organizationName: string;
  subject: string;
  priority: string;
  status: string;
  category: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportFilters {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
}

interface TicketRow {
  id: string;
  ticket_number: string | null;
  organization_id: string;
  organizations: { name: string } | { name: string }[] | null;
  subject: string;
  priority: string | null;
  status: string | null;
  category: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

const OPEN_STATUSES = new Set(["New", "Open", "In Progress", "Pending"]);

export async function listSupportTickets(
  filters: SupportFilters = {},
): Promise<PagedResult<PlatformSupportTicket>> {
  try {
    const { page, pageSize, from, to } = normalizePage(filters);
    const db = getAdminDb();

    let query = db
      .from("support_tickets")
      .select("*, organizations(name)", { count: "exact" });

    const search = filters.search?.trim();
    if (search) {
      query = query.or(`subject.ilike.%${search}%,ticket_number.ilike.%${search}%`);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return buildPagedResult([], 0, page, pageSize);
    }

    const rows = (data ?? []) as unknown as TicketRow[];

    const ownerIds = [
      ...new Set(
        rows.map((r) => r.owner_id).filter((id): id is string => Boolean(id)),
      ),
    ];
    const ownerNames = new Map<string, string>();
    if (ownerIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);
      for (const p of profiles ?? []) {
        ownerNames.set(p.id, p.full_name ?? (p.email ?? ""));
      }
    }

    const result: PlatformSupportTicket[] = rows.map((row) => {
      const org = Array.isArray(row.organizations) ? null : row.organizations;
      return {
        id: row.id,
        ticketNumber: row.ticket_number,
        organizationId: row.organization_id,
        organizationName: (org as { name: string } | null)?.name ?? "—",
        subject: row.subject,
        priority: row.priority ?? "Medium",
        status: row.status ?? "New",
        category: row.category,
        assignedTo: row.owner_id ? ownerNames.get(row.owner_id) ?? null : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return buildPagedResult(result, count ?? result.length, page, pageSize);
  } catch {
    return buildPagedResult([], 0, filters.page ?? 1, filters.pageSize ?? 25);
  }
}

export async function getOpenTicketCount(): Promise<number> {
  try {
    const db = getAdminDb();
    const { data } = await db.from("support_tickets").select("status");
    return (data ?? []).filter((t) =>
      OPEN_STATUSES.has(String(t.status ?? "")),
    ).length;
  } catch {
    return 0;
  }
}