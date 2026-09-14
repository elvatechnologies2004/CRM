"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

export interface FeedbackSubmission {
  category: "bug" | "feedback" | "enhancement";
  title: string;
  body: string;
  page?: string | null;
}

/**
 * Authenticated feedback / bug-report capture (Phase 5).
 * Records against the current org + user; keeps body content (this is the
 * beta feedback channel, explicitly user-submitted, and is used to
 * prioritize the roadmap).
 */
export async function submitFeedback(data: FeedbackSubmission): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) return { ok: false, error: "Feedback is not configured yet." };

    const title = (data.title ?? "").trim();
    const body = (data.body ?? "").trim();
    const validCategories = ["bug", "feedback", "enhancement"];
    if (!validCategories.includes(data.category)) return { ok: false, error: "Invalid category." };
    if (!title || title.length > 160) return { ok: false, error: "A title under 160 characters is required." };
    if (!body || body.length < 10 || body.length > 5000) {
      return { ok: false, error: "Description must be between 10 and 5000 characters." };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in." };

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!member) return { ok: false, error: "No active workspace." };

    const admin = createSupabaseAdminClient();
    // upsert table created in the beta migration (pdfeedback) — see migration 20260914150300.
    const { error } = await admin.from("feedback").insert({
      organization_id: member.organization_id,
      user_id: user.id,
      category: data.category,
      title,
      body,
      page: data.page ?? null,
      status: "open",
    });
    if (error) return { ok: false, error: "Could not save your feedback. Please try again." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}