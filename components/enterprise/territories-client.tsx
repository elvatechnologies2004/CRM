"use client";

import { useState, useTransition } from "react";

import type { TerritoryRecord } from "@/lib/territories/territories";
import {
  createTerritoryAction,
  removeTerritoryMemberAction,
} from "@/lib/territories/actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface TerritoriesClientProps {
  territories: TerritoryRecord[];
  canManage: boolean;
}

function TerritoriesClient({ territories, canManage }: TerritoriesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [countries, setCountries] = useState("");
  const [industries, setIndustries] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [priority, setPriority] = useState("0");

  function create() {
    startTransition(async () => {
      const res = await createTerritoryAction({
        name: name.trim(),
        countries: countries.split(",").map((s) => s.trim()).filter(Boolean),
        industries: industries.split(",").map((s) => s.trim()).filter(Boolean),
        companySizeMin: minSize ? Number(minSize) : undefined,
        companySizeMax: maxSize ? Number(maxSize) : undefined,
        priority: Number(priority) || 0,
      });
      if (res.ok) {
        setOpen(false);
        setName("");
        setCountries("");
        setIndustries("");
        setMinSize("");
        setMaxSize("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Territories</h1>
          <p className="text-sm text-muted-foreground">
            Route leads by country, industry, company size and more (Phase A – Step 122).
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setOpen(true)}>
            New Territory
          </Button>
        )}
      </div>

      {territories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No territories yet. Create one to start automatically matching leads.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {territories.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Priority {t.priority}</p>
                </div>
                {t.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.countries.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
                {t.industries.map((i) => (
                  <Badge key={i} variant="outline">
                    {i}
                  </Badge>
                ))}
                {t.company_size_min != null && (
                  <Badge variant="info">
                    {t.company_size_min}–{t.company_size_max ?? "∞"} employees
                  </Badge>
                )}
              </div>

              {t.rules.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {t.rules.map((r) => (
                    <li key={r.id} className="text-xs text-muted-foreground">
                      {r.field} {r.operator} {r.value}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Members ({t.members.length})
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.members.map((m) => (
                    <Badge key={m.id} variant="secondary">
                      {m.full_name ?? m.user_id.slice(0, 8)}
                    </Badge>
                  ))}
                  {t.members.length === 0 && (
                    <span className="text-xs text-muted-foreground">No sales users assigned yet</span>
                  )}
                </div>
                {canManage && t.members.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await removeTerritoryMemberAction(t.members[0].id);
                        if (res.ok) router.refresh();
                      })
                    }
                  >
                    Remove first member
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Territory</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tr-name">Name</Label>
              <Input id="tr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pakistan Enterprise" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-countries">Countries (comma separated)</Label>
              <Input id="tr-countries" value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="Pakistan, UAE, Saudi Arabia" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-industries">Industries (comma separated)</Label>
              <Input id="tr-industries" value={industries} onChange={(e) => setIndustries(e.target.value)} placeholder="Technology, Healthcare" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tr-min">Min company size</Label>
                <Input id="tr-min" type="number" value={minSize} onChange={(e) => setMinSize(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tr-max">Max company size</Label>
                <Input id="tr-max" type="number" value={maxSize} onChange={(e) => setMaxSize(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-priority">Priority (higher = checked first)</Label>
              <Input id="tr-priority" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending || !name.trim()} onClick={create}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { TerritoriesClient };