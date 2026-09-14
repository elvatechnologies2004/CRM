import { notFound, redirect } from "next/navigation";

import { RoutingClient } from "@/components/admin/routing-client";
import { can } from "@/lib/crm/context";
import { getRoutingRules } from "@/lib/routing/routing";

export const dynamic = "force-dynamic";

export default async function AdminRoutingPage() {
  const allowed = (await can("admin")) || (await can("routing.manage"));
  if (!allowed) redirect("/dashboard");

  const data = await getRoutingRules();
  if (!data) notFound();

  return <RoutingClient rules={data.rules} canManage={data.canManage} />;
}