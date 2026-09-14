import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

const AI_CAPABILITIES = [
  {
    icon: Sparkles,
    title: "AI Assistant",
    desc: "Ask questions about your pipeline and get next best actions in seconds.",
  },
  {
    icon: Target,
    title: "Lead Scoring",
    desc: "Rank inbound leads by fit and intent so your team works the right list.",
  },
  {
    icon: TrendingUp,
    title: "Deal Health",
    desc: "Spot stalls, risk and recovery opportunities on every open deal.",
  },
  {
    icon: Bot,
    title: "AI Agents",
    desc: "Agents that draft, enrich and suggest — scoped by your permissions.",
  },
];

export default function AiCrmPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">AI CRM</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            AI that works for sales teams — without handing over control.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {AI_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-6 w-6 text-primary" aria-hidden />
                <h2 className="mt-3 text-lg font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Human-controlled AI note */}
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-6">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold text-ink">Human-controlled AI</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                AI proposes actions; your roles and permissions decide. Nothing consequential is
                executed silently — approvals sit in the loop for actions that change records or
                send messages. You stay in control at every step.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Try AI CRM Free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}