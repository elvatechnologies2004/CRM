import { Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CompaniesHeaderProps {
  onAddCompany: () => void;
  onImport: () => void;
}

function CompaniesHeader({ onAddCompany, onImport }: CompaniesHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track the organizations you sell to and the people inside them.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4" aria-hidden />
          Import Companies
        </Button>
        <Button size="sm" onClick={onAddCompany}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Company
        </Button>
      </div>
    </div>
  );
}

export { CompaniesHeader };