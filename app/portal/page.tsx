import { PortalPageClient } from "@/components/portal/portal-page-client";
import { portalActivities, portalMetrics } from "@/lib/mock-portal";

export default function PortalPage() {
  return <PortalPageClient initialMetrics={portalMetrics} initialActivities={portalActivities} />;
}