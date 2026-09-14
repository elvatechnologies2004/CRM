"use client";

import type { LeadTask } from "@/lib/types";

const STORAGE_KEY = "relvo.converted-deals";
const TASKS_KEY = "relvo.lead-tasks";
const DELETED_KEY = "relvo.deleted-leads";

export function readDeletedLeadIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markLeadDeleted(leadId: string) {
  const existing = readDeletedLeadIds();
  if (!existing.includes(leadId)) {
    window.localStorage.setItem(DELETED_KEY, JSON.stringify([...existing, leadId]));
  }
}

export function readConvertedDeals(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function writeConvertedDeal(leadId: string, dealId: string) {
  const all = readConvertedDeals();
  all[leadId] = dealId;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function readPersistedTasks(): Record<string, LeadTask[]> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LeadTask[]>) : {};
  } catch {
    return {};
  }
}

export function writePersistedTask(leadId: string, task: LeadTask) {
  const all = readPersistedTasks();
  const list = all[leadId] ?? [];
  all[leadId] = [task, ...list];
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(all));
}

export function updatePersistedTasks(leadId: string, tasks: LeadTask[]) {
  const all = readPersistedTasks();
  all[leadId] = tasks;
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(all));
}