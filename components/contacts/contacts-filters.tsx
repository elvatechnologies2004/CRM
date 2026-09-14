"use client";

import { FilterX, RefreshCw, Search, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contactLifecycles } from "@/lib/crm-meta";
import type { ContactLifecycle } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ContactsViewMode = "table" | "cards";
export type ContactsSortOption = "recentlyAdded" | "recentlyContacted" | "nameAz" | "nameZa";

export interface ContactsFilterState {
  search: string;
  lifecycle: "all" | ContactLifecycle;
  company: string;
  sort: ContactsSortOption;
}

export const defaultContactsFilters: ContactsFilterState = {
  search: "",
  lifecycle: "all",
  company: "all",
  sort: "recentlyAdded",
};

interface ContactsFiltersProps {
  filters: ContactsFilterState;
  onChange: (patch: Partial<ContactsFilterState>) => void;
  onClear: () => void;
  view: ContactsViewMode;
  onViewChange: (view: ContactsViewMode) => void;
  companies: string[];
  resultCount: number;
}

function ContactsFilters({
  filters,
  onChange,
  onClear,
  view,
  onViewChange,
  companies,
  resultCount,
}: ContactsFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.lifecycle !== "all" ||
    filters.company !== "all";

  return (
    <Card className="p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search people, companies, emails…"
            className="h-9 pl-9"
            aria-label="Search contacts"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.lifecycle}
            onValueChange={(value) =>
              onChange({ lifecycle: value as ContactsFilterState["lifecycle"] })
            }
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[150px] text-[13px]"
              aria-label="Filter by lifecycle stage"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {contactLifecycles.map((lifecycle) => (
                <SelectItem key={lifecycle} value={lifecycle}>
                  {lifecycle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.company}
            onValueChange={(value) => onChange({ company: value })}
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[150px] text-[13px]"
              aria-label="Filter by company"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={onClear}
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden />
              Clear
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {resultCount} {resultCount === 1 ? "contact" : "contacts"}
          </span>
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              onChange({ sort: value as ContactsFilterState["sort"] })
            }
          >
            <SelectTrigger className="h-9 w-auto min-w-[172px] text-[13px]" aria-label="Sort contacts">
              <RefreshCw className="mr-1 h-3.5 w-3.5 opacity-60" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentlyAdded">Recently added</SelectItem>
              <SelectItem value="recentlyContacted">Recently contacted</SelectItem>
              <SelectItem value="nameAz">Name A–Z</SelectItem>
              <SelectItem value="nameZa">Name Z–A</SelectItem>
            </SelectContent>
          </Select>

          <div
            className="flex h-9 items-center rounded-lg border border-border bg-card p-1"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => onViewChange("table")}
              aria-pressed={view === "table"}
              title="Table view"
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                view === "table"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden lg:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange("cards")}
              aria-pressed={view === "cards"}
              title="Cards view"
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                view === "cards"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 className="hidden h-3.5 w-3.5 lg:block" aria-hidden />
              <span className="hidden lg:inline">Cards</span>
              <span className="lg:hidden">Cards</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { ContactsFilters };