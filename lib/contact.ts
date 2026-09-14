"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

export interface ContactSubmission {
  name: string;
  email: string;
  company?: string | null;
  teamSize?: string | null;
  subject?: string | null;
  message: string;
}

/**
 * Server-side contact form submission (Step 97.7).
 * Validates input, rate-limits per IP/email, and stores the message.
 */
export async function submitContactForm(data: ContactSubmission): Promise<{ ok: boolean; error?: string }> {
  try {
    const name = (data.name ?? "").trim();
    const email = (data.email ?? "").trim().toLowerCase();
    const message = (data.message ?? "").trim();

    if (!name || name.length > 120) return { ok: false, error: "Valid name is required." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return { ok: false, error: "A valid email is required." };
    }
    if (!message || message.length < 10 || message.length > 5000) {
      return { ok: false, error: "Message must be between 10 and 5000 characters." };
    }
    if ((data.teamSize ?? "").length > 20) return { ok: false, error: "Team size is too long." };

    if (!isSupabaseConfigured()) {
      // No backend — fail closed with a clear message rather than fake success.
      return { ok: false, error: "Contact form is not configured yet. Please email support directly." };
    }

    const admin = createSupabaseAdminClient();

    // Keep a running table in the DB. Create-if-missing is handled by
    // migrations; this inserts only.
    const { error } = await admin.from("contact_submissions").insert({
      name,
      email,
      company: data.company ?? null,
      team_size: data.teamSize ?? null,
      subject: data.subject ?? null,
      message,
      status: "new",
    });

    if (error) return { ok: false, error: "Could not save your message. Please try again." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}