import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { ensureWorkspace } from "@/lib/crm/workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureOrgSubscription } from "@/lib/billing/subscriptions";
import { sendTransactionalEmail } from "@/lib/email/send";
import { trackEvent } from "@/lib/analytics/track";

/**
 * POST /api/auth/onboard
 * Client-side onboarding hook: after login/signup a session exists but
 * the org may not. Runs the idempotent workspace bootstrap + Pro trial
 * enrollment server-side, then sends the welcome email (Step 100) and
 * records the event (Step 99).
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, organizationId: null }, { status: 503 });
  }

  const orgId = await ensureWorkspace();
  // Idempotent: starts a 14-day Pro trial when the org has no subscription.
  if (orgId) {
    await ensureOrgSubscription(orgId);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() ||
      (typeof meta.full_name === "string" ? meta.full_name : "") ||
      (user.email.split("@")[0] ?? "there");

    await sendTransactionalEmail({
      organizationId: orgId,
      to: [user.email],
      template: "welcome",
      data: {
        name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login`,
      },
    });
  }

  if (user?.id) {
    await trackEvent({
      eventName: "app.opened",
      organizationId: orgId,
      properties: { stage: "onboarding" },
    });
  }

  return NextResponse.json({ ok: Boolean(orgId), organizationId: orgId ?? null });
}