"use server";

import { revalidatePath } from "next/cache";

import { getPlatformAdminContext } from "@/lib/admin/auth";
import { hasPlatformPermission } from "@/lib/admin/permissions";
import { setFeatureFlag, type PlatformFeatureFlag } from "@/lib/admin/feature-flags";

interface ToggleResult {
  error: string | null;
}

export async function toggleFeatureFlag(flagId: string, enabled: boolean): Promise<ToggleResult> {
  const ctx = await getPlatformAdminContext();
  if (!ctx || !hasPlatformPermission(ctx.role, "feature_flags.manage")) {
    return { error: "You do not have permission to manage feature flags." };
  }

  const result = await setFeatureFlag({
    id: flagId,
    key: "existing",
    label: null,
    description: null,
    scope: "global",
    enabled,
    actor: { userId: ctx.userId, name: ctx.name },
  });

  if (!result.error) revalidatePath("/admin/feature-flags");
  return result;
}

export async function createFeatureFlag(input: {
  key: string;
  label: string;
  description: string;
  scope: PlatformFeatureFlag["scope"];
  enabled: boolean;
}): Promise<ToggleResult> {
  const ctx = await getPlatformAdminContext();
  if (!ctx || !hasPlatformPermission(ctx.role, "feature_flags.manage")) {
    return { error: "You do not have permission to manage feature flags." };
  }

  const result = await setFeatureFlag({
    key: input.key,
    label: input.label || null,
    description: input.description || null,
    scope: input.scope,
    enabled: input.enabled,
    actor: { userId: ctx.userId, name: ctx.name },
  });

  if (!result.error) revalidatePath("/admin/feature-flags");
  return result;
}