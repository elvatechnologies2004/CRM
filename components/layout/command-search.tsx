"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  FileText,
  PanelTopClose,
  Search,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { recentLeads } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const suggestions = [
  { type: "leads", label: "show my hot leads" },
  { type: "deals", label: "deals closing this month" },
  { type: "tasks", label: "my tasks for today" },
];

interface SearchResult {
  id: string;
  label: string;
  meta: string;
  kind: "lead" | "company" | "document";
  href: string;
}

const searchIndex: SearchResult[] = [
  ...recentLeads.map((lead) => ({
    id: lead.id,
    label: lead.name,
    meta: `${lead.company} · Lead score ${lead.score}`,
    kind: "lead" as const,
    href: "/leads",
  })),
  { id: "co_1", label: "Techno Solutions", meta: "Company · Technology", kind: "company", href: "/companies" },
  { id: "co_2", label: "BrightWave", meta: "Company · Marketing", kind: "company", href: "/companies" },
  { id: "co_3", label: "Nova Systems", meta: "Company · SaaS", kind: "company", href: "/companies" },
  { id: "doc_1", label: "Q3 Sales Report", meta: "Report · Generated yesterday", kind: "document", href: "/reports" },
];

function ResultIcon({ kind }: { kind: SearchResult["kind"] }) {
  if (kind === "company") return <Building2 className="h-4 w-4" aria-hidden />;
  if (kind === "document") return <FileText className="h-4 w-4" aria-hidden />;
  return <User className="h-4 w-4" aria-hidden />;
}

function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex;
    return searchIndex.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q)
    );
  }, [query]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const runSearch = () => {
    setOpen(false);
    if (query.trim().toLowerCase() === "leads") {
      router.push("/leads", { scroll: false });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] transition-colors hover:border-ring/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:flex"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">Search leads, contacts, deals...</span>
        <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <Button
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open search"
      >
        <Search className="h-4 w-4" aria-hidden />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setQuery("");
          setOpen(next);
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>Global search</DialogTitle>
            <DialogDescription>
              Search across leads, contacts, deals and documents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
              placeholder="Search leads, contacts, deals..."
              className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label="Search query"
            />
            <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-[340px] overflow-y-auto p-2">
            {query.trim() && (
              <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Results
              </p>
            )}
            {results.length > 0 ? (
              <ul className="flex flex-col gap-0.5">
                {results.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(item.href, { scroll: false });
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          item.kind === "lead"
                            ? "bg-primary/10 text-primary"
                            : item.kind === "company"
                              ? "bg-brand-blue/10 text-brand-blue"
                              : "bg-brand-purple/10 text-brand-purple"
                        )}
                      >
                        <ResultIcon kind={item.kind} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-ink">
                          {item.label}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.meta}
                        </span>
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <PanelTopClose className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
                <p className="mt-2 text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Try searching for a lead, company or document.
                </p>
              </div>
            )}
            {!query.trim() && (
              <>
                <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Try asking
                </p>
                <ul className="mb-1 flex flex-col gap-0.5">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.type}>
                      <button
                        type="button"
                        onClick={() => setQuery(suggestion.label)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {suggestion.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { CommandSearch };