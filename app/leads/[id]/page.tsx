import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLeadById } from "@/lib/crm/leads";
import { getActiveOrgId, fetchOwnerIndex } from "@/lib/crm/base";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  const owners = organizationId ? Object.entries(await fetchOwnerIndex(supabase, organizationId)).map(([id, value]) => ({
    id,
    name: value.name,
    role: "Member",
    email: value.email ?? "",
    organizationId,
  })) : [];

  return <LeadDetailClient lead={lead} owners={owners} />;
}
