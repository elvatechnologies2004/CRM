import "server-only";

import {
  buildPagedResult,
  getAdminDb,
  normalizePage,
} from "@/lib/admin/db";
import type {
  OrgWithMeta,
  OrganizationRow,
  PagedResult,
} from "@/lib/admin/types";

type OrgStatus = OrgWithMeta["status"];

export interface OrganizationFilters {
  search?: string;
  status?: OrgStatus;
  page?: number;
  pageSize?: number;
}

interface OrgRow extends OrganizationRow {
  created_by: string | null;
}

function derivePlanCode(planName: string | null | undefined): string | null {
  const name = (planName ?? "").toLowerCase().trim();
  if (!name) return null;
  if (name.includes("free")) return "free";
  if (name.includes("business")) return "business";
  if (name.includes("pro")) return "pro";
  if (name.includes("starter")) return "starter";
  return null;
}

function deriveStatus(
  subscriptionStatus: string | null | undefined,
  createdAt: string,
): OrgStatus {
  const s = (subscriptionStatus ?? "").toLowerCase().trim();
  if (["cancelled", "suspended", "expired"].includes(s)) return "suspended";
  if (["trial", "trialing"].includes(s)) return "trial";
  if (s === "past_due") return "suspended";
  if (s && s !== "none") return "paid";
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return ageDays <= 14 ? "trial" : "active";
}

export async function listOrganizations(
  filters: OrganizationFilters = {},
): Promise<PagedResult<OrgWithMeta>> {
  const { page, pageSize, from, to } = normalizePage(filters);
  const db = getAdminDb();

  let query = db.from("organizations").select("*", { count: "exact" });
  const search = filters.search?.trim();
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,slug.ilike.%${search}%,country.ilike.%${search}%`,
    );
  }
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Failed to load organizations: ${error.message}`);
  const orgs = (data ?? []) as OrgRow[];

  const meta = await loadOrganizationsMeta(orgs);

  const rows: OrgWithMeta[] = orgs.map((org) => {
    const m = meta.get(org.id);
    const subscriptionStatus = m?.subscription?.status ?? null;
    const status = deriveStatus(subscriptionStatus, org.created_at);
    return {
      ...org,
      ownerName: m?.ownerName ?? null,
      ownerEmail: m?.ownerEmail ?? null,
      memberCount: m?.memberCount ?? 0,
      planName: m?.subscription?.plan_name ?? null,
      planCode: derivePlanCode(m?.subscription?.plan_name),
      status,
      subscriptionStatus,
      lastActiveAt: m?.lastActiveAt ?? org.updated_at,
    };
  });

  return buildPagedResult(
    rows,
    count ?? rows.length,
    page,
    pageSize,
  );
}

interface OrgMeta {
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
  lastActiveAt: string;
  subscription: {
    plan_name: string | null;
    status: string | null;
    amount: number | null;
    currency: string | null;
    billing_cycle: string | null;
    renewal_date: string | null;
    id: string | null;
  } | null;
}

async function loadOrganizationsMeta(
  orgs: OrgRow[],
): Promise<Map<string, OrgMeta>> {
  const meta = new Map<string, OrgMeta>();
  const orgIds = orgs.map((o) => o.id);
  if (orgIds.length === 0) return meta;
  const db = getAdminDb();

  const [{ data: members }, { data: subs }] = await Promise.all([
    db
      .from("organization_members")
      .select("organization_id, user_id")
      .in("organization_id", orgIds)
      .eq("status", "active"),
    db
      .from("subscriptions")
      .select(
        "organization_id, id, plan_name, status, amount, currency, billing_cycle, renewal_date",
      )
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false }),
  ]);

  const memberCounts = new Map<string, number>();
  for (const m of members ?? []) {
    memberCounts.set(m.organization_id, (memberCounts.get(m.organization_id) ?? 0) + 1);
  }

  const ownerByOrg = new Map<string, string | null>();
  for (const o of orgs) {
    if (o.created_by) ownerByOrg.set(o.id, o.created_by);
  }

  const ownerProfiles = new Map<string, { full_name: string | null; email: string | null }>();
  const ownerIds = [...new Set(ownerByOrg.values())].filter(Boolean) as string[];
  if (ownerIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds);
    for (const p of profiles ?? []) {
      ownerProfiles.set(p.id, { full_name: p.full_name, email: p.email });
    }
  }

  for (const orgId of orgIds) {
    const subList = (subs ?? []).filter((s) => s.organization_id === orgId);
    const sub = subList[0] ?? null;
    const ownerId = ownerByOrg.get(orgId) ?? null;
    const owner = ownerId ? ownerProfiles.get(ownerId) : undefined;
    meta.set(orgId, {
      ownerName: owner?.full_name ?? null,
      ownerEmail: owner?.email ?? null,
      memberCount: memberCounts.get(orgId) ?? 0,
      lastActiveAt: sub?.renewal_date ?? "",
      subscription: sub
        ? {
            id: sub.id,
            plan_name: sub.plan_name,
            status: sub.status,
            amount: sub.amount,
            currency: sub.currency,
            billing_cycle: sub.billing_cycle,
            renewal_date: sub.renewal_date,
          }
        : null,
    });
  }

  return meta;
}

