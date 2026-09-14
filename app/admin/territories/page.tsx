import { notFound, redirect } from "next/navigation";

import { TerritoriesClient } from "@/components/admin/territories-client";
import { can } from "@/lib/crm/context";
import { getTerritories } from "@/lib/territories/territories";

export const dynamic = "force-dynamic";

export default async function AdminTerritoriesPage() {
  const allowed = (await can("admin")) || (await can("territory.manage"));
  if (!allowed) redirect("/dashboard");

  const territories = await getTerritories();
  if (!territories) notFound();

  return (
    <TerritoriesClient territories={territories} canManage={await can("territory.manage")} />
  );
}