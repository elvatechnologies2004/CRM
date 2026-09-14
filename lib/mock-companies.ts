import type {
  AccountHealth,
  CompanyActivity,
  CompanyContactLink,
  CompanyProject,
  CompanyRecord,
  CrmDeal,
  Invoice,
  SupportTicket,
} from "@/lib/types";

export const companyMocks: CompanyRecord[] = [];

export const companyContacts: Record<string, CompanyContactLink[]> = {};

export const companyDeals: Record<string, CrmDeal[]> = {};

export const companyActivities: Record<string, CompanyActivity[]> = {};

export const companyInvoices: Record<string, Invoice[]> = {};

export const companyProjects: Record<string, CompanyProject[]> = {};

export const companyTickets: Record<string, SupportTicket[]> = {};

export const accountHealth: Record<string, AccountHealth> = {};

export function getCompanyById(id: string): CompanyRecord | undefined {
  return companyMocks.find((company) => company.id === id);
}

export function getCompanyContacts(companyId: string): CompanyContactLink[] {
  return companyContacts[companyId] ?? [];
}

export function getCompanyDeals(companyId: string): CrmDeal[] {
  return companyDeals[companyId] ?? [];
}

export function getCompanyActivities(companyId: string): CompanyActivity[] {
  return companyActivities[companyId] ?? [];
}

export function getCompanyInvoices(companyId: string): Invoice[] {
  return companyInvoices[companyId] ?? [];
}

export function getCompanyProjects(companyId: string): CompanyProject[] {
  return companyProjects[companyId] ?? [];
}

export function getCompanyTickets(companyId: string): SupportTicket[] {
  return companyTickets[companyId] ?? [];
}

export function getAccountHealth(companyId: string): AccountHealth | undefined {
  return accountHealth[companyId];
}