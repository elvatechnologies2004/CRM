import { CustomerSuccessPageClient } from "@/components/customer-success/customer-success-page-client";
import { customerSuccessMocks } from "@/lib/mock-customer-success";

export default function CustomerSuccessPage() {
  return <CustomerSuccessPageClient initialCustomerSuccess={customerSuccessMocks} />;
}