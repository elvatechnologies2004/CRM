import Link from "next/link";
import { ArrowRight, KeyRound, Lock, ShieldCheck, Users, FileSearch, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

const ITEMS = [
  {
    icon: KeyRound,
    title: "Authentication",
    desc: "Secure, password-based auth with email verification and session refresh.",
  },
  {
    icon: Users,
    title: "Role-based permissions",
    desc: "Fine-grained permissions tied to roles — enforced in the database layer.",
  },
  {
    icon: ShieldCheck,
    title: "Tenant isolation",
    desc: "Every query is scoped to your organization. No cross-tenant access.",
  },
  {
    icon: Lock,
    title: "Encryption",
    desc: "Data encrypted in transit and at rest by our hosting infrastructure.",
  },
  {
    icon: FileSearch,
    title: "Audit logs",
    desc: "Actions that change records are logged for accountability.",
  },
  {
    icon: Globe,
    title: "Secure file access",
    desc: "Attachments are served through signed, access-controlled storage.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Security</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Built with security fundamentals in mind. We only claim what we actually do.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-6 w-6 text-primary" aria-hidden />
                <h2 className="mt-3 font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-6">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold text-ink">Human-controlled AI</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                AI does not silently change records, send messages, or make consequential decisions.
                Permissions and approvals govern every AI-proposed action.
              </p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Start Secure Free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}