"use client";

import * as React from "react";
import { useCallback, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { toggleFeatureFlag } from "./actions";
import type { PlatformFeatureFlag } from "@/lib/admin/feature-flags";
import { cn } from "@/lib/utils";

/**
 * Minimal accessible toggle switch (the project has no Switch UI primitive).
 */
function ToggleInput({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        checked ? "bg-primary border-primary" : "bg-muted border-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

export function FlagToggle({ flag }: { flag: PlatformFeatureFlag }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const onToggle = useCallback(
    (checked: boolean) => {
      setError(null);
      startTransition(async () => {
        const result = await toggleFeatureFlag(flag.id, checked);
        if (result.error) {
          setError(result.error);
        }
      });
    },
    [flag.id],
  );

  return (
    <div className="flex flex-col items-start gap-1">
      <ToggleInput
        checked={flag.enabled}
        disabled={pending}
        onCheckedChange={onToggle}
        label={`Toggle ${flag.key}`}
      />
      {pending ? (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Saving…
        </span>
      ) : null}
      {error ? <span className="text-[11px] text-destructive">{error}</span> : null}
    </div>
  );
}