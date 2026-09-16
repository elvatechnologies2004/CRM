import {
  ArrowRightLeft,
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  BookUser,
  Building2,
  Calendar,
  CheckSquare,
  CircleHelp,
  ContactRound,
  CreditCard,
  FileText,
  FilterX,
  FolderKanban,
  Globe,
  Headphones,
  HeartHandshake,
  Inbox,
  Kanban,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageCircle,
  Network,
  Package,
  PenSquare,
  Phone,
  Plug,
  Rocket,
  Settings,
  Shuffle,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Video,
  Wallet,
  Workflow,
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
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [
      { label: "Leads", href: "/leads", icon: UserPlus },
      { label: "Contacts", href: "/contacts", icon: ContactRound },
      { label: "Companies", href: "/companies", icon: Building2 },
      { label: "Deals", href: "/deals", icon: BookUser },
      { label: "Pipeline", href: "/pipeline", icon: Kanban },
    ],
  },
  {
    title: "Activities",
    items: [
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Meetings", href: "/meetings", icon: Video },
      { label: "Calls", href: "/calls", icon: Phone },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "WhatsApp", href: "/integrations/whatsapp", icon: MessageCircle },
    ],
  },
  {
    title: "Enterprise",
    items: [
      { label: "Hierarchy", href: "/enterprise/hierarchy", icon: Network },
      { label: "Territories", href: "/enterprise/territories", icon: Globe },
      { label: "Lead Routing", href: "/enterprise/routing", icon: Shuffle },
      { label: "Workflows", href: "/enterprise/workflows", icon: Workflow },
      { label: "Approvals", href: "/approvals", icon: BadgeCheck },
    ],
  },
  {
    title: "Automation & AI",
    items: [
      { label: "Automations", href: "/automations", icon: ArrowRightLeft },
      { label: "AI Assistant", href: "/ai", icon: Sparkles },
      { label: "AI Agents", href: "/ai/agents", icon: Bot },
      { label: "AI Insights", href: "/ai/insights", icon: PenSquare },
    ],
  },
  {
    title: "Revenue",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Quotes", href: "/quotes", icon: FileText },
      { label: "Proposals", href: "/proposals", icon: Rocket },
      { label: "Invoices", href: "/invoices", icon: CreditCard },
      { label: "Payments", href: "/invoices?tab=payments", icon: Wallet },
      { label: "Subscriptions", href: "/subscriptions", icon: TrendingUp },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Customer Success", href: "/customer-success", icon: HeartHandshake },
      { label: "Support", href: "/support", icon: Headphones },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Campaigns", href: "/marketing", icon: Megaphone },
      { label: "Forms", href: "/marketing/forms", icon: PenSquare },
      { label: "Landing Pages", href: "/marketing/landing-pages", icon: FileText },
      { label: "Sources", href: "/marketing/sources", icon: ContactRound },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Forecast", href: "/forecast", icon: TrendingUp },
      { label: "Goals", href: "/goals", icon: Target },
      { label: "Win / Loss", href: "/reports/win-loss", icon: BookUser },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Data Quality", href: "/data-quality", icon: FilterX },
      { label: "Portal", href: "/portal", icon: ContactRound },
      { label: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Help & Support", href: "/help", icon: CircleHelp },
      { label: "Send Feedback", href: "/feedback", icon: MessageCircle },
    ],
  },
];

export const sidebarFooterNav: SidebarNavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Analytics", href: "/settings/analytics", icon: BarChart3 },
  { label: "Billing & Plan", href: "/settings/billing", icon: CreditCard },
  { label: "Help & Support", href: "/help", icon: CircleHelp },
];