export interface OrganizationMemberRow {
  userId: string;
  name: string | null;
  email: string | null;
  status: string;
  joinedAt: string;
  roleName: string | null;
}

export interface OrganizationDetail {
  org: OrgWithMeta;
  members: OrganizationMemberRow[];
  counts: Record<string, number>;
}

export async function getOrganizationDetail(
  orgId: string,
): Promise<OrganizationDetail | null> {
  const db = getAdminDb();
  const { data: org, error } = await db
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();
  if (error || !org) return null;

  const orgRow = org as OrgRow;

  const [{ data: members }, { data: subs }, counts] = await Promise.all([
    db
      .from("organization_members")
      .select("user_id, status, joined_at, roles(name)")
      .eq("organization_id", orgId),
    db
      .from("subscriptions")
      .select(
        "id, plan_name, status, amount, currency, billing_cycle, start_date, renewal_date, created_at",
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
    countRecords(orgId),
  ]);

  interface OrgMemberQueryRow {
    user_id: string;
    status: string;
    joined_at: string;
    roles: { name: string | null } | { name: string | null }[] | null;
  }
  const memberRowsInput = (members ?? []) as unknown as OrgMemberQueryRow[];

  const profileIds = memberRowsInput.map((m) => m.user_id);
  const profilesById = new Map<
    string,
    { full_name: string | null; email: string | null }
  >();
  if (profileIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", profileIds);
    for (const p of profiles ?? []) {
      profilesById.set(p.id, { full_name: p.full_name, email: p.email });
    }
  }

  const memberRows: OrganizationMemberRow[] = memberRowsInput.map((m) => {
    const profile = profilesById.get(m.user_id);
    const role = Array.isArray(m.roles) ? null : (m.roles as { name: string | null } | null);
    return {
      userId: m.user_id,
      name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      status: m.status,
      joinedAt: m.joined_at,
      roleName: role?.name ?? null,
    };
  });

  const sub = Array.isArray(subs) && subs.length > 0 ? subs[0] : null;

  const orgWithMeta: OrgWithMeta = {
    ...orgRow,
    ownerName: null,
    ownerEmail: null,
    memberCount: memberRows.length,
    planName: sub?.plan_name ?? null,
    planCode: derivePlanCode(sub?.plan_name),
    status: deriveStatus(sub?.status ?? null, orgRow.created_at),
    subscriptionStatus: sub?.status ?? null,
    lastActiveAt: orgRow.updated_at,
  };

  const { data: ownerProfile } = orgRow.created_by
    ? await db
        .from("profiles")
        .select("full_name, email")
        .eq("id", orgRow.created_by)
        .maybeSingle()
    : { data: null };
  if (ownerProfile) {
    orgWithMeta.ownerName = ownerProfile.full_name;
    orgWithMeta.ownerEmail = ownerProfile.email;
  }

  return { org: orgWithMeta, members: memberRows, counts };
}

async function countRecords(orgId: string): Promise<Record<string, number>> {
  const db = getAdminDb();
  const tables = [
    "leads",
    "contacts",
    "companies",
    "deals",
    "invoices",
    "projects",
    "support_tickets",
    "ai_agents",
    "automations",
    "automation_runs",
  ] as const;

  const results = await Promise.all(
    tables.map((table) =>
      db
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId),
    ),
  );

  const counts: Record<string, number> = {};
  tables.forEach((table, index) => {
    counts[table] = results[index].count ?? 0;
  });

  const { data: storage } = await db
    .from("attachments")
    .select("size_bytes")
    .eq("organization_id", orgId);
  counts.attachments_bytes = (storage ?? []).reduce(
    (acc, row) => acc + Number(row.size_bytes ?? 0),
    0,
  );

  return counts;
}