import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

export default function AboutPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">About Relvo</h1>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              Relvo is an AI-first CRM for modern sales teams. We started with a simple belief:
              salespeople shouldn&apos;t spend their day feeding a database. The system should know
              what needs to happen next — and make it trivial to act.
            </p>
            <p>
              We combine a full CRM (leads, deals, tasks, communication, revenue and reporting) with
              an automation engine and AI that proposes, never assumes. Human-controlled AI and
              strict permission boundaries are core to how we build.
            </p>
            <p>
              Built for teams of one to enterprise, with multi-tenant isolation, role-based access
              and audit trails from day one.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["Mission", "Make world-class selling tools accessible to every team."],
              ["Approach", "Automation + AI that stays human-controlled."],
              ["Reality", "We ship incrementally, test carefully and never fake success."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}