"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { cn } from "@/lib/utils";
import { SIDEBAR_STORAGE_KEY } from "@/lib/layout";

const AUTH_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

// Public marketing + legal pages render WITHOUT the CRM shell (Step 97).
const MARKETING_PATH_PREFIXES = [
  "/features",
  "/ai-crm",
  "/automation",
  "/sales",
  "/pricing",
  "/integrations",
  "/security",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
  "/acceptable-use",
  "/updates",
];

// Platform Administration has its own dedicated shell (AdminShell).
const PLATFORM_ADMIN_PREFIX = "/admin";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === "true");
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const isAuthRoute = AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const isMarketingRoute =
    pathname === "/" ||
    MARKETING_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  const isPlatformAdminRoute =
    pathname === PLATFORM_ADMIN_PREFIX ||
    pathname.startsWith(`${PLATFORM_ADMIN_PREFIX}/`);

  if (isAuthRoute || isMarketingRoute || isPlatformAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-svh w-full">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-svh flex-col transition-[padding-left] duration-300 ease-in-out",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"
        )}
      >
        <TopNavbar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}