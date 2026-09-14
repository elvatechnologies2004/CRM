import { notFound, redirect } from "next/navigation";

import { WorkflowsClient } from "@/components/admin/workflows-client";
import { can } from "@/lib/crm/context";
import { getWorkflowRuns, getWorkflows } from "@/lib/workflows/engine";

export const dynamic = "force-dynamic";

export default async function AdminWorkflowsPage() {
  const allowed = (await can("admin")) || (await can("workflow.manage"));
  if (!allowed) redirect("/dashboard");

  const data = await getWorkflows();
  if (!data) notFound();

  const runs = await getWorkflowRuns(undefined, 15);

  return <WorkflowsClient workflows={data.workflows} canManage={data.canManage} runs={runs ?? []} />;
}