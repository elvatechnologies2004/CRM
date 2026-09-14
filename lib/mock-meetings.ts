import type { CrmMeeting, AiMeetingSummary, MeetingType } from "@/lib/types";
import { iso } from "@/lib/date-utils";

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

const today = new Date();

function isoTodayDays(daysFromToday: number, time: string): string {
  const d = new Date(today);
  d.setDate(d.getDate() + daysFromToday);
  const parts = time.split(":").map(Number);
  d.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0);
  return d.toISOString();
}

const summaries: Record<string, AiMeetingSummary> = {
  mt_001: {
    keyDiscussion: [
      "Consolidating three internal tools into one automation platform",
      "Approval workflow requirements across finance and operations",
    ],
    customerRequirements: [
      "Minimum 40 user licenses with growth-plan add-ons",
      "SSO and audit logs required by procurement",
    ],
    objections: [
      "Concerned about migration effort from legacy tools",
      "Wants phased rollout to avoid downtime",
    ],
    actionItems: [
      "Send implementation timeline by Thursday",
      "Book technical deep-dive with IT team",
    ],
    followUpRecommendation: "Follow up on proposal status within 3 days.",
  },
  mt_002: {
    keyDiscussion: [
      "Omnichannel commerce platform evolution",
      "Upcoming Black Friday capacity requirements",
    ],
    customerRequirements: [
      "Unified order and inventory view across channels",
      "Enterprise SLA with 99.9% uptime",
    ],
    objections: [
      "Budget approval still pending from finance board",
      "Wants 3-year pricing commitment",
    ],
    actionItems: [
      "Prepare board presentation",
      "Draft 3-year contract terms for review",
    ],
    followUpRecommendation: "Send contract draft after budget confirmation.",
  },
  mt_003: {
    keyDiscussion: [
      "White-label capability for client switching",
      "API/Webhook access for campaign automation",
    ],
    customerRequirements: [
      "Agency plan with sub-account management",
      "Custom reporting exports",
    ],
    objections: ["Concerned about per-agency pricing model"],
    actionItems: [
      "Share security whitepaper",
      "Finalize timeline section of proposal",
    ],
    followUpRecommendation: "Re-engage after proposal viewed for 48h without reply.",
  },
};

