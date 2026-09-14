import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Kanban,
  Mail,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

const FEATURES: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  { icon: Kanban, title: "Sales Pipeline", desc: "Visual kanban pipelines with stages, win probability and in-line updates." },
  { icon: Workflow, title: "Automations", desc: "Trigger-based workflows across leads, deals, tasks and email." },
  { icon: Bot, title: "AI Assistant", desc: "Lead scoring, deal health, next best action and summaries backed by AI." },
  { icon: Mail, title: "Communication", desc: "Inbox, sequences and WhatsApp from one workspace." },
  { icon: BarChart3, title: "Reports & Forecast", desc: "Pipeline, revenue and goal tracking dashboards." },
  { icon: Sparkles, title: "Human-controlled AI", desc: "AI proposes, permissions approve. You stay in control." },
];

const STEPS: Array<{ title: string; desc: string }> = [
  { title: "Create your workspace", desc: "Sign up in seconds — no credit card required for the 14-day trial." },
  { title: "Add leads & deals", desc: "Import contacts or let AI lift the heavy admin." },
  { title: "Automate & grow", desc: "Build automations and let the pipeline run itself." },
];

export default function MarketingHome() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            AI-first CRM for modern sales teams
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            The CRM that knows{" "}
            <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
              what needs to happen next
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Manage customers, sales, automation and AI from one intelligent workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/features">View Features</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free forever plan · No credit card required · 14-day Pro trial
          </p>
        </section>

        {/* Benefits */}
        <section className="border-y border-border bg-card/50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              {[
                ["Faster pipeline", "Move deals with less admin"],
                ["AI-assisted selling", "Score and recover deals automatically"],
                ["Automation first", "Run workflows on every trigger"],
                ["Built for teams", "Roles, permissions and audit trails"],
              ].map(([title, desc]) => (
                <div key={title}>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Everything you need to sell
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A full CRM — leads, deals, tasks, communication, automation, AI, revenue and reporting.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section className="border-y border-border bg-card/50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Simple pricing that grows with you
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { name: "Free", price: "Rs 0", desc: "For individuals" },
                { name: "Starter", price: "Rs 4,999/mo", desc: "For small teams" },
                { name: "Pro", price: "Rs 9,999/mo", desc: "For growing companies" },
              ].map((plan) => (
                <div key={plan.name} className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-ink">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{plan.price}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                  <Button asChild variant={plan.name === "Pro" ? "default" : "outline"} size="sm" className="mt-4 w-full">
                    <Link href="/pricing">See details</Link>
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/pricing" className="inline-flex items-center gap-1 text-primary hover:underline">
                Compare all plans <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Get started in minutes</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="rounded-xl border border-border bg-card p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 p-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Ready to close more deals?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Join thousands of teams running their sales on FinloNexa CRM. Start free, upgrade when you grow.
            </p>
            <Button asChild size="lg" className="mt-6">
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