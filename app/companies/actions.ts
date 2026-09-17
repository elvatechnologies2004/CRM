"use server";

import { revalidatePath } from "next/cache";

import { createCompany, updateCompany } from "@/lib/crm/companies";
import { parseTags } from "@/lib/lead-form";
import type { CompanyRecord } from "@/lib/types";

export interface CompanyActionResult {
  company: CompanyRecord | null;
  error: string | null;
}

export interface CompanyActionInput {
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  employeeCount?: string;
  annualRevenue?: string;
  currency?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  accountStatus?: string;
  ownerId?: string;
  source?: string;
  tags?: string;
  description?: string;
}

export async function createCompanyAction(input: CompanyActionInput): Promise<CompanyActionResult> {
  if (!input.name.trim()) {
    return { company: null, error: "Company name is required" };
  }
  const company = await createCompany({
    name: input.name.trim(),
    domain: input.domain?.trim() || undefined,
    website: input.website?.trim() || undefined,
    industry: input.industry || undefined,
    companySize: input.companySize || undefined,
    employeeCount: input.employeeCount ? Number(input.employeeCount) : undefined,
    annualRevenue: input.annualRevenue ? Number(input.annualRevenue) : undefined,
    currency: input.currency || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    address: input.address?.trim() || undefined,
    accountStatus: input.accountStatus || "Prospect",
    ownerId: input.ownerId || undefined,
    source: input.source || "Manual",
    tags: input.tags ? parseTags(input.tags) : [],
    description: input.description?.trim() || undefined,
  });
  if (!company) {
    return { company: null, error: "Failed to create company" };
  }
  revalidatePath("/companies");
  return { company, error: null };
}

export async function updateCompanyAction(input: CompanyActionInput & { id: string }): Promise<CompanyActionResult> {
  const company = await updateCompany({
    id: input.id,
    name: input.name.trim() || undefined,
    domain: input.domain?.trim() || undefined,
    website: input.website?.trim() || undefined,
    industry: input.industry || undefined,
    companySize: input.companySize || undefined,
    employeeCount: input.employeeCount ? Number(input.employeeCount) : undefined,
    annualRevenue: input.annualRevenue ? Number(input.annualRevenue) : undefined,
    currency: input.currency || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    address: input.address?.trim() || undefined,
    accountStatus: input.accountStatus || undefined,
    ownerId: input.ownerId || undefined,
    source: input.source || undefined,
    tags: input.tags ? parseTags(input.tags) : undefined,
    description: input.description?.trim() || undefined,
  });
  if (!company) {
    return { company: null, error: "Failed to update company" };
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${input.id}`);
  return { company, error: null };
}