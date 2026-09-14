"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";

const checklist = [
  { label: "Create your first lead", href: "/leads" },
  { label: "Convert a lead into a deal", href: "/deals" },
  { label: "Set up your pipeline stages", href: "/pipeline" },
  { label: "Invite your team to the CRM", href: "/settings" },
  { label: "Connect your email (Gmail or Outlook)", href: "/integrations" },
  { label: "Create your first automation", href: "/automations" },
  { label: "Enable AI Agents", href: "/ai/agents" },
];

export function GettingStartedChecklist() {
  const [done, setDone] = useState<Record<number, boolean>>({});

  return (
    <div className="bg-card rounded-xl border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Getting Started Checklist
        </h2>
      </div>
      <div className="space-y-2">
        {checklist.map((item, i) => {
          const checked = !!done[i];
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
            >
              <button
                type="button"
                aria-pressed={checked}
                onClick={() => setDone((prev) => ({ ...prev, [i]: !prev[i] }))}
                className={`shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                  checked
                    ? "bg-brand-sky border-brand-sky"
                    : "border-muted-foreground/40 hover:border-brand-sky"
                }`}
              >
                {checked && (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <Link
                href={item.href}
                scroll={false}
                className={`text-sm flex-1 transition-colors hover:text-brand-sky ${
                  checked ? "line-through text-muted-foreground" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {checked ? "Done" : "Open"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}