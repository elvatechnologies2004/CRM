import { notFound } from "next/navigation";

import { LeadDetailView } from "@/components/leads/lead-detail-view";
import { getLeadActivities, getLeadById, getLeadNotes } from "@/lib/crm/leads";
import { getActiveOrgId, fetchOwnerIndex } from "@/lib/crm/base";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getLeadActivities as getMockActivities,
  getLeadById as getMockLeadById,
  getLeadEmails,
  getLeadFiles,
  getLeadMeetings,
  getLeadNotes as getMockNotes,
  getLeadTasks,
  getLeadWhatsApp,
  leadOwners,
} from "@/lib/mock-leads";
import type { User } from "@/lib/types";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let lead = null;
  let owners: User[] = leadOwners;
  let activities = null;

  const realAvailable = isSupabaseConfigured() && (await getLeadById(id)) !== null;

  if (realAvailable) {
    lead = await getLeadById(id);
    activities = await getLeadActivities(id);
    const initialNotes = await getLeadNotes(id);

    let realOwners = owners;
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const organizationId = await getActiveOrgId(supabase);
      if (organizationId) {
        const index = await fetchOwnerIndex(supabase, organizationId);
        realOwners = Object.entries(index).map(([userId, { name, email }]) => ({
          id: userId,
          name,
          role: "Member",
          email: email ?? `${userId}@org.local`,
        }));
        owners = realOwners;
      }
    }

    if (!lead) {
      notFound();
    }

    return (
      <LeadDetailView
        lead={lead}
        owners={owners}
        activities={activities}
        initialNotes={initialNotes}
        initialTasks={[]}
        initialMeetings={[]}
        initialEmails={[]}
        initialWhatsApp={[]}
        initialFiles={[]}
      />
    );
  }

  const mock = getMockLeadById(id);
  if (!mock) {
    notFound();
  }

  return (
    <LeadDetailView
      lead={mock}
      owners={leadOwners}
      activities={getMockActivities(id)}
      initialNotes={getMockNotes(id)}
      initialTasks={getLeadTasks(id)}
      initialMeetings={getLeadMeetings(id)}
      initialEmails={getLeadEmails(id)}
      initialWhatsApp={getLeadWhatsApp(id)}
      initialFiles={getLeadFiles(id)}
    />
  );
}