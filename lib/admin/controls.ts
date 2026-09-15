import "server-only";

import { getAdminDb } from "@/lib/admin/db";
import { writePlatformAuditLog } from "@/lib/admin/audit";
import {
  BLOCKABLE_FEATURES,
  type BlockableFeatureKey,
  type OrgControlStatus,
} from "@/lib/admin/controls-shared";

export { BLOCKABLE_FEATURES, type BlockableFeatureKey, type OrgControlStatus };

export interface OrgControl {
  organizationId: string;
  organizationName: string | null;
  status: OrgControlStatus;
  blockedFeatures: BlockableFeatureKey[];
  reason: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface OrgControlInput {
  organizationId: string;
  status: OrgControlStatus;
  blockedFeatures: BlockableFeatureKey[];
  reason: string | null;
  actor: { userId: string; name: string | null };
}

interface OrgControlRow {
  organization_id: string;
  status: OrgControlStatus | null;
  blocked_features: string[] | null;
  reason: string | null;
  updated_by: string | null;
  updated_at: string | null;
  organizations: { name: string | null } | { name: string | null }[] | null;
}

/** List every organization with its control state (missing rows = unmanaged). */
export async function listOrgControls(): Promise<OrgControl[]> {
  try {
    const db = getAdminDb();
    const { data, error } = await db
      .from("platform_org_controls")
      .select("*, organizations(name)")
      .order("updated_at", { ascending: false });
    if (error) return [];

    const rows = (data ?? []) as unknown as OrgControlRow[];
    return rows.map((row) => {
      const org = Array.isArray(row.organizations) ? null : row.organizations;
      return {
        organizationId: row.organization_id,
        organizationName: (org as { name: string | null } | null)?.name ?? null,
        status: row.status ?? "active",
        blockedFeatures: (row.blocked_features ?? []) as BlockableFeatureKey[],
        reason: row.reason,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      };
    });
  } catch {
    return [];
  }
}

/** Insert or update an organization's control state. Audited. */
export async function upsertOrgControl(
  input: OrgControlInput,
): Promise<{ error: string | null }> {
  try {
    const db = getAdminDb();
    const payload = {
      organization_id: input.organizationId,
      status: input.status,
      blocked_features: input.blockedFeatures,
      reason: input.reason,
      updated_by: input.actor.userId,
    };

    const { error } = await db.from("platform_org_controls").upsert(payload, {
      onConflict: "organization_id",
    });
    if (error) return { error: error.message };

    await writePlatformAuditLog({
      adminUserId: input.actor.userId,
      organizationId: input.organizationId,
      action: "organization.control_changed",
      targetType: "organization",
      targetId: input.organizationId,
      targetLabel: "Organization controls",
      metadata: {
        status: input.status,
        blocked_features: input.blockedFeatures,
        actor: input.actor.name,
      },
    });

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save controls" };
  }
}