"use client";

import { Badge } from "@/components/ui/badge";

export type DealHealthStatus = "Healthy" | "Needs Attention" | "At Risk" | "Critical";

export interface DealHealthBadgeProps {
  status: DealHealthStatus;
}

function DealHealthBadge({ status }: DealHealthBadgeProps) {
  const statusMap: Record<DealHealthStatus, { className: string; label: string }> = {
    Healthy: { className: "bg-success/10 text-success", label: "Healthy" },
    "Needs Attention": {
      className: "bg-warning/10 text-warning",
      label: "Needs Attention",
    },
    "At Risk": { className: "bg-orange/10 text-orange", label: "At Risk" },
    Critical: { className: "bg-danger/10 text-danger", label: "Critical" },
  };

  const { className, label } = statusMap[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export { DealHealthBadge };