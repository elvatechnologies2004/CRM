"use client";

import { useState, useTransition } from "react";

import type { OrgHierarchySnapshot } from "@/lib/org/hierarchy";
import {
  createBusinessUnitAction,
  createDepartmentAction,
  createOrgGroupAction,
  createRegionAction,
  createTeamAction,
  setMemberDepartmentAction,
} from "@/lib/org/actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface HierarchyClientProps {
  snapshot: OrgHierarchySnapshot;
}

function HierarchyClient({ snapshot }: HierarchyClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"group" | "bu" | "region" | "dept" | "team" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [parentTeam, setParentTeam] = useState("global");
  const [departmentId, setDepartmentId] = useState("global");

  const canWrite = snapshot.canManage;

  function run(action: () => Promise<{ ok: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setDialog(null);
        setName("");
        setDescription("");
        setCode("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Organization Hierarchy</h1>
          <p className="text-sm text-muted-foreground">
            Group companies, business units, regions, departments and teams (Phase A – Step 121).
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setDialog("group")}>
              New Group
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("bu")}>
              New Business Unit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("region")}>
              New Region
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("dept")}>
              New Department
            </Button>
            <Button size="sm" onClick={() => setDialog("team")}>
              New Team
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Regions</h2>
            <Badge variant="secondary">{snapshot.regions.length}</Badge>
          </div>
          {snapshot.regions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No regions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {snapshot.regions.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-ink">{r.name}</span>
                  {r.code && <span className="text-xs text-muted-foreground">{r.code}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Business Units</h2>
            <Badge variant="secondary">{snapshot.businessUnits.length}</Badge>
          </div>
          {snapshot.businessUnits.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No business units yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {snapshot.businessUnits.map((bu) => (
                <li key={bu.id} className="py-2 text-sm">
                  <span className="font-medium text-ink">{bu.name}</span>
                  {bu.head_user_id && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Head: {snapshot.members.find((m) => m.user_id === bu.head_user_id)?.full_name ?? bu.head_user_id}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Departments</h2>
            <Badge variant="secondary">{snapshot.departments.length}</Badge>
          </div>
          {snapshot.departments.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No departments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {snapshot.departments.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-ink">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.code ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Teams</h2>
            <Badge variant="secondary">{snapshot.teams.length}</Badge>
          </div>
          {snapshot.teams.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No teams yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {snapshot.teams.map((t) => (
                <li key={t.id} className="py-2 text-sm">
                  <span className="font-medium text-ink">{t.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t.department_id ? " · Dept: " + (snapshot.departments.find((d) => d.id === t.department_id)?.name ?? "") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Organization Groups</h2>
          {canWrite && (
            <Button size="sm" variant="outline" onClick={() => setDialog("group")}>
              New Group
            </Button>
          )}
        </div>
        {snapshot.groups.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No groups yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {snapshot.groups.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-ink">{g.name}</span>
                <Badge variant="success">{snapshot.groupMembers.filter((m) => m.group_id === g.id).length} orgs</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canWrite && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-ink">Members → Department</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {snapshot.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-ink">{m.full_name}</span>
                <Select
                  value={m.department_id ?? "global"}
                  onValueChange={(v) =>
                    startTransition(async () => {
                      const res = await setMemberDepartmentAction(m.id, v === "global" ? null : v);
                      if (res.ok) router.refresh();
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">No department</SelectItem>
                    {snapshot.departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "group" && "New Organization Group"}
              {dialog === "bu" && "New Business Unit"}
              {dialog === "region" && "New Region"}
              {dialog === "dept" && "New Department"}
              {dialog === "team" && "New Team"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="hf-name">Name</Label>
              <Input id="hf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            </div>
            {(dialog === "group" || dialog === "bu") && (
              <div className="space-y-1.5">
                <Label htmlFor="hf-desc">Description</Label>
                <Input id="hf-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
              </div>
            )}
            {dialog === "region" && (
              <div className="space-y-1.5">
                <Label htmlFor="hf-code">Code</Label>
                <Input id="hf-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. EMEA" />
              </div>
            )}
            {dialog === "team" && (
              <div className="space-y-1.5">
                <Label>Parent team</Label>
                <Select value={parentTeam} onValueChange={setParentTeam}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">None (top level)</SelectItem>
                    {snapshot.teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dialog === "team" && (
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">None</SelectItem>
                    {snapshot.departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={isPending || !name.trim()}
              onClick={() => {
                if (dialog === "group") run(() => createOrgGroupAction(name.trim(), description || undefined));
                else if (dialog === "bu") run(() => createBusinessUnitAction(name.trim(), description || undefined));
                else if (dialog === "region") run(() => createRegionAction(name.trim(), code || undefined));
                else if (dialog === "dept") run(() => createDepartmentAction({ name: name.trim(), code: code || undefined }));
                else if (dialog === "team")
                  run(() =>
                    createTeamAction({
                      name: name.trim(),
                      parentTeamId: parentTeam === "global" ? undefined : parentTeam,
                      departmentId: departmentId === "global" ? undefined : departmentId,
                    }),
                  );
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Also available via API: <code>addOrganizationToGroupAction</code>, <code>updateTeamHierarchy</code>,{" "}
        <code>setMemberDepartment</code>. Everything is org-scoped and RLS-protected.
      </div>
    </div>
  );
}

export { HierarchyClient };