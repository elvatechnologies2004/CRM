import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Filter = [column: string, value: string];

async function deleteWhere(table: string, filters: Filter[]): Promise<void> {
  const admin = createSupabaseAdminClient();
  let query = admin.from(table).delete();
  for (const [column, value] of filters) {
    query = query.eq(column, value);
  }
  const { error } = await query;
  if (error) throw error;
}

async function verifyDeleted(table: string, id: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from(table).select("id").eq("id", id).maybeSingle();
  if (error) throw error;
  if (data) throw new Error(`${table} record was not deleted.`);
}

export async function permanentlyDeleteOpportunity(opportunityId: string, organizationId: string): Promise<string> {
  await deleteWhere("attachments", [["organization_id", organizationId], ["record_type", "deal"], ["record_id", opportunityId]]);
  await deleteWhere("record_tags", [["organization_id", organizationId], ["record_type", "deal"], ["record_id", opportunityId]]);
  await deleteWhere("notes", [["organization_id", organizationId], ["related_type", "deal"], ["related_id", opportunityId]]);
  await deleteWhere("meetings", [["organization_id", organizationId], ["related_type", "deal"], ["related_id", opportunityId]]);
  await deleteWhere("tasks", [["organization_id", organizationId], ["related_type", "deal"], ["related_id", opportunityId]]);

  const admin = createSupabaseAdminClient();
  const { error: activitiesError } = await admin
    .from("activities")
    .delete()
    .eq("organization_id", organizationId)
    .or(`deal_id.eq.${opportunityId},and(related_type.eq.deal,related_id.eq.${opportunityId})`);
  if (activitiesError) throw activitiesError;

  await deleteWhere("quotes", [["organization_id", organizationId], ["deal_id", opportunityId]]);

  const { data, error } = await admin
    .from("deals")
    .delete()
    .eq("id", opportunityId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Opportunity not found or access denied.");

  await verifyDeleted("deals", opportunityId);
  return data.id as string;
}

export async function permanentlyDeleteLead(leadId: string, organizationId: string): Promise<string> {
  await deleteWhere("attachments", [["organization_id", organizationId], ["record_type", "lead"], ["record_id", leadId]]);
  await deleteWhere("record_tags", [["organization_id", organizationId], ["record_type", "lead"], ["record_id", leadId]]);
  await deleteWhere("notes", [["organization_id", organizationId], ["related_type", "lead"], ["related_id", leadId]]);
  await deleteWhere("meetings", [["organization_id", organizationId], ["related_type", "lead"], ["related_id", leadId]]);
  await deleteWhere("tasks", [["organization_id", organizationId], ["related_type", "lead"], ["related_id", leadId]]);

  const admin = createSupabaseAdminClient();
  const { error: activitiesError } = await admin
    .from("activities")
    .delete()
    .eq("organization_id", organizationId)
    .or(`lead_id.eq.${leadId},and(related_type.eq.lead,related_id.eq.${leadId})`);
  if (activitiesError) throw activitiesError;

  const { data, error } = await admin
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Lead not found or access denied.");

  await verifyDeleted("leads", leadId);
  return data.id as string;
}
