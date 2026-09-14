"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/crm-meta";
import { toDayLabel } from "@/lib/mock-leads";
import { Eye, Pencil, SearchIcon, SearchXIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import type { DealRecord } from "@/lib/types";

const stageNames: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

interface DealsTableProps {
  deals: DealRecord[];
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onView: (deal: DealRecord) => void;
  onEdit: (deal: DealRecord) => void;
  onClearFilters: () => void;
  owners: string[];
}

function DealsTable({
  deals,
  selected,
  onToggleSelected,
  onToggleAll,
  onClearSelection,
  onView,
  onEdit,
  onClearFilters,
  owners,
}: DealsTableProps) {
  const selectedCount = selected.size;
  const allSelected = deals.length > 0 && selectedCount === deals.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/50 px-4 py-2.5">
          <span className="text-[13px] font-medium text-accent-foreground">
            {selectedCount} {selectedCount === 1 ? "deal" : "deals"} selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={undefined}
              onValueChange={() => {}}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="Assign owner to selected">
                <SelectValue placeholder="Assign owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              <svg className="h-3.5 w-3.5" aria-hidden />
              Clear
            </Button>
          </div>
        </div>
      )}

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
            <SearchXIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
          </span>
          <p className="text-sm font-medium text-ink">No deals match your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try adjusting the search keywords or clearing the active filters to see
            more deals.
          </p>
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="w-6 px-3 py-3">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                      aria-label="Select all deals"
                    />
                  </th>
                  <th scope="col" className="px-2 py-3">Deal</th>
                  <th scope="col" className="px-3 py-3">Company</th>
                  <th scope="col" className="px-3 py-3">Primary Contact</th>
                  <th scope="col" className="px-3 py-3">Stage</th>
                  <th scope="col" className="px-3 py-3">Value</th>
                  <th scope="col" className="px-3 py-3">Probability</th>
                  <th scope="col" className="px-3 py-3">Expected Close</th>
                  <th scope="col" className="px-3 py-3">Owner</th>
                  <th scope="col" className="w-24 px-2 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="bg-card hover:bg-muted/30 cursor-pointer"
                    onClick={() => onView(deal)}
                    role="row"
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selected.has(deal.id)}
                        onCheckedChange={() => onToggleSelected(deal.id)}
                        aria-label={`Select ${deal.name}`}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <a
                        href={`/deals/${deal.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onView(deal);
                        }}
                        className="text-[13px] font-medium text-ink hover:underline"
                      >
                        {deal.name}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground">
                      {deal.companyName}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground">
                      {deal.primaryContactName}
                    </td>
                    <td className="px-3 py-3 text-[11px]">
                      {stageNames[deal.stageId] ?? deal.stageId}
                    </td>
                    <td className="px-3 py-3 font-medium text-ink">
                      {formatCurrency(deal.value)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="default" className="text-[10px]">
                        {deal.probability}%
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-[11px]">
                      {toDayLabel(deal.expectedCloseDate)}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground">
                      {deal.ownerName}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View deal"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(deal);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit deal"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(deal);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

export { DealsTable };
