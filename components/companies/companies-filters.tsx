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
import { companyAccountStatuses, companyIndustries } from "@/lib/crm-meta";
import type { CompanyAccountStatus, CompanyIndustry } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CompaniesViewMode = "table" | "cards";
export type CompanySortOption = "recentlyAdded" | "highestRevenue" | "mostActive" | "nameAz";

export interface CompaniesFilterState {
  search: string;
  status: "all" | CompanyAccountStatus;
  industry: "all" | CompanyIndustry;
  sort: CompanySortOption;
}

export const defaultCompaniesFilters: CompaniesFilterState = {
  search: "",
  status: "all",
  industry: "all",
  sort: "recentlyAdded",
};

interface CompaniesFiltersProps {
  filters: CompaniesFilterState;
  onChange: (patch: Partial<CompaniesFilterState>) => void;
  onClear: () => void;
  view: CompaniesViewMode;
  onViewChange: (view: CompaniesViewMode) => void;
  resultCount: number;
}

function CompaniesFilters({
  filters,
  onChange,
  onClear,
  view,
  onViewChange,
  resultCount,
}: CompaniesFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.industry !== "all";

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
            placeholder="Search companies, domains, industries…"
            className="h-9 pl-9"
            aria-label="Search companies"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onChange({ status: value as CompaniesFilterState["status"] })
            }
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[140px] text-[13px]"
              aria-label="Filter by account status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {companyAccountStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.industry}
            onValueChange={(value) =>
              onChange({ industry: value as CompaniesFilterState["industry"] })
            }
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[140px] text-[13px]"
              aria-label="Filter by industry"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {companyIndustries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
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
            {resultCount} {resultCount === 1 ? "company" : "companies"}
          </span>
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              onChange({ sort: value as CompaniesFilterState["sort"] })
            }
          >
            <SelectTrigger className="h-9 w-auto min-w-[180px] text-[13px]" aria-label="Sort companies">
              <RefreshCw className="mr-1 h-3.5 w-3.5 opacity-60" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentlyAdded">Recently added</SelectItem>
              <SelectItem value="highestRevenue">Highest revenue</SelectItem>
              <SelectItem value="mostActive">Most active</SelectItem>
              <SelectItem value="nameAz">Name A–Z</SelectItem>
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

export { CompaniesFilters };