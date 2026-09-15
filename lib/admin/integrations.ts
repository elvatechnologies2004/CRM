import "server-only";

import { isGeminiConfigured, isSupabaseConfigured, stripeEnv } from "@/lib/env";

export type IntegrationStatus =
  | "Connected"
  | "Configured"
  | "Not Configured"
  | "Warning"
  | "Error";

export interface IntegrationCard {
  id: string;
  label: string;
  description: string;
  status: IntegrationStatus;
  detail: string;
  lastChecked: string;
}

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/**
 * Platform integration status is derived from real environment/provider
 * configuration. Nothing is reported "Connected" unless it is genuinely
 * configured. Live reachability probes are intentionally not faked.
 */
export async function getIntegrationStatuses(): Promise<IntegrationCard[]> {
  const now = new Date().toISOString();

  const cards: IntegrationCard[] = [
    {
      id: "supabase",
      label: "Supabase",
      description: "Postgres database, auth and storage backend",
      status: isSupabaseConfigured() ? "Connected" : "Not Configured",
      detail: isSupabaseConfigured() ? "URL + keys configured" : "Add NEXT_PUBLIC_SUPABASE_URL and keys",
      lastChecked: now,
    },
    {
      id: "email",
      label: "Email",
      description: "Transactional email + IMAP/Gmail sync",
      status:
        hasEnv("EMAIL_PROVIDER") || hasEnv("RESEND_API_KEY") || hasEnv("SMTP_HOST")
          ? "Configured"
          : "Not Configured",
      detail:
        hasEnv("EMAIL_PROVIDER")
          ? `Provider: ${process.env.EMAIL_PROVIDER}`
          : "EMAIL_PROVIDER / SMTP_HOST required",
      lastChecked: now,
    },
    {
      id: "ai",
      label: "AI Provider",
      description: "Gemini assistant, scoring, summaries",
      status: isGeminiConfigured() ? "Connected" : "Not Configured",
      detail: isGeminiConfigured() ? `Model: ${process.env.GEMINI_MODEL ?? "default"}` : "Add GEMINI_API_KEY",
      lastChecked: now,
    },
    {
      id: "stripe",
      label: "Stripe / Billing",
      description: "Subscription payments and webhooks",
      status: stripeEnv.isConfigured
        ? "Connected"
        : stripeEnv.secretKey
          ? "Warning"
          : "Not Configured",
      detail: stripeEnv.isConfigured
        ? "Secret + webhook configured"
        : stripeEnv.secretKey
          ? "Webhook secret missing"
          : "Add STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET",
      lastChecked: now,
    },
    {
      id: "google",
      label: "Google",
      description: "Gmail sync and calendar provider",
      status:
        hasEnv("GOOGLE_CLIENT_ID") && hasEnv("GOOGLE_CLIENT_SECRET")
          ? "Configured"
          : "Not Configured",
      detail:
        hasEnv("GOOGLE_CLIENT_ID") && hasEnv("GOOGLE_CLIENT_SECRET")
          ? "OAuth credentials present"
          : "Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
      lastChecked: now,
    },
    {
      id: "microsoft",
      label: "Microsoft",
      description: "Outlook sync and calendar provider",
      status:
        hasEnv("MICROSOFT_CLIENT_ID") && hasEnv("MICROSOFT_CLIENT_SECRET")
          ? "Configured"
          : "Not Configured",
      detail:
        hasEnv("MICROSOFT_CLIENT_ID") && hasEnv("MICROSOFT_CLIENT_SECRET")
          ? "OAuth credentials present"
          : "Add MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET",
      lastChecked: now,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      description: "WhatsApp business messaging channel",
      status:
        hasEnv("WHATSAPP_API_TOKEN") && hasEnv("WHATSAPP_PHONE_ID")
          ? "Configured"
          : "Not Configured",
      detail:
        hasEnv("WHATSAPP_API_TOKEN") && hasEnv("WHATSAPP_PHONE_ID")
          ? "API token present"
          : "Not configured",
      lastChecked: now,
    },
    {
      id: "webhooks",
      label: "Webhooks",
      description: "Inbound service webhooks",
      status: hasEnv("WEBHOOK_SIGNING_SECRET") ? "Configured" : "Not Configured",
      detail: hasEnv("WEBHOOK_SIGNING_SECRET") ? "Signing secret configured" : "Not configured",
      lastChecked: now,
    },
    {
      id: "storage",
      label: "Storage",
      description: "File attachment storage buckets",
      status: isSupabaseConfigured() ? "Connected" : "Not Configured",
      detail: isSupabaseConfigured() ? "Supabase Storage available" : "Requires Supabase",
      lastChecked: now,
    },
  ];

  return cards;
}