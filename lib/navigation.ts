import {
  BarChart3,
  CircleHelp,
  CreditCard,
  Kanban,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarNavSection {
  title?: string;
  items: SidebarNavItem[];
}

export const sidebarNav: SidebarNavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Leads", href: "/leads", icon: Users },
      { label: "Opportunities", href: "/opportunities", icon: Kanban },
    ],
  },
];

export const sidebarFooterNav: SidebarNavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Analytics", href: "/settings/analytics", icon: BarChart3 },
  { label: "Billing & Plan", href: "/settings/billing", icon: CreditCard },
  { label: "Help & Support", href: "/help", icon: CircleHelp },
];