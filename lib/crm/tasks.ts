import "server-only";

import {
  getActiveOrgId,
  toIso,
  fetchOwnerIndex,
  getOrgIdOrThrow,
  PAGE_SIZE,
} from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { CrmTask } from "@/lib/types";

export interface TaskQuery {
  status?: string;
  ownerId?: string;
  relatedType?: string;
  relatedId?: string;
  page?: number;
  pageSize?: number;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  owner_id: string | null;
  due_at: string | null;
  related_type: string | null;
  related_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function getTasks(query: TaskQuery = {}): Promise<{ rows: CrmTask[]; total: number }> {
  if (!isSupabaseConfigured()) return { rows: [], total: 0 };

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return { rows: [], total: 0 };

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let b = supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .range(from, to);

  if (query.status) b = b.eq("status", query.status);
  if (query.ownerId) b = b.eq("owner_id", query.ownerId);
  if (query.relatedType) b = b.eq("related_type", query.relatedType);
  if (query.relatedId) b = b.eq("related_id", query.relatedId);

  b = b.order("created_at", { ascending: false });

  const { data, count, error } = await b;
  if (error) {
    console.error("[tasks] list failed", error.message);
    return { rows: [], total: 0 };
  }

  const relatedRows = await resolveRelatedNames(supabase, organizationId, data as unknown as TaskRow[]);

  const rows = ((data ?? []) as unknown as TaskRow[]).map((row, i) => {
    const owner = row.owner_id ? owners[row.owner_id] : undefined;
    const due = row.due_at ? toIso(row.due_at) : "";
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      type: (row.type as CrmTask["type"]) ?? "Other",
      priority: (row.priority as CrmTask["priority"]) ?? "Medium",
      status: (row.status as CrmTask["status"]) ?? "Open",
      ownerId: row.owner_id ?? "",
      ownerName: owner?.name ?? "",
      dueDate: due,
      relatedType: (row.related_type as CrmTask["relatedType"]) ?? "Lead",
      relatedId: row.related_id ?? undefined,
      relatedName: relatedRows[i] ?? undefined,
      createdAt: toIso(row.created_at),
      completedAt: row.completed_at ? toIso(row.completed_at) : undefined,
    } satisfies CrmTask;
  });

  return { rows, total: count ?? 0 };
}

/** Best-effort resolution of related record display names. */
async function resolveRelatedNames(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  rows: TaskRow[],
): Promise<Array<string | undefined>> {
  const types = ["Lead", "Contact", "Company", "Deal"] as const;
  const byType: Record<string, string[]> = {};
  for (const row of rows) {
    if (!row.related_type || !row.related_id) continue;
    const normalized = normalizeType(row.related_type);
    if (!normalized) continue;
    (byType[normalized] ??= []).push(row.related_id);
  }

  const table: Record<string, string> = {
    Lead: "leads",
    Contact: "contacts",
    Company: "companies",
    Deal: "deals",
  };

  const nameByType: Record<string, Record<string, string>> = {};
  for (const t of types) {
    const ids = byType[t];
    if (!ids?.length) continue;
    const { data } = await supabase
      .from(table[t])
      .select("id, full_name, name")
      .eq("organization_id", organizationId)
      .in("id", ids);
    nameByType[t] = {};
    for (const rec of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nameByType[t][rec.id] = (rec as any).full_name ?? (rec as any).name;
    }
  }

  return rows.map((row) => {
    if (!row.related_type || !row.related_id) return undefined;
    const t = normalizeType(row.related_type);
    return t ? nameByType[t]?.[row.related_id] : undefined;
  });
}

function normalizeType(t: string): "Lead" | "Contact" | "Company" | "Deal" | null {
  const lower = t.toLowerCase();
  if (lower === "lead") return "Lead";
  if (lower === "contact") return "Contact";
  if (lower === "company") return "Company";
  if (lower === "deal") return "Deal";
  return null;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  dueAt?: string;
  ownerId?: string;
  relatedType?: string;
  relatedId?: string;
}

export async function createTask(input: TaskCreateInput): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = getOrgIdOrThrow(await getActiveOrgId(supabase));
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("tasks").insert({
    organization_id: organizationId,
    title: input.title,
    description: input.description ?? null,
    type: input.type ?? "Other",
    priority: input.priority ?? "Medium",
    status: "Open",
    owner_id: input.ownerId ?? userData.user?.id ?? null,
    due_at: input.dueAt ?? null,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    created_by: userData.user?.id ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[tasks] create failed", error.message);
    return false;
  }
  return true;
}

/** Complete / reopen a task (Step 58). */
export async function setTaskStatus(id: string, status: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = getOrgIdOrThrow(await getActiveOrgId(supabase));

  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "Completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  return !error;
}

export async function deleteTask(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = getOrgIdOrThrow(await getActiveOrgId(supabase));
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  return !error;
}