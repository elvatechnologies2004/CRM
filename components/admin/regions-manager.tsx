"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { MapPin, Pencil, Plus, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SalesRegionRow } from "@/lib/admin/regions";
import {
  changeRegionStatusAction as changeRegionStatus,
  createRegionAction as createRegion,
  updateRegionAction as updateRegion,
} from "@/app/admin/regions/actions";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  status: "active" as RegionStatus,
};

type RegionStatus = "active" | "archived";
type RegionForm = {
  name: string;
  code: string;
  description: string;
  status: RegionStatus;
};

function RegionInputDialog({
  open,
  onOpenChange,
  mode,
  initial,
  organizationId,
  organizationName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial: SalesRegionRow | null;
  organizationId?: string | null;
  organizationName: string | null;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<RegionForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name,
          code: initial.code,
          description: initial.description ?? "",
          status: initial.status === "active" ? "active" : "archived",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setSubmitError(null);
      setSubmitting(false);
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const name = form.name.trim();
    const code = form.code.trim();
    if (!name || !code) {
      setSubmitError("Region name and code are required.");
      return;
    }
    if (!organizationId) {
      setSubmitError("No organization selected.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const base = {
      name,
      code,
      description: form.description.trim() || null,
      status: form.status,
    };

    const result =
      mode === "create"
        ? await createRegion({ organizationId, ...base })
        : initial
          ? await updateRegion({ regionId: initial.id, organizationId, ...base })
          : { id: "", error: "Region not found." };

    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    router.refresh();
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Region" : "Edit Region"}</DialogTitle>
          <DialogDescription>
            {organizationName
              ? `Organization: ${organizationName}`
              : "Sales region for the current organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="region-name">
                Region Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="region-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. South"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="region-code">
                Region Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="region-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. SOUTH"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="region-description">Description</Label>
              <Input
                id="region-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="region-status">Status</Label>
              <select
                id="region-status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RegionStatus }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Savingâ€¦" : mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RegionsManager({
  initialRegions,
  organizationId,
  organizationName,
}: {
  initialRegions: SalesRegionRow[];
  organizationId?: string | null;
  organizationName?: string | null;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<SalesRegionRow | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function openCreate() {
    setDialogMode("create");
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: SalesRegionRow) {
    setDialogMode("edit");
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleToggle(row: SalesRegionRow) {
    if (togglingId) return;
    if (!organizationId) return;

    setTogglingId(row.id);
    const next = row.status === "active" ? "archived" : "active";
    const result = await changeRegionStatus(row.id, organizationId, next);
    setTogglingId(null);
    if (result.error) {
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Sales Regions
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Add Region
        </Button>
      </div>

      {initialRegions.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No regions yet. Add your first region to start assigning RSM and BDO sales access.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Region</th>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {initialRegions.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium">{row.name}</span>
                    {row.description ? (
                      <span className="block text-xs text-muted-foreground">{row.description}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                  <td className="px-3 py-2">
                    <Badge variant={row.status === "active" ? "default" : "secondary"}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title={`Edit ${row.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(row)}
                        disabled={togglingId === row.id}
                        title={row.status === "active" ? "Archive" : "Activate"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RegionInputDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editing}
        organizationId={organizationId}
        organizationName={organizationName ?? null}
        onSuccess={refresh}
      />
    </div>
  );
}
