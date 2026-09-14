"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AiAgent } from "@/lib/types";

interface AIAgentsPageClientProps {
  agents: AiAgent[];
  usesLiveData: boolean;
}

function statusBadge(status: AiAgent["status"]) {
  switch (status) {
    case "Active":
      return "success";
    case "Paused":
      return "warning";
    case "Archived":
      return "outline";
    case "Error":
      return "danger";
    default:
      return "outline";
  }
}

function AIAgentsPageClient({ agents, usesLiveData }: AIAgentsPageClientProps) {
  const total = agents.length;
  const active = agents.filter((a) => a.status === "Active").length;
  const paused = agents.filter((a) => a.status === "Paused").length;
  const pendingApprovals = agents.reduce((sum, a) => sum + a.pendingApprovals, 0);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">AI Agents</h1>
          <p className="text-sm text-muted-foreground">
            Configure AI agents that help automate sales, customer success,
            support, and finance workflows.
          </p>
          {!usesLiveData && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              No agents yet — create your first agent.
            </p>
          )}
        </div>
        <Button>+ Create Agent</Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="bg-card p-3 rounded-xl border-border shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Total Agents</p>
          <p className="text-2xl font-bold text-ink">{total}</p>
        </div>
        <div className="bg-card p-3 rounded-xl border-border shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-ink">{active}</p>
        </div>
        <div className="bg-card p-3 rounded-xl border-border shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Paused</p>
          <p className="text-2xl font-bold text-ink">{paused}</p>
        </div>
        <div className="bg-card p-3 rounded-xl border-border shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Pending Approvals</p>
          <p className="text-2xl font-bold text-ink">{pendingApprovals}</p>
        </div>
      </div>

      {/* MOBILE CARDS (visible < md) */}
      <div className="md:hidden space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-card rounded-xl border border-border p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] space-y-2"
          >
            <div className="flex items-start gap-2">
              <Bot className="mt-0.5 h-4 w-4 text-brand-sky shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{agent.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.purpose}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Agent</DropdownMenuItem>
                  <DropdownMenuItem>Edit Agent</DropdownMenuItem>
                  <DropdownMenuItem>Pause / Activate</DropdownMenuItem>
                  <DropdownMenuItem>View Activity</DropdownMenuItem>
                  <DropdownMenuItem>View Approvals</DropdownMenuItem>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={statusBadge(agent.status)}>{agent.status}</Badge>
              <Badge variant="outline" className="text-[10px]">{agent.type}</Badge>
              <Badge variant="outline" className="text-[10px]">{agent.approvalMode}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
              <div>
                <span className="text-ink font-medium">{agent.actionsToday}</span> actions
              </div>
              <div>
                <span className="text-ink font-medium">{agent.pendingApprovals}</span> pending
              </div>
              <div>{agent.lastActivity ?? "—"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* AGENTS TABLE (visible md+) */}
      <div className="hidden md:block">
        <table className="w-full caption-bottom">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Agent</th>
              <th className="text-left min-w-[280px] text-xs font-medium text-muted-foreground px-6 py-3">Purpose</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Type</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Approval Mode</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Actions Today</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Pending Approvals</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Last Activity</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b border-border hover:bg-muted/10 min-h-[72px]">
                <td className="px-6 py-3 flex items-start gap-2">
                  <Bot className="mt-0.5 h-4 w-4 text-brand-sky shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-ink">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {agent.id.slice(0, 8)}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.purpose}
                  </p>
                </td>
                <td className="px-3 py-3 text-center">
                  <Badge variant="outline" className="text-[10px]">
                    {agent.type}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-center">
                  <Badge variant={statusBadge(agent.status)}>
                    {agent.status}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-center">
                  <Badge variant="outline" className="text-[10px]">
                    {agent.approvalMode}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {agent.actionsToday}
                </td>
                <td className="px-3 py-3 text-right">
                  {agent.pendingApprovals > 0 ? (
                    <Badge variant="danger" className="text-[10px]">
                      {agent.pendingApprovals}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground/50 tabular-nums">0</span>
                  )}
                </td>
                <td className="px-3 py-3 text-left">
                  <p className="text-sm text-muted-foreground">
                    {agent.lastActivity ?? "—"}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Agent</DropdownMenuItem>
                      <DropdownMenuItem>Edit Agent</DropdownMenuItem>
                      <DropdownMenuItem>Pause / Activate</DropdownMenuItem>
                      <DropdownMenuItem>View Activity</DropdownMenuItem>
                      <DropdownMenuItem>View Approvals</DropdownMenuItem>
                      <DropdownMenuItem>Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { AIAgentsPageClient };