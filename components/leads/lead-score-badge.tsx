import { Flame, Snowflake, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

export type ScoreLevel = "hot" | "warm" | "cold";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  return "cold";
}

const scorePalette: Record<
  ScoreLevel,
  { label: string; chip: string; dot: string; icon: typeof Flame | typeof Zap | typeof Snowflake }
> = {
  hot: { label: "Hot", chip: "bg-success/10 text-[#15803d]", dot: "bg-success", icon: Flame },
  warm: { label: "Warm", chip: "bg-warning/10 text-[#b45309]", dot: "bg-warning", icon: Zap },
  cold: { label: "Cold", chip: "bg-secondary text-muted-foreground", dot: "bg-slate-400", icon: Snowflake },
};

interface LeadScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  large?: boolean;
  className?: string;
}

function LeadScoreBadge({ score, showLabel = true, large = false, className }: LeadScoreBadgeProps) {
  const level = getScoreLevel(score);
  const meta = scorePalette[level];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        large ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs",
        meta.chip,
        className
      )}
      title={`${meta.label} lead`}
    >
      <Icon
        className={cn("shrink-0", large ? "h-4 w-4" : "h-3 w-3")}
        aria-hidden
      />
      <span className="font-semibold tabular-nums">{score}</span>
      {showLabel && (
        <span className={cn("uppercase tracking-wide", large ? "text-[10px]" : "text-[9px]")}>
          {meta.label}
        </span>
      )}
    </span>
  );
}

export { LeadScoreBadge };