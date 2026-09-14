"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PopularArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
}

interface PopularArticlesProps {
  articles: PopularArticle[];
}

export function PopularArticles({ articles }: PopularArticlesProps) {
  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Popular Help Articles
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/help/${article.slug}`}
            scroll={false}
            className="group bg-card p-4 rounded-xl border-border shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:border-brand-sky transition-colors"
          >
            <Badge variant="outline" className="text-[10px]">
              {article.category}
            </Badge>
            <p className="text-sm font-medium text-ink group-hover:text-brand-sky line-clamp-1 mt-2">
              {article.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{article.readTime}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}