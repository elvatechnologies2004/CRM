import type {
  LeadActivity,
  LeadEmail,
  LeadFile,
  LeadMeeting,
  LeadNote,
  LeadRecord,
  LeadSourceOption,
  LeadTask,
  LeadWhatsAppMessage,
} from "@/lib/types";
import { toDayLabel, toShortTime } from "@/lib/date-utils";

export const leadOwners: { id: string; name: string; role: string; email: string }[] = [];

export const leadSourceOptions: LeadSourceOption[] = [
  "Website",
  "WhatsApp",
  "LinkedIn",
  "Facebook",
  "Instagram",
  "Referral",
  "Email",
  "Cold Call",
  "Manual",
  "Other",
];

export const leadMocks: LeadRecord[] = [];

export function getLeadById(id: string): LeadRecord | undefined {
  return leadMocks.find((lead) => lead.id === id);
}

export function getLeadActivities(leadId: string): LeadActivity[] {
  return [];
}

export function getLeadNotes(leadId: string): LeadNote[] {
  return [];
}

export function getLeadTasks(leadId: string): LeadTask[] {
  return [];
}

export function getLeadMeetings(leadId: string): LeadMeeting[] {
  return [];
}

export function getLeadEmails(leadId: string): LeadEmail[] {
  return [];
}

export function getLeadWhatsApp(leadId: string): LeadWhatsAppMessage[] {
  return [];
}

export function getLeadFiles(leadId: string): LeadFile[] {
  return [];
}

export function leadSummaryStats() {
  return { total: 0, newLeads: 0, qualified: 0, hot: 0, conversionRate: 0 };
}

export function lastActivityLabel(isodate: string) {
  return toDayLabel(isodate);
}

export function nextFollowUpLabel(isodate: string) {
  const then = new Date(isodate);
  const now = new Date();
  const diffDays = Math.round((then.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} days`;
}

export { toShortTime, toDayLabel };