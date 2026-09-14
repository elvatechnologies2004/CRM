import { notFound } from "next/navigation";

import { HelpArticleLayout } from "@/components/help/HelpArticleLayout";
import { helpArticleBodies, helpArticles } from "@/lib/help-data";

export function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = helpArticles.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const body = helpArticleBodies[slug];

  return <HelpArticleLayout article={article} body={body} />;
}