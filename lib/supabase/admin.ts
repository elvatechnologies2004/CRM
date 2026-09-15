import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/env";

/**
 * Supabase ADMIN client (secret key or legacy service-role key).
 *
 * SECURITY RULES (Steps 42/89):
 * - Never import this into client components.
 * - Never expose SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_*.
 * - Use ONLY for trusted server operations: invitations, admin
 *   maintenance, notification fan-out. Ordinary CRUD must go through
 *   the normal (RLS-enforced) server/browser clients.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  if (!supabaseEnv.url || !supabaseEnv.serviceRoleKey) {
    throw new Error(
      "Platform admin database is not configured. Set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) and NEXT_PUBLIC_SUPABASE_URL in the server environment.",
    );
  }
  return createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}