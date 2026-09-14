"use client";

import { RefreshCw, Search } from "lucide-react";

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
import { dealMocks } from "@/lib/mock-deals";

export type DealsViewMode = "table" | "pipeline";

export type DealSortOption =
  | "newest"
  | "recentlyUpdated"
  | "highestValue"
  | "lowestValue"
  | "closestToClosing"
  | "highestProbability";

export interface DealFilterState {
  search: string;
  stage: "all" | "New" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  owner: "all" | string;
  health: "all" | "Healthy" | "Needs Attention" | "At Risk" | "Critical";
  sort: DealSortOption;
}

export const defaultDealFilters: DealFilterState = {
  search: "",
  stage: "all",
  owner: "all",
  health: "all",
  sort: "newest",
};

interface DealsFiltersProps {
  filters: DealFilterState;
  onChange: (patch: Partial<DealFilterState>) => void;
  onClear: () => void;
  view: DealsViewMode;
  onViewChange: (view: DealsViewMode) => void;
  resultCount: number;
}

function DealsFilters({
  filters,
  onChange,
  onClear,
}: DealsFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.stage !== "all" ||
    filters.owner !== "all" ||
    filters.health !== "all";

  return (
    <Card className="p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search deals by name, company, contact or owner..."
            className="h-9 pl-9"
            aria-label="Search deals"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.stage}
            onValueChange={(value) =>
              onChange({ stage: value as DealFilterState["stage"] })
            }
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[160px] text-[13px]"
              aria-label="Filter by stage"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Won">Won</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.owner}
            onValueChange={(value) =>
              onChange({ owner: value as DealFilterState["owner"] })
            }
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[140px] text-[13px]"
              aria-label="Filter by owner"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {Array.from(new Set(dealMocks.map((d) => d.ownerName).filter(Boolean))).map(
                (owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Select
            value={filters.health}
            onValueChange={(value) =>
              onChange({ health: value as DealFilterState["health"] })
            }
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[140px] text-[13px]"
              aria-label="Filter by health"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All health</SelectItem>
              <SelectItem value="Healthy">Healthy</SelectItem>
              <SelectItem value="Needs Attention">Needs Attention</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Deal
          </span>
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              onChange({ sort: value as DealFilterState["sort"] })
            }
          >
            <SelectTrigger className="h-9 w-auto min-w-[180px] text-[13px]" aria-label="Sort deals">
              <RefreshCw className="mr-1 h-3.5 w-3.5 opacity-60" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="recentlyUpdated">Recently updated</SelectItem>
              <SelectItem value="highestValue">Highest value</SelectItem>
              <SelectItem value="lowestValue">Lowest value</SelectItem>
              <SelectItem value="closestToClosing">Closest to closing</SelectItem>
              <SelectItem value="highestProbability">Highest probability</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

export { DealsFilters };