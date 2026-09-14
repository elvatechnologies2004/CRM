"use client";

import { FilterX, KanbanSquare, Plus, RefreshCw, Search, Table2 } from "lucide-react";

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
import type {
  LeadSourceOption,
  LeadStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "kanban";

export type SortOption = "newest" | "oldest" | "score" | "recent";

export interface LeadFilterState {
  search: string;
  status: "all" | LeadStatus;
  source: "all" | LeadSourceOption;
  owner: string;
  score: "all" | "hot" | "warm" | "cold";
  country: string;
  created: "all" | "7d" | "30d" | "90d";
  value: "all" | "<5k" | "5k-15k" | ">15k";
  tag: string;
  moreOpen: boolean;
  sort: SortOption;
}

export const defaultLeadFilters: LeadFilterState = {
  search: "",
  status: "all",
  source: "all",
  owner: "all",
  score: "all",
  country: "all",
  created: "all",
  value: "all",
  tag: "all",
  moreOpen: false,
  sort: "newest",
};

const allStatuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Unqualified",
];

interface LeadsFiltersProps {
  filters: LeadFilterState;
  onChange: (patch: Partial<LeadFilterState>) => void;
  onClear: () => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  owners: string[];
  countries: string[];
  tags: string[];
  resultCount: number;
}

function FilterSelect({
  label,
  value,
  onValueChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-9 w-auto min-w-[140px] text-[13px]", className)} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}

function LeadsFilters({
  filters,
  onChange,
  onClear,
  view,
  onViewChange,
  owners,
  countries,
  tags,
  resultCount,
}: LeadsFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.source !== "all" ||
    filters.owner !== "all" ||
    filters.score !== "all" ||
    filters.country !== "all" ||
    filters.created !== "all" ||
    filters.value !== "all" ||
    filters.tag !== "all";

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
            placeholder="Search leads, companies, emails…"
            className="h-9 pl-9"
            aria-label="Search leads"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Filter by status"
            value={filters.status}
            onValueChange={(value) => onChange({ status: value as LeadFilterState["status"] })}
          >
            {allStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Filter by source"
            value={filters.source}
            onValueChange={(value) => onChange({ source: value as LeadFilterState["source"] })}
          >
            {(
              [
                "Website",
                "WhatsApp",
                "LinkedIn",
                "Facebook",
                "Instagram",
                "Referral",
                "Email",
                "Cold Call",
                "Manual",
                "Other",
              ] as const
            ).map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Filter by owner"
            value={filters.owner}
            onValueChange={(value) => onChange({ owner: value })}
          >
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Filter by lead score"
            value={filters.score}
            onValueChange={(value) => onChange({ score: value as LeadFilterState["score"] })}
          >
            <SelectItem value="hot">Hot · 80+</SelectItem>
            <SelectItem value="warm">Warm · 60–79</SelectItem>
            <SelectItem value="cold">Cold · &lt;60</SelectItem>
          </FilterSelect>

          <FilterSelect
            label="Filter by country"
            value={filters.country}
            onValueChange={(value) => onChange({ country: value })}
          >
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Filter by created date"
            value={filters.created}
            onValueChange={(value) => onChange({ created: value as LeadFilterState["created"] })}
          >
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">This quarter</SelectItem>
          </FilterSelect>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onChange({ moreOpen: !filters.moreOpen })}
          >
            More Filters
            <span className={cn("ml-0.5 transition-transform", filters.moreOpen && "rotate-180")}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </span>
          </Button>

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
            {resultCount} {resultCount === 1 ? "lead" : "leads"}
          </span>
          <Select
            value={filters.sort}
            onValueChange={(value) => onChange({ sort: value as LeadFilterState["sort"] })}
          >
            <SelectTrigger className="h-9 w-auto min-w-[170px] text-[13px]" aria-label="Sort leads">
              <RefreshCw className="mr-1 h-3.5 w-3.5 opacity-60" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="score">Highest score</SelectItem>
              <SelectItem value="recent">Recently contacted</SelectItem>
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
              onClick={() => onViewChange("kanban")}
              aria-pressed={view === "kanban"}
              title="Kanban view"
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                view === "kanban"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <KanbanSquare className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden lg:inline">Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {filters.moreOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="pr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            More
          </span>
          <FilterSelect
            label="Filter by expected value"
            value={filters.value}
            onValueChange={(value) => onChange({ value: value as LeadFilterState["value"] })}
          >
            <SelectItem value="<5k">&lt; $5,000</SelectItem>
            <SelectItem value="5k-15k">$5,000 – $15,000</SelectItem>
            <SelectItem value=">15k">&gt; $15,000</SelectItem>
          </FilterSelect>
          <FilterSelect
            label="Filter by tag"
            value={filters.tag}
            onValueChange={(value) => onChange({ tag: value })}
          >
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>
      )}
    </Card>
  );
}

export { LeadsFilters };