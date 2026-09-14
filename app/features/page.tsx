import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

const SECTIONS = [
  {
    title: "Sales CRM",
    items: [
      "Kanban pipeline with drag-and-drop",
      "Lead management and conversion",
      "Deal tracking with win probability",
      "Contacts, companies and accounts",
    ],
  },
  {
    title: "Lead Management",
    items: [
      "Capture leads from forms and sources",
      "Score and prioritize automatically",
      "Convert leads to contacts + deals in one click",
      "Deduplication and data quality checks",
    ],
  },
  {
    title: "Pipeline",
    items: [
      "Custom stages and probabilities",
      "Win / loss tracking",
      "Forecast from pipeline health",
      "Automation on stage changes",
    ],
  },
  {
    title: "Tasks & Calendar",
    items: [
      "Tasks, meetings and call logging",
      "Calendar sync and scheduling",
      "Activity timeline per record",
      "Reminders and notifications",
    ],
  },
  {
    title: "Communication",
    items: [
      "Shared team inbox",
      "Email sequences with triggers",
      "WhatsApp and SMS channels",
      "Call tracking",
    ],
  },
  {
    title: "Automation",
    items: [
      "Trigger-based workflow engine",
      "Conditions, actions and run logs",
      "Lead routing and deal alerts",
      "Scheduled jobs",
    ],
  },
  {
    title: "AI",
    items: [
      "AI assistant for next best action",
      "Lead scoring and deal health",
      "Approvals for AI-proposed actions",
      "AI agents with scoped permissions",
    ],
  },
  {
    title: "Revenue",
    items: [
      "Products and price books",
      "Quotes with document numbering",
      "Invoices and payments",
      "Recurring subscriptions",
    ],
  },
  {
    title: "Customer Success",
    items: [
      "Projects and support tickets",
      "Customer health tracking",
      "Portal for customers",
      "SLA and priority routing",
    ],
  },
  {
    title: "Reporting",
    items: [
      "Pipeline and revenue reports",
      "Goals and forecast",
      "Win / loss analysis",
      "Data quality insights",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Features</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            A complete, modular CRM. Pick the depth you need — everything works together.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((section) => (
              <div key={section.title} className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-ink">{section.title}</h2>
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
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