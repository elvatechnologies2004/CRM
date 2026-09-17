"use client";

import type { QuoteRecord } from "@/lib/types";

const QUOTES_KEY = "finlonexa.quotes";

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

export function readStoredQuotes(): QuoteRecord[] {
  return read<QuoteRecord[]>(QUOTES_KEY, []);
}

export function upsertQuote(quote: QuoteRecord) {
  const all = readStoredQuotes();
  const index = all.findIndex((candidate) => candidate.id === quote.id);
  if (index >= 0) {
    all[index] = quote;
  } else {
    all.push(quote);
  }
  write(QUOTES_KEY, all);
}

export function deleteQuote(quoteId: string) {
  const all = readStoredQuotes().filter((quote) => quote.id !== quoteId);
  write(QUOTES_KEY, all);
}