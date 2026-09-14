import type { Setting, SettingCategory } from "@/lib/types";

export const settingCategories: SettingCategory[] = [
  "General",
  "Security",
  "Notifications",
  "Integrations",
  "Appearance",
];

export const settingMocks: Setting[] = [
  { id: "set_001", category: "General", key: "companyName", value: "Techno Solutions", type: "text", description: "Company name displayed throughout the CRM" },
  { id: "set_002", category: "General", key: "currency", value: "PKR", type: "select", options: ["PKR", "USD", "AED", "EUR"], description: "Default currency for amounts" },
  { id: "set_003", category: "Security", key: "passwordPolicy", value: "required", type: "select", options: ["required", "optional", "disabled"], description: "Password strength requirement" },
  { id: "set_004", category: "Notifications", key: "emailNotifications", value: "true", type: "toggle", description: "Receive email notifications for new activities" },
  { id: "set_005", category: "Notifications", key: "pushNotifications", value: "true", type: "toggle", description: "Receive push notifications on mobile" },
  { id: "set_006", category: "Appearance", key: "theme", value: "light", type: "select", options: ["light", "dark", "system"], description: "UI theme selection" },
];