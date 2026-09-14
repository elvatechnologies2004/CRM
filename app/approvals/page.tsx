import { redirect } from "next/navigation";

import { ApprovalsPageClient } from "@/components/approvals/approvals-page-client";
import { can } from "@/lib/crm/context";
import { getApprovalPolicies, getApprovalRequests } from "@/lib/approvals/engine";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const allowed = (await can("admin")) || (await can("approval.manage"));
  if (!allowed) redirect("/dashboard");

  const requests = await getApprovalRequests("inbox");
  const policies = await getApprovalPolicies();

  return (
    <ApprovalsPageClient
      requests={requests ?? []}
      policies={policies ?? []}
      canManage={await can("approval.manage")}
    />
  );
}