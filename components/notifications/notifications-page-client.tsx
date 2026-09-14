"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SystemNotification } from "@/lib/types";

interface NotificationsPageClientProps {
  initialNotifications: SystemNotification[];
}

function NotificationsPageClient({ initialNotifications }: NotificationsPageClientProps) {
  const notifications = useMemo(() => initialNotifications, [initialNotifications]);

  const typeTone: Record<SystemNotification["type"], "info" | "success" | "warning" | "danger"> = {
    System: "info",
    Task: "warning",
    "Follow-up": "info",
    Deal: "info",
    Invoice: "danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Notifications</h1>
        <Button size="sm" variant="ghost">
          + New Notification
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {notifications.map((notification) => {
          const Tone = typeTone[notification.type];
          return (
            <div
              key={notification.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium text-ink">{notification.title}</p>
                <p className="text-xs text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.createdAt}
                </p>
                <Badge variant={Tone} className="text-[10px] ml-2">
                  {notification.type}
                </Badge>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No notifications found.
          </p>
        )}
      </div>
    </div>
  );
}

export { NotificationsPageClient };