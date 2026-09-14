"use client";

import Link from "next/link";
import { Check, CheckCircle2, Circle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivationMilestone } from "@/lib/onboarding";

interface ActivationCardProps {
  milestones: ActivationMilestone[];
  score: number;
  doneCount: number;
  totalCount: number;
}

function ActivationCard({ milestones, score, doneCount, totalCount }: ActivationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Get started</CardTitle>
        <p className="text-sm text-muted-foreground">
          {doneCount} of {totalCount} milestones — {score}% activated
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${score}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <ul className="space-y-1">
          {milestones.map((m) => (
            <li key={m.key}>
              {m.href ? (
                <Link
                  href={m.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    m.done
                      ? "text-muted-foreground"
                      : "text-ink hover:bg-muted",
                  )}
                >
                  {m.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className={cn(m.done && "line-through")}>{m.label}</span>
                  {!m.done && m.href && <Check className="ml-auto h-3.5 w-3.5 opacity-0" aria-hidden />}
                </Link>
              ) : (
                <span className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
                  {m.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  {m.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export { ActivationCard };