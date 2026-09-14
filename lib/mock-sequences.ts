import type {
  CrmSequence,
  SequenceEnrollment,
  SequenceStatus,
  SequenceStep,
  SequenceStepType,
  SequenceStopEvent,
} from "@/lib/types";
import { iso } from "@/lib/date-utils";
import { leadOwners } from "@/lib/mock-leads";

export const sequenceStepTypes: SequenceStepType[] = [
  "Email", "WhatsApp", "SMS", "Call Task", "Manual Task", "Wait",
];

export const sequenceStatuses: SequenceStatus[] = ["Draft", "Active", "Paused", "Archived"];

export const sequenceStopEvents: SequenceStopEvent[] = [
  "Customer replies", "Deal created", "Meeting booked", "Manually stopped",
];

const owner = leadOwners[0];

const completedSteps = (sequenceId: string, titles: string[]): SequenceStep[] =>
  titles.map((title, index) => ({
    id: `${sequenceId}_step_${index + 1}`,
    sequenceId,
    title,
    type: "Email" as SequenceStepType,
    delayDays: index === 0 ? 0 : index === 1 ? 2 : 5,
    order: index + 1,
    content: `Email subject and copy for "${title}".`,
  }));

export const sequenceMocks: CrmSequence[] = [
  {
    id: "seq_001",
    name: "Cold Outreach — New Leads",
    description: "3-touch email sequence for fresh inbound leads with a call task.",
    ownerId: owner.id,
    ownerName: owner.name,
    status: "Active",
    steps: completedSteps("seq_001", ["Welcome email", "Value proposition", "Follow-up call"]),
    enrollmentCount: 24,
    replyRate: 25,
    meetingsBooked: 2,
    conversionRate: 4,
    stopEvents: ["Customer replies", "Meeting booked"],
    createdAt: iso(30, "10:00"),
  },
  {
    id: "seq_002",
    name: "Demo Follow-up",
    description: "WhatsApp recap and proposal follow-up after a live demo.",
    ownerId: owner.id,
    ownerName: owner.name,
    status: "Active",
    steps: completedSteps("seq_002", ["WhatsApp demo recap", "Proposal email", "Internal review", "Decision call"]),
    enrollmentCount: 12,
    replyRate: 42,
    meetingsBooked: 3,
    conversionRate: 17,
    stopEvents: ["Customer replies", "Deal created", "Meeting booked"],
    createdAt: iso(20, "09:00"),
  },
  {
    id: "seq_003",
    name: "Re-engagement",
    description: "Win back cold leads who went silent after initial contact.",
    ownerId: owner.id,
    ownerName: owner.name,
    status: "Paused",
    steps: completedSteps("seq_003", ["Check-in email", "SMS nudge"]),
    enrollmentCount: 8,
    replyRate: 13,
    meetingsBooked: 0,
    conversionRate: 0,
    stopEvents: ["Customer replies", "Manually stopped"],
    createdAt: iso(15, "09:00"),
  },
  {
    id: "seq_004",
    name: "Onboarding Checklist",
    description: "Manual internal tasks to onboard newly won accounts.",
    ownerId: owner.id,
    ownerName: owner.name,
    status: "Draft",
    steps: completedSteps("seq_004", ["Internal kickoff", "Handoff to CS", "First check-in"]),
    enrollmentCount: 0,
    replyRate: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    stopEvents: ["Manually stopped"],
    createdAt: iso(6, "12:00"),
  },
];

export const enrollmentMocks: SequenceEnrollment[] = [
  {
    id: "enr_001",
    sequenceId: "seq_001",
    relatedType: "Lead",
    relatedId: "l_001",
    relatedName: "Ahmed Khan",
    enrolledAt: iso(5, "10:00"),
    currentStep: 2,
    status: "Active",
  },
  {
    id: "enr_002",
    sequenceId: "seq_001",
    relatedType: "Lead",
    relatedId: "l_002",
    relatedName: "Sarah Malik",
    enrolledAt: iso(10, "10:00"),
    currentStep: 3,
    status: "Replied",
  },
  {
    id: "enr_003",
    sequenceId: "seq_001",
    relatedType: "Lead",
    relatedId: "l_003",
    relatedName: "John Smith",
    enrolledAt: iso(8, "10:00"),
    currentStep: 1,
    status: "Active",
  },
  {
    id: "enr_004",
    sequenceId: "seq_001",
    relatedType: "Contact",
    relatedId: "ct_003",
    relatedName: "Nadia Hameed",
    enrolledAt: iso(4, "11:00"),
    currentStep: 0,
    status: "Paused",
  },
  {
    id: "enr_005",
    sequenceId: "seq_002",
    relatedType: "Lead",
    relatedId: "l_004",
    relatedName: "Fatima Noor",
    enrolledAt: iso(4, "11:00"),
    currentStep: 1,
    status: "Active",
  },
  {
    id: "enr_006",
    sequenceId: "seq_002",
    relatedType: "Lead",
    relatedId: "l_006",
    relatedName: "Omar Farooq",
    enrolledAt: iso(12, "09:00"),
    currentStep: 4,
    status: "Completed",
  },
  {
    id: "enr_007",
    sequenceId: "seq_003",
    relatedType: "Lead",
    relatedId: "l_007",
    relatedName: "Bilal Aziz",
    enrolledAt: iso(7, "09:00"),
    currentStep: 1,
    status: "Stopped",
  },
];

export function getSequence(id: string): CrmSequence | undefined {
  return sequenceMocks.find((s) => s.id === id);
}

export function getEnrollmentsForSequence(sequenceId: string): SequenceEnrollment[] {
  return enrollmentMocks.filter((e) => e.sequenceId === sequenceId);
}