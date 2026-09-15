/**
 * Centralized env access for Supabase configuration.
 * Returns empty strings when not configured so the app can gracefully
 * fall back to local/mock data during development.
 *
 * Both the 2026 opaque key format (sb_publishable_… / sb_secret_…) and the
 * legacy JWT anon / service_role keys are accepted.
 */
export const supabaseEnv = {
  get url(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  },
  /** Publishable key (sb_publishable_…) or legacy anon key. */
  get anonKey(): string {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      ""
    );
  },
  /** Alias matching Supabase's 2026 key naming. */
  get publishableKey(): string {
    return this.anonKey;
  },
  /** Secret key (sb_secret_…) or legacy service-role key — server-only. Never prefix with NEXT_PUBLIC_. */
  get serviceRoleKey(): string {
    return (
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ""
    );
  },
  /** Alias matching Supabase's 2026 key naming. */
  get secretKey(): string {
    return this.serviceRoleKey;
  },
  get isConfigured(): boolean {
    return Boolean(this.url && this.anonKey);
  },
};

/** True when the app should attempt Supabase-backed flows. */
export const isSupabaseConfigured = (): boolean => supabaseEnv.isConfigured;

/**
 * Gemini AI configuration — server-only (never prefix with NEXT_PUBLIC_).
 */
export const geminiEnv = {
  get apiKey(): string {
    return process.env.GEMINI_API_KEY ?? "";
  },
  get model(): string {
    return process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
  },
  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  },
};

/** True when Gemini text generation is available (server-side). */
export const isGeminiConfigured = (): boolean => geminiEnv.isConfigured;

/**
 * Stripe billing configuration (Steps 96). All of these are server-only
 * except the publishable key. Never export secret key / webhook secret to
 * the client.
 */
export const stripeEnv = {
  get secretKey(): string {
    return process.env.STRIPE_SECRET_KEY ?? "";
  },
  get webhookSecret(): string {
    return process.env.STRIPE_WEBHOOK_SECRET ?? "";
  },
  get publishableKey(): string {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  },
  get isConfigured(): boolean {
    return Boolean(this.secretKey) && Boolean(this.webhookSecret);
  },
};

/**
 * Provider price-id mapping for internal plans (Step 96.3).
 * These are set in the environment / config table, never hardcoded in UI.
 */
export const stripePriceIds = {
  starterMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? "",
  starterYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID ?? "",
  proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
};

/** Price id for a plan code + billing cycle ("" when unconfigured). */
export function getStripePriceId(
  planCode: "free" | "starter" | "pro",
  cycle: "monthly" | "yearly",
): string {
  if (planCode === "free") return "";
  const map =
    planCode === "starter"
      ? cycle === "monthly"
        ? stripePriceIds.starterMonthly
        : stripePriceIds.starterYearly
      : cycle === "monthly"
        ? stripePriceIds.proMonthly
        : stripePriceIds.proYearly;
  return map;
}