export const meetingMocks: CrmMeeting[] = [
  {
    id: "mt_001",
    title: "Techno Solutions Automation Review",
    meetingType: "Product Demo",
    date: isoTodayDays(0, "10:00"),
    time: "10:00",
    duration: 45,
    ownerId: "u_1",
    ownerName: "Hussain Ali",
    participants: [
      { id: "l_001", name: "Ahmed Khan", email: "ahmed.khan@technosolutions.com" },
      { id: "u_3", name: "Sara Ahmed", email: "sara.ahmed@relvo.io" },
    ],
    relatedDealId: "d_001",
    relatedDealName: "Techno Automation Suite",
    relatedContactId: "ct_001",
    relatedContactName: "Ahmed Khan",
    meetingLink: "https://meet.relvo.io/techno-review",
    status: "scheduled",
    createdAt: iso(5, "09:00"),
    aiSummary: summaries.mt_001,
  },
  {
    id: "mt_002",
    title: "Skyline Retail Contract Review",
    meetingType: "Contract Signing",
    date: isoTodayDays(1, "13:00"),
    time: "13:00",
    duration: 30,
    ownerId: "u_1",
    ownerName: "Hussain Ali",
    participants: [
      { id: "l_006", name: "Omar Farooq", email: "omar@skylineretail.com" },
      { id: "u_4", name: "Zain Malik", email: "zain.malik@relvo.io" },
    ],
    relatedDealId: "d_006",
    relatedDealName: "Skyline Retail Omnichannel",
    relatedContactId: "ct_006",
    relatedContactName: "Omar Farooq",
    meetingLink: "https://meet.relvo.io/skyline-contract",
    status: "scheduled",
    createdAt: iso(4, "12:00"),
    aiSummary: summaries.mt_002,
  },
  {
    id: "mt_003",
    title: "Lotus Digital Technical Deep-dive",
    meetingType: "Product Demo",
    date: isoTodayDays(2, "16:00"),
    time: "16:00",
    duration: 45,
    ownerId: "u_3",
    ownerName: "Sara Ahmed",
    participants: [
      { id: "l_009", name: "Hina Shah", email: "hina@lotusdigital.ae" },
      { id: "u_2", name: "Ali Khan", email: "ali.khan@relvo.io" },
    ],
    relatedDealId: "d_009",
    relatedDealName: "Lotus Digital Agency Suite",
    relatedContactId: "ct_009",
    relatedContactName: "Hina Shah",
    meetingLink: "https://meet.relvo.io/lotus-tech",
    status: "scheduled",
    createdAt: iso(4, "16:00"),
    aiSummary: summaries.mt_003,
  },
  {
    id: "mt_004",
    title: "Nova Systems Demo",
    meetingType: "Product Demo",
    date: isoTodayDays(0, "15:00"),
    time: "15:00",
    duration: 40,
    ownerId: "u_3",
    ownerName: "Sara Ahmed",
    participants: [
      { id: "l_003", name: "John Smith", email: "john.smith@novasystems.io" },
      { id: "u_1", name: "Hussain Ali", email: "hussain.ali@relvo.io" },
    ],
    relatedDealId: "d_003",
    relatedDealName: "Nova Cloud Migration",
    relatedContactId: "ct_003",
    relatedContactName: "John Smith",
    meetingLink: "https://meet.relvo.io/nova-demo",
    status: "scheduled",
    createdAt: iso(2, "11:00"),
  },
  {
    id: "mt_005",
    title: "BrightWave Intro Call",
    meetingType: "Discovery",
    date: isoTodayDays(1, "14:30"),
    time: "14:30",
    duration: 15,
    ownerId: "u_2",
    ownerName: "Ali Khan",
    participants: [
      { id: "l_002", name: "Sarah Malik", email: "sarah.malik@brightwave.com" },
    ],
    relatedDealId: "d_002",
    relatedDealName: "BrightWave Growth Pack",
    relatedContactId: "ct_002",
    relatedContactName: "Sarah Malik",
    meetingLink: "https://meet.relvo.io/brightwave-intro",
    status: "scheduled",
    createdAt: iso(3, "10:00"),
  },
  {
    id: "mt_006",
    title: "GreenTech Proposal Walkthrough",
    meetingType: "Follow-up",
    date: isoTodayDays(3, "12:00"),
    time: "12:00",
    duration: 30,
    ownerId: "u_4",
    ownerName: "Zain Malik",
    participants: [
      { id: "l_004", name: "Fatima Noor", email: "fatima.noor@greentech.pk" },
    ],
    relatedDealId: "d_004",
    relatedDealName: "GreenTech Inventory",
    relatedContactId: "ct_004",
    relatedContactName: "Fatima Noor",
    meetingLink: "https://meet.relvo.io/greentech-walkthrough",
    status: "scheduled",
    createdAt: iso(3, "10:30"),
  },
  {
    id: "mt_007",
    title: "Techno Solutions Discovery Call",
    meetingType: "Discovery",
    date: isoTodayDays(-7, "11:00"),
    time: "11:00",
    duration: 22,
    ownerId: "u_1",
    ownerName: "Hussain Ali",
    participants: [{ id: "l_001", name: "Ahmed Khan" }],
    relatedDealId: "d_001",
    relatedDealName: "Techno Automation Suite",
    relatedContactId: "ct_001",
    relatedContactName: "Ahmed Khan",
    notes: "Covered automation pain points and approval workflows.",
    outcome: "BANT confirmed, moved to Qualified.",
    actionItems: ["Send formal proposal", "Share pricing page"],
    status: "completed",
    createdAt: iso(9, "09:00"),
  },
  {
    id: "mt_008",
    title: "Skyline Retail Proposal Walkthrough",
    meetingType: "Negotiation",
    date: isoTodayDays(-1, "18:00"),
    time: "18:00",
    duration: 40,
    ownerId: "u_1",
    ownerName: "Hussain Ali",
    participants: [
      { id: "l_006", name: "Omar Farooq" },
      { id: "u_4", name: "Zain Malik" },
    ],
    relatedDealId: "d_006",
    relatedDealName: "Skyline Retail Omnichannel",
    relatedContactId: "ct_006",
    relatedContactName: "Omar Farooq",
    notes: "Attended by VP Commerce + CFO.",
    outcome: "Budget approved, 3-year roadmap requested.",
    actionItems: ["Prepare board presentation", "Send contract draft"],
    status: "completed",
    createdAt: iso(6, "09:00"),
  },
  {
    id: "mt_009",
    title: "Lotus Digital Intro Call",
    meetingType: "Discovery",
    date: isoTodayDays(-8, "10:30"),
    time: "10:30",
    duration: 20,
    ownerId: "u_3",
    ownerName: "Sara Ahmed",
    participants: [{ id: "l_009", name: "Hina Shah" }],
    relatedDealId: "d_009",
    relatedDealName: "Lotus Digital Agency Suite",
    relatedContactId: "ct_009",
    relatedContactName: "Hina Shah",
    notes: "Introduction to agency plan and white-label.",
    outcome: "Positive, waiting on budget details.",
    actionItems: ["Send security whitepaper"],
    status: "completed",
    createdAt: iso(10, "09:00"),
  },
];

/** Standalone follow-up meetings map (calendar feed uses task + meeting + call data). */
export const followUpMocks: string[] = [
  "Send formal proposal to Techno Solutions",
  "Follow-up call with BrightWave",
  "Proposal walkthrough with GreenTech",
];

export function getMeetingById(id: string): CrmMeeting | undefined {
  return meetingMocks.find((meeting) => meeting.id === id);
}

export function meetingsByOwner(ownerName: string): CrmMeeting[] {
  return meetingMocks.filter((meeting) => meeting.ownerName === ownerName);
}