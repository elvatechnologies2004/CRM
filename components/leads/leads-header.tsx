import { Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface LeadsHeaderProps {
  onAddLead: () => void;
  onImport: () => void;
}

function LeadsHeader({ onAddLead, onImport }: LeadsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage, qualify and convert your potential customers.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4" aria-hidden />
          Import Leads
        </Button>
        <Button size="sm" onClick={onAddLead}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Lead
        </Button>
      </div>
    </div>
  );
}

export { LeadsHeader };