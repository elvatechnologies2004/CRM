import {
  Activity,
  Building2,
  CreditCard,
  Flag,
  Gauge,
  Headphones,
  LayoutDashboard,
  Plug,
  ScrollText,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
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
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: TrendingUp },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "Support", href: "/admin/support", icon: Headphones },
  { label: "Usage & Limits", href: "/admin/usage", icon: Gauge },
  { label: "AI Operations", href: "/admin/ai", icon: Sparkles },
  { label: "Automations", href: "/admin/automations", icon: Workflow },
  { label: "Integrations", href: "/admin/integrations", icon: Plug },
  { label: "System Health", href: "/admin/system", icon: Activity },
  { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
  { label: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
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