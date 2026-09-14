import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { isEmailDeliveryConfigured } from "@/lib/email/provider";

/**
 * GET /api/health
 * Liveness + readiness probe for uptime monitoring (Step 105/110).
 * Returns:
 *   - status: ok | degraded
 *   - checks: per-dependency state (never secrets, never error internals)
 *   - version / timestamp
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "skipped" | "degraded"> = {
    supabase: "skipped",
    database: "skipped",
    stripe: "skipped",
    email: "skipped",
  };

  // Supabase configured?
  if (isSupabaseConfigured()) {
    checks.supabase = "ok";
    try {
      const server = await createSupabaseServerClient();
      // Cheap, non-sensitive read to verify connectivity. RLS filters rows
      // for anonymized/anonymous users rather than erroring, so this is a
      // pure connectivity probe (no false "degraded" for lack of a session).
      const { error } = await server.from("organizations").select("id").limit(1);
      checks.database = error ? "degraded" : "ok";
    } catch {
      checks.database = "degraded";
    }
  }

  checks.stripe = isStripeConfigured() ? "ok" : "skipped";
  checks.email = isEmailDeliveryConfigured() ? "ok" : "skipped";

  const degraded = Object.values(checks).includes("degraded");
  const status = degraded ? "degraded" : "ok";

  return NextResponse.json(
    {
      status,
      checks,
      version: process.env.npm_package_version ?? "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: status === "ok" ? 200 : 503 },
  );
}