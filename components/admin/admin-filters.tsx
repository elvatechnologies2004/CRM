"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface AdminFilterSelect {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

export function AdminFilters({
  placeholder = "Search…",
  initialSearch,
  selects = [],
}: {
  placeholder?: string;
  initialSearch?: string;
  selects?: AdminFilterSelect[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const next = `${pathname}?${params.toString()}`;
      router.replace(next, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const debouncedSearch = React.useRef<number | null>(null);

  const handleSearch = (value: string) => {
    if (debouncedSearch.current) window.clearTimeout(debouncedSearch.current);
    debouncedSearch.current = window.setTimeout(() => {
      apply({ search: value === "" ? null : value });
    }, 350);
  };

  const hasFilters =
    Boolean(initialSearch) || selects.some((s) => Boolean(s.defaultValue));

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="search"
          defaultValue={initialSearch ?? ""}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
        />
        {initialSearch ? (
          <button
            type="button"
            onClick={() => apply({ search: null })}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {selects.map((select) => (
        <label key={select.name} className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:ml-auto">
          <span className="sr-only sm:not-sr-only">{select.label}</span>
          <select
            name={select.name}
            defaultValue={select.defaultValue ?? "all"}
            onChange={(event) => apply({ [select.name]: event.target.value })}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="all">All {select.label.toLowerCase()}s</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Reset
        </button>
      ) : null}
    </div>
  );
}