"use client";

import { useState } from "react";
import {
  Archive,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  SearchX,
  Trash2,
  X,
} from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyStatusBadge } from "@/components/crm/status-badges";
import { lastActivityLabel } from "@/lib/mock-leads";
import type { CompanyAccountStatus, CompanyRecord } from "@/lib/types";

interface CompaniesTableProps {
  companies: CompanyRecord[];
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onView: (id: string) => void;
  onEdit: (company: CompanyRecord) => void;
  onDelete: (company: CompanyRecord) => void;
  onArchive: (company: CompanyRecord) => void;
  onBulkAssignOwner: (owner: string) => void;
  onBulkStatus: (status: CompanyAccountStatus) => void;
  onBulkDelete: () => void;
  onClearFilters: () => void;
  owners: string[];
  statuses: CompanyAccountStatus[];
  cardsView: boolean;
}

function CompanyCard({
  company,
  selected,
  onView,
  onToggleSelected,
}: {
  company: CompanyRecord;
  selected: boolean;
  onView: (id: string) => void;
  onToggleSelected: (id: string) => void;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-3"
      onClick={() => onView(company.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onView(company.id);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <InitialsAvatar name={company.name} className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-ink">
              {company.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {company.industry} · {company.city}, {company.country}
            </span>
          </span>
        </span>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelected(company.id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${company.name}`}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CompanyStatusBadge status={company.accountStatus} />
      </div>
      <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
        <p className="truncate">{company.domain}</p>
        <p className="flex items-center justify-between">
          <span>Revenue {company.annualRevenue}</span>
          <span>{lastActivityLabel(company.lastActivityAt)}</span>
        </p>
      </div>
      <div className="mt-2.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onView(company.id);
          }}
        >
          Open company
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function CompaniesTable({
  companies,
  selected,
  onToggleSelected,
  onToggleAll,
  onClearSelection,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onBulkAssignOwner,
  onBulkStatus,
  onBulkDelete,
  onClearFilters,
  owners,
  statuses,
  cardsView,
}: CompaniesTableProps) {
  const [bulkOwner, setBulkOwner] = useState<string | undefined>();
  const [bulkStatus, setBulkStatus] = useState<string | undefined>();
  const selectedCount = selected.size;
  const allSelected = companies.length > 0 && selectedCount === companies.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/50 px-4 py-2.5">
          <span className="text-[13px] font-medium text-accent-foreground">
            {selectedCount} {selectedCount === 1 ? "company" : "companies"} selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={bulkOwner}
              onValueChange={(value) => {
                onBulkAssignOwner(value);
                setBulkOwner(undefined);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Assign owner to selected">
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
            <Select
              value={bulkStatus}
              onValueChange={(value) => {
                onBulkStatus(value as CompanyAccountStatus);
                setBulkStatus(undefined);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Change status of selected">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear selection"
            className="ml-auto text-muted-foreground"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-5 w-5 text-muted-foreground" aria-hidden />
          </span>
          <p className="text-sm font-medium text-ink">No companies match your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try adjusting the search keywords or clearing the active filters to see
            more companies.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {cardsView ? (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  selected={selected.has(company.id)}
                  onView={onView}
                  onToggleSelected={onToggleSelected}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:hidden">
                {companies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    selected={selected.has(company.id)}
                    onView={onView}
                    onToggleSelected={onToggleSelected}
                  />
                ))}
              </div>

              <div className="scrollbar-thin hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="w-10 px-3 py-3">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                          aria-label="Select all companies"
                        />
                      </th>
                      <th scope="col" className="px-2 py-3 font-semibold">Company</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Industry</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Revenue</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Last activity</th>
                      <th scope="col" className="w-12 px-2 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {companies.map((company) => (
                      <tr key={company.id} className="bg-card hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selected.has(company.id)}
                            onCheckedChange={() => onToggleSelected(company.id)}
                            aria-label={`Select ${company.name}`}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => onView(company.id)}
                            className="flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            <InitialsAvatar name={company.name} className="h-9 w-9" />
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-medium text-ink">
                                {company.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {company.domain}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-[13px] text-muted-foreground">
                          {company.industry}
                        </td>
                        <td className="px-3 py-3 text-[13px] tabular-nums text-muted-foreground">
                          {company.annualRevenue}
                        </td>
                        <td className="px-3 py-3">
                          <CompanyStatusBadge status={company.accountStatus} />
                        </td>
                        <td className="px-3 py-3 text-[13px] text-muted-foreground">
                          {company.ownerName}
                        </td>
                        <td className="px-3 py-3 text-[13px] text-muted-foreground">
                          {lastActivityLabel(company.lastActivityAt)}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${company.name}`}>
                                <MoreHorizontal className="h-4 w-4" aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>{company.name}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onView(company.id)}>
                                <ArrowUpRight className="h-4 w-4" aria-hidden />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(company)}>
                                <Pencil className="h-4 w-4" aria-hidden />
                                Edit Company
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onArchive(company)}>
                                <Archive className="h-4 w-4" aria-hidden />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(company)}
                                className="text-danger focus:bg-danger/10 focus:text-danger"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                                Delete Company
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}

export { CompaniesTable };