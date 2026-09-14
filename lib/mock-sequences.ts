import type {
  CrmSequence,
  SequenceEnrollment,
  SequenceStatus,
  SequenceStep,
  SequenceStepType,
  SequenceStopEvent,
} from "@/lib/types";

export const sequenceStepTypes: SequenceStepType[] = [
  "Email", "WhatsApp", "SMS", "Call Task", "Manual Task", "Wait",
];

export const sequenceStatuses: SequenceStatus[] = ["Draft", "Active", "Paused", "Archived"];

export const sequenceStopEvents: SequenceStopEvent[] = [
  "Customer replies", "Deal created", "Meeting booked", "Manually stopped",
];

export const sequenceMocks: CrmSequence[] = [];

export const enrollmentMocks: SequenceEnrollment[] = [];

export function getSequence(id: string): CrmSequence | undefined {
  return sequenceMocks.find((s) => s.id === id);
}

export function getEnrollmentsForSequence(sequenceId: string): SequenceEnrollment[] {
  return enrollmentMocks.filter((e) => e.sequenceId === sequenceId);
}