"use client";

import { useState, useTransition } from "react";

import type { RoutingRuleRecord, RoutingStrategy } from "@/lib/routing/shared";
import { ROUTING_STRATEGIES } from "@/lib/routing/shared";
import {
  createRoutingRuleAction,
  deleteRoutingRuleAction,
  toggleRoutingRuleAction,
} from "@/lib/routing/actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface RoutingClientProps {
  rules: RoutingRuleRecord[];
  canManage: boolean;
}

function RoutingClient({ rules, canManage }: RoutingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<RoutingStrategy>("round_robin");
  const [targetType, setTargetType] = useState<"team" | "user" | "territory" | "all">("all");
  const [condition, setCondition] = useState("");

  function create() {
    startTransition(async () => {
      const res = await createRoutingRuleAction({
        name: name.trim(),
        strategy,
        targetType,
        conditions: parseCondition(condition),
      });
      if (res.ok) {
        setOpen(false);
        setName("");
        setCondition("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Lead Routing Rules</h1>
          <p className="text-sm text-muted-foreground">
            Eight strategies auto-assign new leads to the right owner (Phase A – Step 123).
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setOpen(true)}>
            New Rule
          </Button>
        )}
      </div>

      {rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No routing rules. New leads are assigned to their creator until a rule matches.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const label = ROUTING_STRATEGIES.find((s) => s.value === rule.strategy)?.label ?? rule.strategy;
            return (
              <div key={rule.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{rule.name}</p>
                      <Badge variant="info">{label}</Badge>
                      {rule.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">Priority {rule.priority}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Target: <span className="font-medium text-ink">{rule.target_type}</span>
                      {rule.weight > 1 && <> · weight {rule.weight}</>}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await toggleRoutingRuleAction(rule.id, !rule.is_active);
                            if (res.ok) router.refresh();
                          })
                        }
                      >
                        {rule.is_active ? "Pause" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteRoutingRuleAction(rule.id);
                            if (res.ok) router.refresh();
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {rule.conditions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {rule.conditions.map((c, i) => (
                      <Badge key={i} variant="outline">
                        {c.field} {c.operator} {c.value}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Applies to every lead.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManage && (
        <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          Strategies: <code>round_robin</code> (fewest leads), <code>least_loaded</code> (leads + open tasks),{" "}
          <code>territory</code>, <code>source_based</code>, <code>product_based</code>,{" "}
          <code>enterprise_account</code>, <code>weighted</code>, <code>vip</code>. Manual re-assignment from a
          lead&apos;s page records <code>previous_owner_id</code>, <code>assigned_at</code> and{" "}
          <code>assignment_reason</code>.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Routing Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rr-name">Name</Label>
              <Input id="rr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hot Pakistan leads → Sales" />
            </div>
            <div className="space-y-1.5">
              <Label>Strategy</Label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as RoutingStrategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTING_STRATEGIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assignee pool</Label>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as "team" | "user" | "territory" | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All active members</SelectItem>
                  <SelectItem value="team">A team (via API)</SelectItem>
                  <SelectItem value="user">A specific user (via API)</SelectItem>
                  <SelectItem value="territory">The matched territory team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rr-condition">Condition</Label>
              <Input
                id="rr-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder={`e.g. score>=80 OR country in "Pakistan, UAE"`}
              />
              <p className="text-xs text-muted-foreground">
                Syntax: <code>field op value</code> separated by <code> AND </code> / <code> OR </code>. Fields:{" "}
                <code>source, country, city, industry, product, account_type, company_size, score, expected_value</code>.
              </p>
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

function parseCondition(input: string): RoutingRuleRecord["conditions"] {
  const conditions: RoutingRuleRecord["conditions"] = [];
  for (const chunk of input.split(/\s+(?:AND|and)\s+/).map((c) => c.trim()).filter(Boolean)) {
    const orParts = chunk.split(/\s+(?:OR|or)\s+/);
    for (const part of orParts) {
      const parsed = parseSingle(part);
      if (parsed) conditions.push(parsed);
    }
  }
  return conditions;
}

function parseSingle(raw: string): RoutingRuleRecord["conditions"][number] | null {
  const match = raw.match(/^([\w.]+)\s*(=|!=|>=|<=|>|<|in)\s*(.+)$/);
  if (!match) return null;
  const field = match[1];
  const value = match[3].trim().replace(/^"(.*)"$/, "$1");
  let operator: string = match[2];
  if (value.includes(",")) operator = "in";
  return { field, operator: operator as RoutingRuleRecord["conditions"][number]["operator"], value };
}

export { RoutingClient };