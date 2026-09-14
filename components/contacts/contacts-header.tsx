import { Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ContactsHeaderProps {
  onAddContact: () => void;
  onImport: () => void;
}

function ContactsHeader({ onAddContact, onImport }: ContactsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Contacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the people you work with across every company.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4" aria-hidden />
          Import Contacts
        </Button>
        <Button size="sm" onClick={onAddContact}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Contact
        </Button>
      </div>
    </div>
  );
}

export { ContactsHeader };