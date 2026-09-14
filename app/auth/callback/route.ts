import { NextResponse } from "next/server";

import { ensureWorkspace } from "@/lib/crm/workspace";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Exchanges Supabase auth links (email confirmation, reset password,
 * magic links) for a real session, bootstraps the user's workspace,
 * and redirects to the intended destination (Step 44).
 *
 * Handles both the `code` flow and the `token_hash` flow.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // No Supabase configured — nothing to exchange; pass through.
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const supabase = await createSupabaseServerClient();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
  }

  await ensureWorkspace();

  return NextResponse.redirect(`${origin}${safeNext}`);
}