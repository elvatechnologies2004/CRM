import { Badge } from "@/components/ui/badge";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "cyan";

const priorityVariants: Record<string, BadgeVariant> = {
  Low: "secondary",
  Medium: "info",
  High: "warning",
  Urgent: "danger",
  high: "warning",
  medium: "info",
  low: "secondary",
};

function getPriorityVariant(priority: string): BadgeVariant {
  return priorityVariants[priority] ?? "secondary";
}

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "Completed":
    case "Paid":
    case "Won":
    case "Active":
    case "Connected":
    case "Healthy":
    case "Resolved":
    case "Closed":
    case "Accepted":
    case "Delivered":
    case "Done":
      return "success";
    case "Open":
    case "In Progress":
    case "New":
    case "Scheduled":
    case "Sent":
      return "info";
    case "Overdue":
    case "Needs Attention":
    case "At Risk":
    case "High":
    case "Urgent":
    case "Critical":
    case "Lost":
    case "Rejected":
    case "Failed":
    case "Past Due":
      return "danger";
    case "Partial":
    case "Draft":
    case "Trial":
    case "Viewer":
      return "warning";
    default:
      return "secondary";
  }
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {status}
    </Badge>
  );
}

interface LifecycleBadgeProps {
  stage: string;
  className?: string;
}

function ContactLifecycleBadge({ stage, className }: LifecycleBadgeProps) {
  const variant: BadgeVariant =
    stage === "Customer"
      ? "success"
      : stage === "Lead"
        ? "info"
        : stage === "Opportunity"
          ? "purple"
          : stage === "Trial"
            ? "warning"
            : stage === "Former Customer"
              ? "danger"
              : "secondary";
  return (
    <Badge variant={variant} className={className}>
      {stage}
    </Badge>
  );
}

interface CompanyStatusBadgeProps {
  status: string;
  className?: string;
}

function CompanyStatusBadge({ status, className }: CompanyStatusBadgeProps) {
  const variant: BadgeVariant =
    status === "Customer"
      ? "success"
      : status === "Prospect"
        ? "info"
        : status === "Opportunity"
          ? "purple"
          : status === "Former Customer" || status === "Churned"
            ? "danger"
            : "secondary";
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge variant={getPriorityVariant(priority)} className={className}>
      {priority}
    </Badge>
  );
}

export {
  StatusBadge,
  PriorityBadge,
  ContactLifecycleBadge,
  CompanyStatusBadge,
  getPriorityVariant,
  getStatusVariant,
};