import "server-only";

import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "@/lib/env";

/**
 * Server Supabase client bound to the current request's session cookies.
 * Use in Server Components, Server Actions and Route Handlers.
 *
 * IMPORTANT: `cookies()` is async in Next.js 16 — always `await`.
 * The result is memoized per request with React `cache()` so the many
 * places that create a server client share ONE instance, avoiding
 * repeated session reads across a single render.
 */
export const createSupabaseServerClient = cache(async () => {
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
});