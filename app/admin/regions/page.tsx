import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/section-card";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { RegionsManager } from "@/components/admin/regions-manager";
import { getAdminDb } from "@/lib/admin/db";
import type { SalesRegionRow } from "@/lib/admin/regions";

export const metadata: Metadata = {
  title: "Regions",
  description: "FinloNexa sales regions and hierarchy assignments",
};

export const dynamic = "force-dynamic";

export default async function AdminRegionsPage() {
  await requirePlatformPermission("region.manage");

  const db = getAdminDb();

  const { data: regions, error } = await db
    .from("sales_regions")
    .select(
      "id, organization_id, name, code, description, status, created_at, updated_at",
    )
    .order("name", { ascending: true });

  const rows: SalesRegionRow[] = (regions ?? []) as SalesRegionRow[];

  return (
    <div>
      <PageHeader
        title="Regions"
        description="Sales regions across all organizations. Regions are org-scoped — organization A can never see or manage organization B’s regions."
      >
        <RegionsManager initialRegions={rows} />
      </PageHeader>

      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}
