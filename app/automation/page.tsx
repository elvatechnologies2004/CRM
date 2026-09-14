import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

const EXAMPLES = [
  { trigger: "New lead created", action: "Route to the right owner & notify them" },
  { trigger: "Deal moved to Proposal", action: "Create a follow-up task + send a quote reminder" },
  { trigger: "Deal closed won", action: "Notify the team & kick off onboarding" },
  { trigger: "Task overdue", action: "Escalate to manager" },
  { trigger: "New support ticket", action: "Assign by priority & open an internal task" },
  { trigger: "High-value lead scores", action: "Trigger an AI-assisted outreach sequence" },
];

export default function AutomationPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" aria-hidden />
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Automation</h1>
          </div>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Trigger-based workflows that run your CRM in the background — with run logs, conditions
            and full auditability.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <div key={ex.trigger} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Trigger</p>
                <p className="mt-1 font-medium text-ink">{ex.trigger}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</p>
                <p className="mt-1 text-sm text-muted-foreground">{ex.action}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Start automating free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}