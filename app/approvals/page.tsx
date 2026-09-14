import { ApprovalsPageClient } from "@/components/approvals/approvals-page-client";
import { approvalMocks } from "@/lib/mock-approvals";

export default function ApprovalsPage() {
  return <ApprovalsPageClient initialApprovals={approvalMocks} />;
}