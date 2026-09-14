import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentSubscription } from "@/lib/billing/subscriptions";
import { sendTransactionalEmail } from "./send";

/** Days remaining at which we remind about a trial. */
const REMIND_AT_DAYS = 3;

/**
 * Send the trial-ending reminder email (best-effort, at most once per
 * 24h for the same org). Called from the billing page render so a human
 * visiting billing near the end of a trial triggers it. Delivery is
 * skipped (logged) when no provider is configured — never faked.
 */
export async function maybeSendTrialReminder(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;

    const { subscription } = await getCurrentSubscription();
    if (!subscription || subscription.status !== "trialing" || !subscription.trialEndsAt) {
      return;
    }

    const msLeft = new Date(subscription.trialEndsAt).getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    if (daysLeft > REMIND_AT_DAYS) return;

    // Idempotency: skip if we already sent a reminder in the last 24h.
    // Asked via admin client so dedup works for any role.
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count } = await createSupabaseAdminClient()
      .from("transactional_email_logs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", subscription.organizationId)
      .eq("template", "trial_reminder")
      .gte("created_at", dayAgo);
    if ((count ?? 0) > 0) return;

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() || user.email.split("@")[0];

    await sendTransactionalEmail({
      organizationId: subscription.organizationId,
      to: [user.email],
      template: "trial_reminder",
      data: {
        name,
        daysLeft: Math.max(1, daysLeft),
        billingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/settings/billing`,
      },
    });
  } catch {
    // Best-effort — a reminder failure must not break the billing page.
  }
}