"use server";

import { revalidatePath } from "next/cache";

import { getPlatformAdminContext } from "@/lib/admin/auth";
import { hasPlatformPermission } from "@/lib/admin/permissions";
import {
  upsertOrgControl,
  type BlockableFeatureKey,
  type OrgControlStatus,
} from "@/lib/admin/controls";

interface SaveResult {
  error: string | null;
}

export async function saveOrgControl(input: {
  organizationId: string;
  status: OrgControlStatus;
  blockedFeatures: BlockableFeatureKey[];
  reason: string | null;
}): Promise<SaveResult> {
  const ctx = await getPlatformAdminContext();
  if (!ctx || !hasPlatformPermission(ctx.role, "platform_settings.manage")) {
    return { error: "You do not have permission to manage organization controls." };
  }

  const result = await upsertOrgControl({
    organizationId: input.organizationId,
    status: input.status,
    blockedFeatures: input.blockedFeatures,
    reason: input.reason,
    actor: { userId: ctx.userId, name: ctx.name },
  });

  if (!result.error) {
    revalidatePath("/admin/controls");
    revalidatePath("/admin/organizations");
  }
  return result;
}