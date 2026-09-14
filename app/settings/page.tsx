import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { settingMocks } from "@/lib/mock-settings";

export default function SettingsPage() {
  return <SettingsPageClient initialSettings={settingMocks} />;
}