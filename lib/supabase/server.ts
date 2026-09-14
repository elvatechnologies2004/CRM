import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "@/lib/env";

/**
 * Server Supabase client bound to the current request's session cookies.
 * Use in Server Components, Server Actions and Route Handlers.
 *
 * IMPORTANT: `cookies()` is async in Next.js 16 — always `await`.
 * Do not construct inside render loops; one per request is enough.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — the middleware already
          // refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}