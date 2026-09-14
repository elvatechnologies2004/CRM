import Link from "next/link";
import { ArrowRight, BarChart3, Kanban, Target, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

const FEATURES = [
  { icon: Users, title: "Lead scoring & routing", desc: "Prioritize inbound and assign owners automatically." },
  { icon: Kanban, title: "Pipeline management", desc: "Stages, probabilities, and forecasts in one view." },
  { icon: BarChart3, title: "Forecasting", desc: "Know what you’ll close from pipeline health." },
  { icon: Target, title: "Win / loss analysis", desc: "Learn why deals close — and where you leak." },
];

export default function SalesPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Sales CRM</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A focused sales workspace for teams that need to move deals, not paperwork.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-6 w-6 text-primary" aria-hidden />
                <h2 className="mt-3 font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Start Free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}