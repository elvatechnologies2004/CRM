"use client";

import {
  Activity,
  Building2,
  CreditCard,
  Files,
  Folder,
  Handshake,
  Headset,
  LayoutGrid,
  StickyNote,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type CompanyTabKey =
  | "overview"
  | "contacts"
  | "deals"
  | "activity"
  | "projects"
  | "invoices"
  | "support"
  | "notes"
  | "files";

const tabs: { key: CompanyTabKey; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "contacts", label: "Contacts", icon: Building2 },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "projects", label: "Projects", icon: Folder },
  { key: "invoices", label: "Invoices", icon: CreditCard },
  { key: "support", label: "Support", icon: Headset },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "files", label: "Files", icon: Files },
];

interface CompanyTabsProps {
  active: CompanyTabKey;
  onChange: (tab: CompanyTabKey) => void;
  counts?: Partial<Record<CompanyTabKey, number>>;
}

function CompanyTabs({ active, onChange, counts }: CompanyTabsProps) {
  return (
    <div
      className="scrollbar-thin -mx-1 flex gap-1 overflow-x-auto"
      role="tablist"
      aria-label="Company sections"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        const count = counts?.[tab.key];
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {tab.label}
            {typeof count === "number" && count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { CompanyTabs };