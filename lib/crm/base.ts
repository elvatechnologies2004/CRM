import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared helpers for the server-side CRM data layer.
 */

export type DbClient = SupabaseClient;

export function buildFullName(first: string | null | undefined, last: string | null | undefined): string {
  return `${first ?? ""} ${last ?? ""}`.trim() || "—";
}

/** Converts a DB date/time to the ISO string used by the frontend. */
export function toIso(value: string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  const d = value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? new Date(value) : new Date(`${value}Z`);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

/** Converts a date-only value (YYYY-MM-DD) to ISO. */
export function toIsoDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(`${value}T00:00:00Z`).toISOString();
}

export function uuidOrNull(value: string | null | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export const PAGE_SIZE = 25;
export const PAGE_SIZE_LARGE = 50;

/**
 * Fetch owner profiles for an org: userId -> { name, email, avatarUrl }.
 * Used to denormalize owner_name for frontend records.
 */
export async function fetchOwnerIndex(
  supabase: DbClient,
  organizationId: string,
): Promise<Record<string, { name: string; email: string | null; avatarUrl: string | null }>> {
  const { data } = await supabase
    .from("organization_members")
    .select("user_id, profiles(id, full_name, email, avatar_url)")
    .eq("organization_id", organizationId);

  const index: Record<string, { name: string; email: string | null; avatarUrl: string | null }> = {};
  for (const row of data ?? []) {
    const p = Array.isArray(row.profiles) ? null : (row.profiles as
      | { id: string; full_name: string | null; email: string | null; avatar_url: string | null }
      | null);
    if (p) {
      index[row.user_id] = {
        name: p.full_name || p.email?.split("@")[0] || "User",
        email: p.email,
        avatarUrl: p.avatar_url,
      };
    }
  }
  return index;
}

/** Returns the active org id for the current user, or null. Memoized per request. */
export const getActiveOrgId = cache(async (supabase: DbClient): Promise<string | null> => {
  const { data } = await supabase.rpc("current_organization_id");
  return (data as string | null) ?? null;
});

export function getOrgIdOrThrow(organizationId: string | null): string {
  if (!organizationId) {
    throw new Error("No active workspace");
  }
  return organizationId;
}