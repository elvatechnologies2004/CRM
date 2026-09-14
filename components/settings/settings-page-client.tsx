"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Setting, SettingCategory } from "@/lib/types";

interface SettingsPageClientProps {
  initialSettings: Setting[];
}

function SettingsPageClient({ initialSettings }: SettingsPageClientProps) {
  const settings = useMemo(() => initialSettings, [initialSettings]);

  const categoryTone: Record<SettingCategory, "info" | "warning" | "danger" | "success"> = {
    General: "info",
    Security: "warning",
    Notifications: "info",
    Integrations: "info",
    Appearance: "info",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <Button size="sm" variant="ghost">
          + Setting
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {settings.map((setting) => {
          return (
            <div
              key={setting.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium text-ink">{setting.key}</p>
                <p className="text-sm text-muted-foreground">{setting.value}</p>
                <Badge variant={categoryTone[setting.category]} className="text-[10px] ml-2">
                  {setting.category}
                </Badge>
              </div>
            </div>
          );
        })}
        {settings.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No settings found.
          </p>
        )}
      </div>
    </div>
  );
}

export { SettingsPageClient };