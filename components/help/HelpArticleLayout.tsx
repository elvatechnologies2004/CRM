"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HelpArticle, HelpArticleBody } from "@/lib/help-data";

interface HelpArticleLayoutProps {
  article: HelpArticle;
  body: HelpArticleBody;
}

function slugify(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function HelpArticleLayout({ article, body }: HelpArticleLayoutProps) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/help" scroll={false} className="transition-colors hover:text-ink">
          Help &amp; Support
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-ink">{article.title}</span>
      </nav>

      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{article.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Updated {body.lastUpdated}</span>
              <span aria-hidden>&middot;</span>
              <span>{article.readTime}</span>
              <span aria-hidden>&middot;</span>
              <span>{article.category}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{body.intro}</p>
          </div>

          {body.sections.map((section) => (
            <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-24">
              <h2 className="text-lg font-semibold text-ink">{section.heading}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-ink">Was this helpful?</p>
            {feedback === null ? (
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setFeedback("yes")}>
                  Yes
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFeedback("no")}>
                  No
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you for your feedback!
              </p>
            )}
          </div>
        </div>

        <aside className="hidden w-48 shrink-0 lg:block">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            On this page
          </p>
          <ul className="mt-3 space-y-2">
            {body.sections.map((section) => (
              <li key={section.heading}>
                <a
                  href={`#${slugify(section.heading)}`}
                  className="text-xs text-muted-foreground transition-colors hover:text-ink"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}