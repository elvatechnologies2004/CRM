import { AIPageClient } from "@/components/ai/ai-page-client";
import { agentMocks } from "@/lib/mock-agents";
import { approvalMocks } from "@/lib/mock-approvals";

export default function AIPage() {
  const pendingApprovals = approvalMocks.filter((approval) => approval.status === "Pending").length;
  return <AIPageClient agentCount={agentMocks.length} pendingApprovals={pendingApprovals} />;
}