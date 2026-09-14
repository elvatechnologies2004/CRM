import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

const RELEASES = [
  {
    date: "September 14, 2026",
    version: "0.40 — SaaS launch foundations",
    items: [
      "Marketing site with real plan pricing",
      "Stripe billing: trials, checkout, portal, cancellation, webhooks",
      "Plan entitlements and usage limits",
      "Trial activation checklist and days-remaining banner",
      "Contact form, privacy, terms, cookies and acceptable-use pages (drafts pending legal review)",
    ],
  },
  {
    date: "September 2026",
    version: "0.30 — Automation & AI",
    items: [
      "Trigger-based automation engine with run logs",
      "AI assistant, lead scoring and AI agents",
      "AI proposals stay human-controlled with permission checks",
    ],
  },
  {
    date: "August 2026",
    version: "0.20 — Working CRM core",
    items: [
      "Leads, contacts, companies, deals, tasks, communications",
      "Reports, exports and role-based access control",
      "Multi-tenant org membership with row-level security",
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Product updates</h1>
          <p className="mt-3 text-muted-foreground">
            A running record of what changed and when.
          </p>
          <div className="mt-8 space-y-6">
            {RELEASES.map((release) => (
              <article key={release.version} className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-semibold text-ink">{release.version}</h2>
                  <time className="text-sm text-muted-foreground">{release.date}</time>
                </div>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {release.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}