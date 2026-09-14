"use client";

import { useState } from "react";
import {
  BookUser,
  CreditCard,
  Keyboard,
  MessageCircle,
  Settings,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContactSupportCard } from "@/components/help/ContactSupportCard";
import { ContactSupportDialog } from "@/components/help/ContactSupportDialog";
import { FeatureRequestDialog } from "@/components/help/FeatureRequestDialog";
import { GettingStartedChecklist } from "@/components/help/GettingStartedChecklist";
import { HelpCategoryCard } from "@/components/help/HelpCategoryCard";
import { HelpFAQ } from "@/components/help/HelpFAQ";
import { HelpHeader } from "@/components/help/HelpHeader";
import { PopularArticles } from "@/components/help/PopularArticles";
import { ReportProblemDialog } from "@/components/help/ReportProblemDialog";
import { SystemStatus } from "@/components/help/SystemStatus";
import type { FaqItem, HelpArticle, SystemStatusItem } from "@/lib/help-data";

interface HelpPageClientProps {
  articles: HelpArticle[];
  faqItems: FaqItem[];
  systemStatusItems: SystemStatusItem[];
}

const quickHelpCards = [
  {
    title: "Getting Started",
    description: "Set up your account, create leads, and learn the basics.",
    examples: ["Create leads", "Import contacts", "Set up pipeline"],
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    title: "Sales & Pipeline",
    description: "Manage deals, track health, and forecast revenue.",
    examples: ["Create deals", "Move stages", "Deal health"],
    icon: <BookUser className="h-5 w-5" />,
  },
  {
    title: "Communication",
    description: "Use inbox, sequences, WhatsApp, and task management.",
    examples: ["Send emails", "Create sequences", "Log calls"],
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    title: "Automation & AI",
    description: "Build workflows and leverage AI agents.",
    examples: ["Automations", "AI agents", "Approvals"],
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Billing & Revenue",
    description: "Quotes, proposals, invoices, and subscriptions.",
    examples: ["Create quote", "Send invoice", "Track payments"],
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: "Account & Settings",
    description: "Manage users, roles, integrations, and preferences.",
    examples: ["Add users", "Connect email", "Permissions"],
    icon: <Settings className="h-5 w-5" />,
  },
];

export function HelpPageClient({ articles, faqItems, systemStatusItems }: HelpPageClientProps) {
  const [query, setQuery] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);

  const trimmed = query.trim().toLowerCase();
  const visibleArticles =
    trimmed.length === 0
      ? articles
      : articles.filter(
          (article) =>
            article.title.toLowerCase().includes(trimmed) ||
            article.description.toLowerCase().includes(trimmed) ||
            article.category.toLowerCase().includes(trimmed)
        );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Help &amp; Support</h1>
        <p className="text-sm text-muted-foreground">
          Find answers, learn how the CRM works, or contact support.
        </p>
        <Button onClick={() => setSupportOpen(true)}>Contact Support</Button>
      </div>

      <HelpHeader onSearch={setQuery} />

      <section aria-label="Quick help topics">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickHelpCards.map((card) => (
            <HelpCategoryCard
              key={card.title}
              title={card.title}
              description={card.description}
              examples={card.examples}
              icon={card.icon}
            />
          ))}
        </div>
      </section>

      {visibleArticles.length > 0 ? (
        <section aria-label="Popular help articles">
          <PopularArticles articles={visibleArticles} />
        </section>
      ) : (
        <p className="py-4 text-sm text-muted-foreground">
          No articles found for &quot;{query}&quot;. Try a different search, or reach out to
          support below.
        </p>
      )}

      <section aria-label="Frequently asked questions">
        <HelpFAQ faqItems={faqItems} />
      </section>

      <section aria-label="Contact support">
        <ContactSupportCard
          onContactSupport={() => setSupportOpen(true)}
          onReportProblem={() => setReportOpen(true)}
          onRequestFeature={() => setFeatureOpen(true)}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-label="System status">
          <SystemStatus items={systemStatusItems} />
        </section>
        <section aria-label="Keyboard shortcuts">
          <div className="bg-card h-full rounded-xl border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Keyboard Shortcuts
              </h2>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm text-ink">Open global search</span>
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Ctrl&nbsp;K
                </kbd>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <section aria-label="Getting started checklist">
        <GettingStartedChecklist />
      </section>

      <section aria-label="Resources">
        <div className="bg-card rounded-xl border-border p-6">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Resources
          </h2>
          <ul className="mt-3 space-y-2">
            <li className="text-sm text-ink">Getting Started Guide</li>
            <li className="text-sm text-ink">Video Tutorials</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            In-depth documentation and video guides are coming soon.
          </p>
        </div>
      </section>

      <ContactSupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ReportProblemDialog open={reportOpen} onClose={() => setReportOpen(false)} />
      <FeatureRequestDialog open={featureOpen} onClose={() => setFeatureOpen(false)} />
    </div>
  );
}