import { ReportsPageClient } from "@/components/reports/reports-page-client";
import { reportMocks } from "@/lib/mock-reports";

export default function ReportsPage() {
  return <ReportsPageClient initialReports={reportMocks} />;
}