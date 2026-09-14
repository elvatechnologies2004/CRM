import type {
  ContactActivity,
  ContactRecord,
  CrmDeal,
  Invoice,
  LeadEmail,
  LeadFile,
  LeadMeeting,
  LeadNote,
  LeadTask,
  LeadWhatsAppMessage,
  SupportTicket,
} from "@/lib/types";

export const contactMocks: ContactRecord[] = [];

export const contactActivities: Record<string, ContactActivity[]> = {};

export const contactDeals: Record<string, CrmDeal[]> = {};

export const contactEmails: Record<string, LeadEmail[]> = {};

export const contactWhatsApp: Record<string, LeadWhatsAppMessage[]> = {};

export const contactMeetings: Record<string, LeadMeeting[]> = {};

export const contactTasks: Record<string, LeadTask[]> = {};

export const contactNotes: Record<string, LeadNote[]> = {};

export const contactFiles: Record<string, LeadFile[]> = {};

export const contactInvoices: Record<string, Invoice[]> = {};

export const contactTickets: Record<string, SupportTicket[]> = {};

export function getContactById(id: string): ContactRecord | undefined {
  return contactMocks.find((contact) => contact.id === id);
}

export function getContactsByCompany(companyId: string): ContactRecord[] {
  return contactMocks.filter((contact) => contact.companyId === companyId);
}

export function getContactActivities(contactId: string): ContactActivity[] {
  return contactActivities[contactId] ?? [];
}

export function getContactDeals(contactId: string): CrmDeal[] {
  return contactDeals[contactId] ?? [];
}

export function getContactEmails(contactId: string): LeadEmail[] {
  return contactEmails[contactId] ?? [];
}

export function getContactWhatsApp(contactId: string): LeadWhatsAppMessage[] {
  return contactWhatsApp[contactId] ?? [];
}

export function getContactMeetings(contactId: string): LeadMeeting[] {
  return contactMeetings[contactId] ?? [];
}

export function getContactTasks(contactId: string): LeadTask[] {
  return contactTasks[contactId] ?? [];
}

export function getContactNotes(contactId: string): LeadNote[] {
  return contactNotes[contactId] ?? [];
}

export function getContactFiles(contactId: string): LeadFile[] {
  return contactFiles[contactId] ?? [];
}

export function getContactInvoices(contactId: string): Invoice[] {
  return contactInvoices[contactId] ?? [];
}

export function getContactTickets(contactId: string): SupportTicket[] {
  return contactTickets[contactId] ?? [];
}