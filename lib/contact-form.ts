import type {
  CompanyAccountStatus,
  CompanyIndustry,
  CompanyRecord,
  ContactRecord,
  ContactLifecycle,
  LeadSourceOption,
  PreferredChannel,
} from "@/lib/types";
import { leadOwners } from "@/lib/mock-leads";
import { parseTags } from "@/lib/lead-form";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  whatsapp: string;
  companyId: string;
  companyName: string;
  lifecycleStage: ContactLifecycle;
  ownerName: string;
  source: LeadSourceOption;
  country: string;
  city: string;
  address: string;
  tags: string;
  preferredChannel: PreferredChannel;
  preferredLanguage: string;
}

export const emptyContactForm: ContactFormData = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  email: "",
  phone: "",
  whatsapp: "",
  companyId: "",
  companyName: "",
  lifecycleStage: "Lead",
  ownerName: leadOwners[0].name,
  source: "Manual",
  country: "",
  city: "",
  address: "",
  tags: "",
  preferredChannel: "Email",
  preferredLanguage: "English",
};

interface BuildContactOptions {
  existing?: ContactRecord;
}

export function buildContactRecord(
  data: ContactFormData,
  options: BuildContactOptions = {}
): ContactRecord {
  const owner = leadOwners.find((candidate) => candidate.name === data.ownerName);
  const now = new Date().toISOString();
  const id = options.existing?.id ?? `c_${Date.now().toString(36)}`;

  return {
    id,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    jobTitle: data.jobTitle.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    whatsapp: data.whatsapp.trim() || data.phone.trim(),
    companyId: data.companyId || undefined,
    companyName: data.companyName.trim(),
    lifecycleStage: data.lifecycleStage,
    ownerId: owner?.id ?? "u_1",
    ownerName: owner?.name ?? data.ownerName,
    source: data.source,
    country: data.country.trim(),
    city: data.city.trim(),
    address: data.address.trim(),
    tags: parseTags(data.tags),
    preferredChannel: data.preferredChannel,
    preferredLanguage: data.preferredLanguage.trim() || "English",
    createdAt: options.existing?.createdAt ?? now,
    updatedAt: now,
    lastActivityAt: options.existing?.lastActivityAt ?? now,
    nextActivityAt: options.existing?.nextActivityAt,
  };
}

export interface ContactEditFormData {
  jobTitle: string;
  email: string;
  phone: string;
  whatsapp: string;
  lifecycleStage: ContactLifecycle;
  preferredChannel: PreferredChannel;
  country: string;
  city: string;
  address: string;
  tags: string;
}

export function applyContactEdit(
  existing: ContactRecord,
  data: ContactEditFormData
): ContactRecord {
  const now = new Date().toISOString();
  return {
    ...existing,
    jobTitle: data.jobTitle.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    whatsapp: data.whatsapp.trim() || data.phone.trim(),
    lifecycleStage: data.lifecycleStage,
    preferredChannel: data.preferredChannel,
    country: data.country.trim(),
    city: data.city.trim(),
    address: data.address.trim(),
    tags: parseTags(data.tags),
    updatedAt: now,
    lastActivityAt: now,
  };
}

export interface CompanyFormData {
  name: string;
  domain: string;
  website: string;
  industry: CompanyIndustry;
  companySize: string;
  employeeCount: string;
  annualRevenue: string;
  currency: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  accountStatus: CompanyAccountStatus;
  ownerName: string;
  source: LeadSourceOption;
  tags: string;
  description: string;
  previousId?: string;
}

export const emptyCompanyForm: CompanyFormData = {
  name: "",
  domain: "",
  website: "",
  industry: "Software",
  companySize: "11–50",
  employeeCount: "",
  annualRevenue: "",
  currency: "PKR",
  phone: "",
  email: "",
  country: "",
  city: "",
  address: "",
  accountStatus: "Prospect",
  ownerName: leadOwners[0].name,
  source: "Manual",
  tags: "",
  description: "",
};

export function buildCompanyRecord(data: CompanyFormData): CompanyRecord {
  const owner = leadOwners.find((candidate) => candidate.name === data.ownerName);
  const now = new Date().toISOString();
  const id = `co_${Date.now().toString(36)}`;

  return {
    id,
    name: data.name.trim(),
    domain: data.domain.trim(),
    website: data.website.trim() || `https://${data.domain.trim()}`,
    industry: data.industry,
    companySize: data.companySize,
    employeeCount: Number(data.employeeCount) || 0,
    annualRevenue: data.annualRevenue.trim() || "—",
    currency: data.currency,
    phone: data.phone.trim(),
    email: data.email.trim(),
    country: data.country.trim(),
    city: data.city.trim(),
    address: data.address.trim(),
    accountStatus: data.accountStatus,
    ownerId: owner?.id ?? "u_1",
    ownerName: owner?.name ?? data.ownerName,
    source: data.source,
    tags: parseTags(data.tags),
    description: data.description.trim(),
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };
}

export interface CompanyEditFormData {
  industry: CompanyIndustry;
  companySize: string;
  employeeCount: string;
  annualRevenue: string;
  phone: string;
  email: string;
  website: string;
  country: string;
  city: string;
  address: string;
  accountStatus: CompanyAccountStatus;
  tags: string;
  description: string;
}

export function applyCompanyEdit(
  existing: CompanyRecord,
  data: CompanyEditFormData
): CompanyRecord {
  const now = new Date().toISOString();
  return {
    ...existing,
    industry: data.industry,
    companySize: data.companySize,
    employeeCount: Number(data.employeeCount) || 0,
    annualRevenue: data.annualRevenue.trim() || "—",
    currency: existing.currency,
    phone: data.phone.trim(),
    email: data.email.trim(),
    website: data.website.trim() || `https://${existing.domain}`,
    country: data.country.trim(),
    city: data.city.trim(),
    address: data.address.trim(),
    accountStatus: data.accountStatus,
    tags: parseTags(data.tags),
    description: data.description.trim(),
    updatedAt: now,
    lastActivityAt: now,
  };
}