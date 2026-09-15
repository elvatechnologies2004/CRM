import { notFound, redirect } from "next/navigation";

import { HierarchyClient } from "@/components/enterprise/hierarchy-client";
import { can } from "@/lib/crm/context";
import { getOrgHierarchy } from "@/lib/org/hierarchy";

export const dynamic = "force-dynamic";

export default async function AdminHierarchyPage() {
  const allowed = (await can("admin")) || (await can("org.hierarchy.manage"));
  if (!allowed) redirect("/dashboard");

  const snapshot = await getOrgHierarchy();
  if (!snapshot) notFound();

  return <HierarchyClient snapshot={snapshot} />;
}