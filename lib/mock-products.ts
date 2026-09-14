import type { CrmProduct, ProductType } from "@/lib/types";
import { iso } from "@/lib/date-utils";

export const productTypes: ProductType[] = ["Product", "Service", "Subscription"];

export const productMocks: CrmProduct[] = [
  {
    id: "pr_001",
    name: "Enterprise Automation Suite",
    sku: "ENT-AUTO-001",
    type: "Product",
    category: "Software",
    description: "Full platform access with unlimited users and advanced analytics.",
    unitPrice: 999,
    currency: "USD",
    taxRate: 0.1,
    status: "Active",
    createdAt: iso(30, "10:00"),
  },
  {
    id: "pr_002",
    name: "Integration Pack",
    sku: "INT-PACK-001",
    type: "Service",
    category: "Implementation",
    description: "Custom API integrations and middleware setup.",
    unitPrice: 2990,
    currency: "USD",
    taxRate: 0.15,
    status: "Active",
    createdAt: iso(25, "14:00"),
  },
  {
    id: "pr_003",
    name: "Premium Support",
    sku: "PREM-SUPPORT-001",
    type: "Service",
    category: "Support",
    description: "24/7 dedicated account manager and priority SLA.",
    unitPrice: 199,
    currency: "USD",
    taxRate: 0.1,
    status: "Active",
    createdAt: iso(20, "09:00"),
  },
  {
    id: "pr_004",
    name: "Monthly Subscription",
    sku: "SUB-MONTH-001",
    type: "Subscription",
    category: "Subscription",
    description: "Monthly billing for the Automation Suite platform.",
    unitPrice: 99,
    currency: "USD",
    taxRate: 0.1,
    status: "Active",
    createdAt: iso(15, "11:00"),
  },
  {
    id: "pr_005",
    name: "Basic Plan",
    sku: "BASIC-001",
    type: "Subscription",
    category: "Subscription",
    description: "Entry-level access for small teams.",
    unitPrice: 29,
    currency: "USD",
    taxRate: 0.1,
    status: "Inactive",
    createdAt: iso(10, "09:00"),
  },
  {
    id: "pr_006",
    name: "Data Migration Service",
    sku: "MIG-001",
    type: "Service",
    category: "Implementation",
    description: "One-time data migration from legacy systems to Relvo platform.",
    unitPrice: 4990,
    currency: "USD",
    taxRate: 0.2,
    status: "Active",
    createdAt: iso(5, "16:00"),
  },
  {
    id: "pr_007",
    name: "Annual Subscription",
    sku: "SUB-ANN-001",
    type: "Subscription",
    category: "Subscription",
    description: "Annual billing for the Automation Suite — 2 months free.",
    unitPrice: 999,
    currency: "USD",
    taxRate: 0.1,
    status: "Active",
    createdAt: iso(1, "09:00"),
  },
];

export function getProductById(id: string): CrmProduct | undefined {
  return productMocks.find((p) => p.id === id);
}

export function productStatusLabel(status: string): string {
  if (status === "Active") return "Active";
  return "Inactive";
}