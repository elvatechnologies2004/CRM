"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DealsHeaderProps {
  onAddDeal: () => void;
  onImport: () => void;
}

function DealsHeader({ onAddDeal, onImport }: DealsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Opportunities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track opportunity value, revenue and sales progress.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <Plus className="h-4 w-4" aria-hidden />
          Import Opportunities
        </Button>
        <Button size="sm" onClick={onAddDeal}>
          + New Opportunity
        </Button>
      </div>
    </div>
  );
}

export { DealsHeader };