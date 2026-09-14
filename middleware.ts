import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "@/lib/env";

/**
 * Auth gate + session refresh (Steps 05 / 90).
 *
 * Protected: all CRM routes unless they are public auth routes or
 * static assets. Unauthenticated users are redirected to /login
 * keeping the intended destination in ?next= so we can return them.
 *
 * When Supabase is not configured, every route stays open so the
 * mock/localStorage prototype keeps working untouched.
 */
const PUBLIC_AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth", // callback + verify handling
];

// Public marketing + legal pages (Step 97/101) — no login required.
const PUBLIC_MARKETING_PREFIXES = [
  "/features",
  "/ai-crm",
  "/automation",
  "/sales",
  "/pricing",
  "/integrations",
  "/security",
  "/about",
  "/contact",
  "/beta",
  "/privacy",
  "/terms",
  "/cookies",
  "/acceptable-use",
  "/updates",
];

// Public non-page routes: SEO files, health probe, analytics tracking,
// and Stripe webhooks (verification is signature-based inside the handler).
const PUBLIC_EXACT_PATHS = ["/robots.txt", "/sitemap.xml"];
const PUBLIC_API_PREFIXES = ["/api/health", "/api/track", "/api/webhooks/"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_AUTH_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (PUBLIC_MARKETING_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (PUBLIC_EXACT_PATHS.includes(pathname)) return true;
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!supabaseEnv.isConfigured) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() also refreshes an expired session via cookie setAll.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next static build outputs
     * - common static assets / favicon
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};