import Link from "next/link";

import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";
import { Badge } from "@/components/ui/badge";

// Status reflects actual configuration: never claim unconfigured
// integrations are live (Step 97.5).
const INTEGRATIONS = [
  { name: "Gmail", desc: "Shared inbox and sequences", status: "Beta" as const },
  { name: "Outlook", desc: "Email sync and sequences", status: "Beta" as const },
  { name: "WhatsApp", desc: "Two-way messaging", status: "Available" as const },
  { name: "Google Calendar", desc: "Meeting scheduling", status: "Beta" as const },
  { name: "Microsoft Calendar", desc: "Outlook scheduling", status: "Coming Soon" as const },
  { name: "Slack", desc: "Alerts and approvals", status: "Coming Soon" as const },
  { name: "Zoom", desc: "Meet links and recordings", status: "Coming Soon" as const },
  { name: "Stripe", desc: "Subscription billing", status: "Beta" as const },
  { name: "PayPal", desc: "Payments", status: "Coming Soon" as const },
  { name: "QuickBooks", desc: "Invoicing sync", status: "Coming Soon" as const },
  { name: "Shopify", desc: "Orders and customers", status: "Coming Soon" as const },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Integrations</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Connect the tools you already use. Status labels reflect what is actually configured.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((integration) => (
              <div key={integration.name} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-ink">{integration.name}</h2>
                  <Badge
                    variant={
                      integration.status === "Beta"
                        ? "info"
                        : integration.status === "Coming Soon"
                          ? "secondary"
                          : "success"
                    }
                  >
                    {integration.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{integration.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Need an integration? <Link href="/contact" className="text-primary hover:underline">Tell us</Link>
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}