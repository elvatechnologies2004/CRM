import { SupportPageClient } from "@/components/Support/support-page-client";
import { supportTicketMocks } from "@/lib/mock-support-tickets";

export default function SupportPage() {
  return <SupportPageClient initialTickets={supportTicketMocks} />;
}