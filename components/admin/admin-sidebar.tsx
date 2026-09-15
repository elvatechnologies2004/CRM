"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, ShieldCheck } from "lucide-react";

import { adminNavItems } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Platform Administration">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            scroll={false}
            onClick={onMobileClose}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
            )}
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-purple text-white shadow-sm">
          <Rocket className="h-4 w-4" aria-hidden />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[14px] font-bold tracking-tight text-ink">
            FinloNexa CRM
          </span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-purple">
            Platform Administration
          </span>
        </span>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {nav}
      </div>
      <div className="shrink-0 border-t border-border px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
          <span>Back to CRM</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "block" : "hidden")}
        role="presentation"
      >
        <button
          type="button"
          aria-label="Close admin navigation"
          tabIndex={-1}
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
          onClick={onMobileClose}
        />
        <aside className="glass-strong fixed inset-y-0 left-0 z-10 flex w-[264px] flex-col">
          {sidebarInner}
        </aside>
      </div>

      <aside
        className="glass-strong fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col lg:flex"
        aria-label="Platform administration sidebar"
      >
        {sidebarInner}
      </aside>
    </>
  );
}