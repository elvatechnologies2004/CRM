"use server";

import { revalidatePath } from "next/cache";

import {
  addLeadNote,
  archiveLead,
  convertLead,
  createLead,
  deleteLead,
  getLeadActivities,
  getLeadById,
  getLeadNotes,
  updateLead,
} from "@/lib/crm/leads";
import { logActivity } from "@/lib/crm/activity";
import { getTasks } from "@/lib/crm/tasks";
import { parseTags } from "@/lib/lead-form";
import type {
  LeadActivity,
  LeadNote,
  LeadRecord,
  LeadStatus,
  LeadTask,
  TaskPriority,
} from "@/lib/types";

export interface LeadActionResult {
  lead: LeadRecord | null;
  error: string | null;
}

export interface LeadActionInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  companyName?: string;
  jobTitle?: string;
  country?: string;
  city?: string;
  source?: string;
  status?: string;
  expectedValue?: string;
  interest?: string;
  tags?: string;
  notes?: string;
  ownerId?: string;
}

export async function createLeadAction(input: LeadActionInput): Promise<LeadActionResult> {
  if (!input.firstName.trim() && !input.lastName.trim()) {
    return { lead: null, error: "Lead name is required" };
  }
  const lead = await createLead({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone || undefined,
    whatsapp: input.whatsapp || undefined,
    companyName: input.companyName?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    source: input.source || "Website",
    status: input.status || "New",
    expectedValue: input.expectedValue ? Number(input.expectedValue) : undefined,
    interest: input.interest?.trim() || undefined,
    tags: input.tags ? parseTags(input.tags) : [],
    description: input.notes?.trim() || undefined,
    ownerId: input.ownerId || undefined,
  });
  if (!lead) {
    return { lead: null, error: "Failed to create lead" };
  }
  revalidatePath("/leads");
  return { lead, error: null };
}

export async function updateLeadAction(input: LeadActionInput & { id: string }): Promise<LeadActionResult> {
  const lead = await updateLead({
    id: input.id,
    firstName: input.firstName.trim() || undefined,
    lastName: input.lastName.trim() || undefined,
    email: input.email.trim() || undefined,
    phone: input.phone || undefined,
    whatsapp: input.whatsapp || undefined,
    companyName: input.companyName?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    source: input.source || undefined,
    status: input.status || undefined,
    expectedValue: input.expectedValue ? Number(input.expectedValue) : undefined,
    interest: input.interest?.trim() || undefined,
    tags: input.tags ? parseTags(input.tags) : undefined,
    description: input.notes?.trim() || undefined,
    ownerId: input.ownerId || undefined,
  });
  if (!lead) {
    return { lead: null, error: "Failed to update lead" };
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${input.id}`);
  return { lead, error: null };
}

export async function updateLeadStatusAction(
  id: string,
  status: LeadStatus,
  details?: {
    source?: string;
    reason?: string;
    notes?: string;
  }
): Promise<LeadActionResult> {
  const lead = await updateLead({
    id,
    status,
    unqualifiedReason: status === "Unqualified" ? details?.reason : undefined,
    unqualifiedNotes: status === "Unqualified" ? details?.notes : undefined,
  });
  if (!lead) {
    return { lead: null, error: "Failed to move lead" };
  }

  void logActivity({
    activityType: "lead_stage_changed",
    relatedType: "lead",
    leadId: id,
    relatedId: id,
    title: `Stage changed to ${status}`,
    description: details?.reason ? `Reason: ${details.reason}` : undefined,
    metadata: {
      from: "kanban",
      source: details?.source ?? "ui",
      reason: details?.reason ?? null,
      notes: details?.notes ?? null,
    },
    occurredAt: new Date().toISOString(),
  }).catch(() => undefined);

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { lead, error: null };
}

export async function convertLeadAction(id: string): Promise<{ dealId: string | null; error: string | null }> {
  const dealId = await convertLead(id);
  if (!dealId) {
    return { dealId: null, error: "Failed to convert lead to deal" };
  }

  revalidatePath("/leads");
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  return { dealId, error: null };
}

export async function deleteLeadAction(id: string): Promise<{ ok: boolean; error: string | null }> {
  const ok = await deleteLead(id);
  if (!ok) {
    return { ok: false, error: "Failed to delete lead" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true, error: null };
}

export interface LeadQuickViewData {
  lead: LeadRecord | null;
  notes: LeadNote[];
  activities: LeadActivity[];
  tasks: LeadTask[];
}

function toUiPriority(priority: string): TaskPriority {
  const value = priority.toLowerCase();
  if (value === "high" || value === "urgent") return "high";
  if (value === "low") return "low";
  return "medium";
}

export async function getLeadQuickViewAction(id: string): Promise<LeadQuickViewData> {
  const [lead, notes, activities, taskResult] = await Promise.all([
    getLeadById(id),
    getLeadNotes(id),
    getLeadActivities(id),
    getTasks({ relatedType: "Lead", relatedId: id, pageSize: 20 }),
  ]);

  const tasks: LeadTask[] = taskResult.rows.map((task) => ({
    id: task.id,
    title: task.title,
    due: task.dueDate,
    priority: toUiPriority(task.priority),
    status: task.status === "Completed" ? "Done" : "Open",
    owner: task.ownerName,
  }));

  return { lead, notes, activities, tasks };
}

export async function addLeadNoteAction(
  leadId: string,
  body: string
): Promise<{ error: string | null }> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Note cannot be empty" };
  }
  const ok = await addLeadNote(leadId, trimmed);
  if (!ok) {
    return { error: "Failed to add note" };
  }
  revalidatePath(`/leads/${leadId}`);
  return { error: null };
}