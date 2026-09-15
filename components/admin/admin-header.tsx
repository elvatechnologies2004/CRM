"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  findAdminNavItem,
} from "@/components/admin/admin-nav";
import { AdminProfileMenu } from "@/components/admin/admin-profile-menu";

export function AdminHeader({
  role,
  onOpenMobile,
}: {
  role: string;
  onOpenMobile: () => void;
}) {
  const pathname = usePathname();
  const item = findAdminNavItem(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-purple">
          Platform Administration
        </span>
        <h1 className="truncate text-[15px] font-bold text-ink">
          {item?.label ?? "Overview"}
        </h1>
      </div>
      <div className="ml-auto">
        <AdminProfileMenu role={role} />
      </div>
    </header>
  );
}