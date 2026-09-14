"use client";

import { useMemo } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, CheckSquare, PenSquare, Sparkles } from "lucide-react";

interface AIPageClientProps {
  agentCount: number;
  pendingApprovals: number;
}

function AIPageClient({ agentCount, pendingApprovals }: AIPageClientProps) {
  const stats = useMemo(
    () => [
      { id: "ai_1", label: "AI Agents", value: agentCount, unit: "agents" },
      { id: "ai_2", label: "Pending Approvals", value: pendingApprovals, unit: "requests" },
      { id: "ai_3", label: "Active Insights", value: 6, unit: "insights" },
      { id: "ai_4", label: "Actions Run Today", value: 42, unit: "actions" },
    ],
    [agentCount, pendingApprovals]
  );

  const tools = useMemo(
    () => [
      { id: "t_1", label: "AI Assistant", description: "Chat-style senior sales agent that researches, drafts, and completes busywork.", href: "/ai#assistant", icon: Sparkles, tone: "info" as const },
      { id: "t_2", label: "AI Agents", description: "Deploy autonomous agents for lead ops, sales, customer success and more.", href: "/ai/agents", icon: Bot, tone: "purple" as const },
      { id: "t_3", label: "Approvals", description: "Review and approve AI-proposed actions before they execute.", href: "/approvals", icon: CheckSquare, tone: "warning" as const },
      { id: "t_4", label: "AI Insights", description: "Revenue opportunities, at-risk deals and bottlenecks surfaced automatically.", href: "/ai/insights", icon: PenSquare, tone: "success" as const },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">AI Assistant</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your always-on sales copilot. Ask anything about leads, deals, forecasts or customers.
            </p>
          </div>
          <Badge variant="purple" className="text-[10px]">GPT-5 Premium</Badge>
        </div>
        <div className="mt-4 flex items-end gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex-1 p-2 text-sm text-muted-foreground">
            e.g. Summarize Gulf Data Group and recommend a follow-up
          </div>
          <Button size="sm">Ask Assistant</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
              {stat.value.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground"> {stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] transition-colors hover:border-brand-sky"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-brand-sky" />
                <Badge variant={tool.tone} className="text-[10px]">{tool.label}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{tool.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { AIPageClient };