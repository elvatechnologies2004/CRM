import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusMeta: Record<LeadStatus, { label: string; className: string }> = {
  New: { label: "New", className: "border-transparent bg-brand-blue/10 text-[#1d4ed8]" },
  Contacted: { label: "Contacted", className: "border-transparent bg-brand-purple/10 text-[#6d28d9]" },
  Qualified: { label: "Qualified", className: "border-transparent bg-success/10 text-[#15803d]" },
  Proposal: { label: "Proposal", className: "border-transparent bg-warning/10 text-[#b45309]" },
  Unqualified: { label: "Unqualified", className: "border-transparent bg-secondary text-muted-foreground" },
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  converted?: boolean;
  className?: string;
}

function LeadStatusBadge({ status, converted, className }: LeadStatusBadgeProps) {
  if (converted) {
    return (
      <Badge className={cn("border-transparent bg-success/10 text-[#15803d]", className)}>
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        Converted
      </Badge>
    );
  }
  const meta = statusMeta[status];
  return <Badge className={cn(meta.className, className)}>{meta.label}</Badge>;
}

export { LeadStatusBadge };