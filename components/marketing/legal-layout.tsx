import type { ReactNode } from "react";

import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";

interface LegalLayoutProps {
  title: string;
  updated?: string;
  children: ReactNode;
}

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          {updated ? (
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
          ) : null}
          <div className="mt-2 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            <strong>Draft policy.</strong> This document is a starting point for review by legal
            counsel before it is published as final.
          </div>
          <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink text-muted-foreground">
            {children}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}