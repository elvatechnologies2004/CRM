"use client";

import { useEffect } from "react";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Fire-and-forget client-side analytics (Step 99). Uses fetch + keepalive,
 * silently swallows errors, and reports to the allow-listed /api/track route.
 */
export async function trackClientEvent(
  eventName: string,
  properties: Record<string, JsonValue> = {},
): Promise<void> {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        properties: Object.fromEntries(Object.entries(properties).slice(0, 8)),
      }),
      keepalive: true,
    });
  } catch {
    // analytics must never break the UI
  }
}

/** Report structured page views for marketing pages + app shell. */
export function usePageTracking(page: string) {
  useEffect(() => {
    trackClientEvent("page.viewed", { page }).catch(() => {});
  }, [page]);
}

export function TagEvent() {
  return null;
}