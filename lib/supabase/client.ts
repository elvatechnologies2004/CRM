"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "@/lib/env";

/**
 * Singleton browser Supabase client.
 * Safe to use from client components; the anon key is public by design.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(supabaseEnv.url, supabaseEnv.anonKey);
  return browserClient;
}