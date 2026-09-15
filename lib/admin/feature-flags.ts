import "server-only";

import { getAdminDb } from "@/lib/admin/db";
import { writePlatformAuditLog } from "@/lib/admin/audit";

export type FeatureFlagScope = "global" | "plan" | "organization";

export interface PlatformFeatureFlag {
  id: string;
  key: string;
  label: string | null;
  description: string | null;
  scope: FeatureFlagScope;
  planCode: string | null;
  organizationId: string | null;
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

export interface SetFlagInput {
  id?: string;
  key: string;
  label: string | null;
  description: string | null;
  scope: FeatureFlagScope;
  planCode?: string | null;
  organizationId?: string | null;
  enabled: boolean;
  actor: { userId: string; name: string | null };
}

export async function listFeatureFlags(): Promise<PlatformFeatureFlag[]> {
  try {
    const db = getAdminDb();
    const { data } = await db
      .from("platform_feature_flags")
      .select("*")
      .order("key", { ascending: true });
    return (data ?? []) as unknown as PlatformFeatureFlag[];
  } catch {
    return [];
  }
}

export async function getFeatureFlag(
  key: string,
): Promise<PlatformFeatureFlag | null> {
  try {
    const db = getAdminDb();
    const { data } = await db
      .from("platform_feature_flags")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    return (data ?? null) as unknown as PlatformFeatureFlag | null;
  } catch {
    return null;
  }
}

/** Create or update a feature flag (server-side; caller is permission-gated). */
export async function setFeatureFlag(input: SetFlagInput): Promise<{ error: string | null }> {
  try {
    const db = getAdminDb();
    const payload = {
      label: input.label,
      description: input.description,
      scope: input.scope,
      plan_code: input.planCode ?? null,
      organization_id: input.organizationId ?? null,
      enabled: input.enabled,
      updated_by: input.actor.userId,
    };

    if (input.id) {
      const { error } = await db
        .from("platform_feature_flags")
        .update(payload)
        .eq("id", input.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await db
        .from("platform_feature_flags")
        .insert({ key: input.key, ...payload });
      if (error) return { error: error.message };
    }

    await writePlatformAuditLog({
      adminUserId: input.actor.userId,
      action: "feature_flag.changed",
      targetType: "feature_flag",
      targetId: input.id ?? input.key,
      targetLabel: input.key,
      metadata: { enabled: input.enabled, actor: input.actor.name },
    });

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save flag" };
  }
}