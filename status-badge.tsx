import { Badge, type BadgeProps } from "@/components/ui/badge";

const VALUE_VARIANTS: Record<string, BadgeProps["variant"]> = {
  active: "success",
  paid: "success",
  completed: "success",
  operational: "success",
  connected: "success",
  healthy: "success",
  success: "success",
  sent: "success",
  approved: "success",
  won: "success",

  pending: "warning",
  restricted: "warning",
  approaching: "warning",
  warning: "warning",
  partial: "warning",
  queued: "warning",
  trial: "info",
  "in progress": "info",
  new: "info",
  draft: "secondary",
  retrying: "warning",
  running: "cyan",

  failed: "danger",
  error: "danger",
  cancelled: "danger",
  suspended: "danger",
  expired: "danger",
  "past due": "danger",
  deactivated: "danger",
  rejected: "danger",
  lost: "danger",
  overdue: "danger",

  configured: "cyan",
  "not configured": "outline",
  unknown: "outline",
  invited: "secondary",
  open: "info",
  resolved: "success",
  closed: "secondary",
};

export function StatusBadge({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const key = String(value ?? "unknown").toLowerCase();
  const variant = VALUE_VARIANTS[key] ?? "secondary";
  return (
    <Badge variant={variant} className={className}>
      {value || "—"}
    </Badge>
  );
}

const PRIORITY_VARIANTS: Record<string, BadgeProps["variant"]> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  urgent: "danger",
  critical: "danger",
};

export function PriorityBadge({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const key = String(value ?? "medium").toLowerCase();
  const variant = PRIORITY_VARIANTS[key] ?? "secondary";
  return (
    <Badge variant={variant} className={className}>
      {value || "—"}
    </Badge>
  );
}