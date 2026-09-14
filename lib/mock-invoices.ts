import type { CrmInvoice, InvoiceStatus } from "@/lib/types";

export const invoiceStatuses: InvoiceStatus[] = [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
  "Cancelled",
];

export const invoiceMocks: CrmInvoice[] = [];

export function getInvoiceById(id: string): CrmInvoice | undefined {
  return invoiceMocks.find((i) => i.id === id);
}