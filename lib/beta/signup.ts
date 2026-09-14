"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

export interface BetaSignupSubmission {
  name: string;
  email: string;
  company?: string | null;
  reason?: string | null;
}

/**
 * Request access to the beta program (Step 104).
 * Inserts into beta_signups. Delivers an email only if delivery is
 * configured (provider abstraction already handles that centrally).
 */
export async function submitBetaSignup(data: BetaSignupSubmission): Promise<{ ok: boolean; error?: string }> {
  try {
    const name = (data.name ?? "").trim();
    const email = (data.email ?? "").trim().toLowerCase();
    const reason = (data.reason ?? "").trim();

    if (!name || name.length > 120) return { ok: false, error: "Valid name is required." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return { ok: false, error: "A valid email is required." };
    }
    if (reason.length > 2000) return { ok: false, error: "Reason is too long." };
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Beta signups are not configured yet. Please email us directly." };
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("beta_signups").insert({
      name,
      email,
      company: data.company ?? null,
      reason: reason || null,
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "This email already applied for beta access." };
      return { ok: false, error: "Could not save your request. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}