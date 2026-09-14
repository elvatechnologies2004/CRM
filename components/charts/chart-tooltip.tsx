"use client";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  formatter?: (value: number | string, name?: string | number) => string;
}

export function ChartTooltip({
  active,
  label,
  payload,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[9rem] rounded-lg border border-border bg-card/95 p-2.5 shadow-lg backdrop-blur-sm">
      {label !== undefined && (
        <p className="mb-1.5 text-xs font-semibold text-ink">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => {
          const value =
            entry.value === undefined
              ? "—"
              : formatter
                ? formatter(entry.value, entry.name)
                : String(entry.value);
          return (
            <div key={`${String(entry.dataKey ?? entry.name)}_${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color ?? "#94a3b8" }}
                  aria-hidden
                />
                {entry.name}
              </span>
              <span className="text-xs font-semibold text-ink">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}