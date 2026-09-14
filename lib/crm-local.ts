"use client";

import type { CompanyRecord, ContactRecord, LeadTask } from "@/lib/types";

const CONTACTS_KEY = "relvo.contacts";
const COMPANIES_KEY = "relvo.companies";
const DELETED_CONTACTS_KEY = "relvo.deleted-contacts";
const DELETED_COMPANIES_KEY = "relvo.deleted-companies";
const ARCHIVED_CONTACTS_KEY = "relvo.archived-contacts";
const ARCHIVED_COMPANIES_KEY = "relvo.archived-companies";
const TASKS_KEY = "relvo.contact-tasks";
const DEALS_KEY = "relvo.crm-deals";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/* ------------------------------- Contacts ------------------------------- */

export function readStoredContacts(): ContactRecord[] {
  return read<ContactRecord[]>(CONTACTS_KEY, []);
}

export function readStoredCompanies(): CompanyRecord[] {
  return read<CompanyRecord[]>(COMPANIES_KEY, []);
}

export function upsertContact(record: ContactRecord) {
  const all = readStoredContacts();
  const index = all.findIndex((candidate) => candidate.id === record.id);
  if (index >= 0) {
    all[index] = record;
  } else {
    all.push(record);
  }
  write(CONTACTS_KEY, all);
}

export function upsertCompany(record: CompanyRecord) {
  const all = readStoredCompanies();
  const index = all.findIndex((candidate) => candidate.id === record.id);
  if (index >= 0) {
    all[index] = record;
  } else {
    all.push(record);
  }
  write(COMPANIES_KEY, all);
}

export function readDeletedContactIds(): string[] {
  return read<string[]>(DELETED_CONTACTS_KEY, []);
}

export function markContactDeleted(contactId: string) {
  const existing = readDeletedContactIds();
  if (!existing.includes(contactId)) {
    write(DELETED_CONTACTS_KEY, [...existing, contactId]);
  }
}

export function readDeletedCompanyIds(): string[] {
  return read<string[]>(DELETED_COMPANIES_KEY, []);
}

export function markCompanyDeleted(companyId: string) {
  const existing = readDeletedCompanyIds();
  if (!existing.includes(companyId)) {
    write(DELETED_COMPANIES_KEY, [...existing, companyId]);
  }
}

export function readArchivedContactIds(): string[] {
  return read<string[]>(ARCHIVED_CONTACTS_KEY, []);
}

export function markContactArchived(contactId: string) {
  const existing = readArchivedContactIds();
  if (!existing.includes(contactId)) {
    write(ARCHIVED_CONTACTS_KEY, [...existing, contactId]);
  }
}

export function readArchivedCompanyIds(): string[] {
  return read<string[]>(ARCHIVED_COMPANIES_KEY, []);
}

export function markCompanyArchived(companyId: string) {
  const existing = readArchivedCompanyIds();
  if (!existing.includes(companyId)) {
    write(ARCHIVED_COMPANIES_KEY, [...existing, companyId]);
  }
}

/* --------------------------- Contact tasks ------------------------------ */

export function readContactTasks(): Record<string, LeadTask[]> {
  return read<Record<string, LeadTask[]>>(TASKS_KEY, {});
}

export function writeContactTask(contactId: string, task: LeadTask) {
  const all = readContactTasks();
  const list = all[contactId] ?? [];
  all[contactId] = [task, ...list];
  write(TASKS_KEY, all);
}

export function updateContactTasks(contactId: string, tasks: LeadTask[]) {
  const all = readContactTasks();
  all[contactId] = tasks;
  write(TASKS_KEY, all);
}

/* ------------------------------- Deals ---------------------------------- */

export function readAddedDeals(): Record<string, unknown> {
  return read<Record<string, unknown>>(DEALS_KEY, {});
}

export function writeAddedDeal(category: string, deal: unknown) {
  const all = readAddedDeals();
  const list = (all[category] as unknown[]) ?? [];
  all[category] = [...list, deal];
  write(DEALS_KEY, all);
}