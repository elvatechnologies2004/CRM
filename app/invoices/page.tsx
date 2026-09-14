import { InvoicesPageClient } from "@/components/invoices/invoices-page-client";
import { invoiceMocks } from "@/lib/mock-invoices";

export default function InvoicesPage() {
  return <InvoicesPageClient initialInvoices={invoiceMocks} />;
}