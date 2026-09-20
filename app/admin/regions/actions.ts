"use server";

import { revalidatePath } from "next/cache";

import type { RegionInput } from "@/lib/admin/regions";
import {
  changeRegionStatus as changeRegionStatusImpl,
  createRegion as createRegionImpl,
  updateRegion as updateRegionImpl,
} from "@/lib/admin/regions";

export interface RegionActionResult {
  id: string;
  error: string | null;
}

/**
 * Thin `use server` action wrappers for the regions phase — the ONLY bridge
 * between the client component and the server-only admin implementation.
 *
 * The client speaks to these and nothing else. The actual database logic,
 * authorization, RLS, and same-organization hierarchy validation all stay in
 * `lib/admin/regions.ts` (server-only) — nothing here trusts ids, org ids, or
 * reports-to values from the browser beyond what the server module re-resolves.
 */

export async function createRegionAction(
  input: RegionInput,
): Promise<RegionActionResult> {
  const result = await createRegionImpl(input);
  if (!result.error) revalidatePath("/admin/regions");
  return result;
}

export async function updateRegionAction(
  input: RegionInput & { regionId: string },
): Promise<RegionActionResult> {
  const result = await updateRegionImpl(input);
  if (!result.error) revalidatePath("/admin/regions");
  return result;
}

export async function changeRegionStatusAction(
  regionId: string,
  organizationId: string,
  status: "active" | "archived",
): Promise<RegionActionResult> {
  const result = await changeRegionStatusImpl(regionId, organizationId, status);
  if (!result.error) revalidatePath("/admin/regions");
  return result;
}
