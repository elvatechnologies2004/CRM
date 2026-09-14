import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";
import { notificationMocks } from "@/lib/mock-notifications";

export default function NotificationsPage() {
  return <NotificationsPageClient initialNotifications={notificationMocks} />;
}