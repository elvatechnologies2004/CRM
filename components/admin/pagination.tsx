import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  total,
  buildHref,
}: {
  page: number;
  pageCount: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const pages = new Set<number>();
  pages.add(1);
  pages.add(pageCount);
  for (let p = page - 2; p <= page + 2; p += 1) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        {total.toLocaleString()} result{total === 1 ? "" : "s"}
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Link
          href={buildHref(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            page <= 1 && "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Prev
        </Link>
        {sorted.map((p, index) => {
          const gap = index > 0 && p - sorted[index - 1] > 1;
          return (
            <React.Fragment key={p}>
              {gap ? <span className="px-1 text-xs text-muted-foreground">…</span> : null}
              {p === page ? (
                <span
                  aria-current="page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
                >
                  {p}
                </span>
              ) : (
                <Link
                  href={buildHref(p)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {p}
                </Link>
              )}
            </React.Fragment>
          );
        })}
        <Link
          href={buildHref(page + 1)}
          aria-disabled={page >= pageCount}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            page >= pageCount && "pointer-events-none opacity-50",
          )}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </nav>
    </div>
  );
}