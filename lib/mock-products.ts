import type { CrmProduct, ProductType } from "@/lib/types";

export const productTypes: ProductType[] = ["Product", "Service", "Subscription"];

export const productMocks: CrmProduct[] = [];

export function getProductById(id: string): CrmProduct | undefined {
  return productMocks.find((p) => p.id === id);
}

export function productStatusLabel(status: string): string {
  if (status === "Active") return "Active";
  return "Inactive";
}