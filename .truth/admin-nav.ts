import {
  LayoutDashboard,
  BriefcaseBusiness,
  ContactRound,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Platform Administration navigation (Phase 7). */
export const adminNavItems: AdminNavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: ContactRound },
  { label: "Opportunities", href: "/admin/opportunities", icon: BriefcaseBusiness },
  { label: "Users & Access", href: "/admin/users", icon: Users },
  { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function findAdminNavItem(pathname: string): AdminNavItem | null {
  const normalized = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const match = adminNavItems.find(
    (item) =>
      item.href === normalized ||
      (item.href !== "/admin" && normalized.startsWith(`${item.href}/`)),
  );
  return match ?? null;
}

/** Client-safe role labels (mirrors lib/admin/permissions.ts). */
export const platformRoleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  platform_admin: "Platform Admin",
  support_admin: "Support Admin",
  billing_admin: "Billing Admin",
  viewer: "Viewer",
};