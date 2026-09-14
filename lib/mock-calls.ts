import type { CallRecord, CallDirection, CallOutcome } from "@/lib/types";

export const callDirections: CallDirection[] = ["Inbound", "Outbound"];

export const callOutcomes: CallOutcome[] = [
  "Connected",
  "No Answer",
  "Voicemail",
  "Busy",
  "Follow-up Needed",
];

export const callMocks: CallRecord[] = [];

export function getCallById(id: string): CallRecord | undefined {
  return callMocks.find((call) => call.id === id);
}

export function callsByOwner(ownerName: string): CallRecord[] {
  return callMocks.filter((call) => call.ownerName === ownerName);
}

export function topCallers() {
  return {};
}