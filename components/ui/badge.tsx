import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-card text-foreground",
        success: "border-transparent bg-success/10 text-[#15803d]",
        warning: "border-transparent bg-warning/10 text-[#b45309]",
        danger: "border-transparent bg-danger/10 text-[#b91c1c]",
        info: "border-transparent bg-brand-blue/10 text-[#1d4ed8]",
        purple: "border-transparent bg-brand-purple/10 text-[#6d28d9]",
        cyan: "border-transparent bg-brand-cyan/10 text-[#0e7490]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };