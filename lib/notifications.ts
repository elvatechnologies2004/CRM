import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Internal notification fan-out.
 * The `notifications` table has no INSERT RLS policy (users may only
 * read/update their own), so trusted server background work uses the
 * admin client to deliver in-app notices to one user or the whole org.
 * Server-only; never imported from client components.
 */
export async function notifyUsers(params: {
  organizationId: string;
  userIds?: string[];
  type?: string;
  title: string;
  message?: string;
  relatedType?: string;
  relatedId?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  let userIds = params.userIds ?? [];
  if (userIds.length === 0) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", params.organizationId)
      .eq("status", "active");
    userIds = (data ?? []).map((row) => row.user_id as string);
  }

  if (userIds.length === 0) return;

  try {
    const admin = createSupabaseAdminClient();
    await admin.from("notifications").insert(
      userIds.map((uid) => ({
        organization_id: params.organizationId,
        user_id: uid,
        type: params.type ?? "system",
        title: params.title.slice(0, 255),
        message: params.message ? params.message.slice(0, 2000) : null,
        related_type: params.relatedType ?? null,
        related_id: params.relatedId ?? null,
        is_read: false,
      })),
    );
  } catch {
    // Notification delivery must never break the caller.
  }
}