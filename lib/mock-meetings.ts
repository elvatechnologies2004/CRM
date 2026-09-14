import type { CrmMeeting, MeetingType } from "@/lib/types";

export const meetingTypes: MeetingType[] = [
  "Discovery",
  "Product Demo",
  "Follow-up",
  "Negotiation",
  "Contract Signing",
  "Internal",
  "Kickoff",
  "Check-in",
];

export const meetingMocks: CrmMeeting[] = [];

export const followUpMocks: string[] = [];

export function getMeetingById(id: string): CrmMeeting | undefined {
  return meetingMocks.find((meeting) => meeting.id === id);
}

export function meetingsByOwner(ownerName: string): CrmMeeting[] {
  return meetingMocks.filter((meeting) => meeting.ownerName === ownerName);
}