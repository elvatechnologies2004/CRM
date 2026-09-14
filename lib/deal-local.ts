"use client";

import type { DealRecord } from "@/lib/types";

const DEALS_KEY = "finlonexa.deals";

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

/* ------------------------------- Deals ------------------------------- */

export function readStoredDeals(): DealRecord[] {
  return read<DealRecord[]>(DEALS_KEY, []);
}

export function upsertDeal(deal: DealRecord) {
  const all = readStoredDeals();
  const index = all.findIndex((candidate) => candidate.id === deal.id);
  if (index >= 0) {
    all[index] = deal;
  } else {
    all.push(deal);
  }
  write(DEALS_KEY, all);
}

export function deleteDeal(dealId: string) {
  const all = readStoredDeals().filter((deal) => deal.id !== dealId);
  write(DEALS_KEY, all);
}

export function readAddedDeals(): Record<string, DealRecord[]> {
  return read<Record<string, DealRecord[]>>("finlonexa.deal-tasks", {});
}

export function writeAddedDeal(category: string, deal: DealRecord) {
  const all = readAddedDeals();
  const list = all[category] ?? [];
  all[category] = [...list, deal];
  write("finlonexa.deal-tasks", all);
}