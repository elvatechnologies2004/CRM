"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket } from "lucide-react";

import { sidebarFooterNav, sidebarNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/avatar";
import { currentUser } from "@/lib/mock-data";
import {
  SIDEBAR_NARROW_WIDTH,
  SIDEBAR_WIDE_WIDTH,
} from "@/lib/layout";

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      scroll={false}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-1 outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50",
        collapsed && "justify-center px-0"
      )}
      aria-label="FinloNexa CRM home"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-purple text-white shadow-sm">
        <Rocket className="h-4 w-4" aria-hidden />
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-ink">
            FinloNexa<span className="text-primary"> CRM</span>
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            AI-first workspace
          </span>
        </span>
      )}
    </Link>
  );
}

function SidebarNavList({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <nav className="flex flex-col gap-5" aria-label="Main navigation">
      {sidebarNav.map((section, index) => (
        <div key={section.title ?? `section_${index}`} className="flex flex-col gap-1">
          {section.title && !collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
              {section.title}
            </p>
          )}
          {section.title && collapsed && (
            <div className="mx-3 mb-1 h-px bg-border" aria-hidden />
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    scroll={false}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return content;
}

function SidebarUserCard({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-border bg-card p-2",
        collapsed && "justify-center border-transparent p-0"
      )}
    >
      <InitialsAvatar name={currentUser.name} className="h-8 w-8" />
      {!collapsed && (
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-medium text-ink">
            {currentUser.name}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {currentUser.role}
          </span>
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  return (
    <>
      {/* Mobile drawer */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "block" : "hidden")}
        role="presentation"
      >
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={-1}
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
          onClick={onMobileClose}
        />
        <aside
          className="glass-strong fixed inset-y-0 left-0 z-10 flex w-[264px] flex-col"
          style={{ width: SIDEBAR_WIDE_WIDTH }}
        >
          <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
            <SidebarLogo collapsed={false} />
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
            <SidebarNavList collapsed={false} onNavigate={onMobileClose} />
          </div>
          <div className="shrink-0 border-t border-border p-3">
            <SidebarUserCard collapsed={false} />
          </div>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "glass-strong fixed inset-y-0 left-0 z-30 hidden flex-col transition-[width] duration-300 ease-in-out lg:flex"
        )}
        style={{
          width: collapsed ? SIDEBAR_NARROW_WIDTH : SIDEBAR_WIDE_WIDTH,
        }}
        aria-label="Sidebar navigation"
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-border px-4",
            collapsed && "justify-center px-0"
          )}
        >
          <SidebarLogo collapsed={collapsed} />
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <SidebarNavList collapsed={collapsed} />
        </div>
        <div className="flex shrink-0 flex-col gap-1 border-t border-border p-3">
          <div className="flex flex-col gap-0.5">
            {sidebarFooterNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  scroll={false}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
          <SidebarUserCard collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}