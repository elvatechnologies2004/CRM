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
  User,
} from "@/lib/types";
import { toDayLabel, toShortTime } from "@/lib/date-utils";

export const leadOwners: User[] = [
  { id: "u_1", name: "Hussain Ali", role: "Sales Manager", email: "hussain.ali@relvo.io" },
  { id: "u_2", name: "Ali Khan", role: "Sales Executive", email: "ali.khan@relvo.io" },
  { id: "u_3", name: "Sara Ahmed", role: "Account Executive", email: "sara.ahmed@relvo.io" },
  { id: "u_4", name: "Zain Malik", role: "SDR", email: "zain.malik@relvo.io" },
  { id: "u_5", name: "Ayesha Siddiqui", role: "Sales Executive", email: "ayesha.siddiqui@relvo.io" },
];

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

function iso(daysBack: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const leadMocks: LeadRecord[] = [
  {
    id: "l_001",
    firstName: "Ahmed",
    lastName: "Khan",
    email: "ahmed.khan@technosolutions.com",
    phone: "+92 300 1234567",
    whatsapp: "+92 300 1234567",
    companyId: "c_101",
    companyName: "Techno Solutions",
    jobTitle: "Head of IT",
    country: "Pakistan",
    city: "Karachi",
    source: "LinkedIn",
    status: "Qualified",
    score: 92,
    ownerId: "u_1",
    ownerName: "Hussain Ali",
    expectedValue: 24000,
    currency: "USD",
    budget: "Estimated",
    interest: "Enterprise automation suite",
    tags: ["Enterprise", "Tech", "IT"],
    createdAt: iso(14, "10:15"),
    updatedAt: iso(1, "12:40"),
    lastActivityAt: iso(1, "12:40"),
    nextFollowUpAt: iso(2, "11:00"),
    qualification: {
      budget: "Estimated",
      authority: "Likely Decision Maker",
      need: "Strong",
      timeline: "1–2 Months",
      score: 85,
    },
  },
  {
    id: "l_002",
    firstName: "Sarah",
    lastName: "Malik",
    email: "sarah.malik@brightwave.com",
    phone: "+1 415 555 0132",
    whatsapp: "+1 415 555 0132",
    companyName: "BrightWave",
    jobTitle: "Marketing Director",
    country: "United States",
    city: "San Francisco",
    source: "Website",
    status: "Contacted",
    score: 78,
    ownerId: "u_2",
    ownerName: "Ali Khan",
    expectedValue: 12000,
    currency: "USD",
    budget: "Unclear",
    interest: "Social media analytics",
    tags: ["Marketing", "SMB"],
    createdAt: iso(9, "14:30"),
    updatedAt: iso(3, "09:20"),
    lastActivityAt: iso(3, "09:20"),
    nextFollowUpAt: iso(5, "10:00"),
    qualification: {
      budget: "Unclear",
      authority: "Influencer",
      need: "Moderate",
      timeline: "This Quarter",
      score: 60,
    },
  },
  {
    id: "l_003",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@novasystems.io",
    phone: "+44 20 7946 0188",
    whatsapp: "+44 20 7946 0188",
    companyName: "Nova Systems",
    jobTitle: "CTO",
    country: "United Kingdom",
    city: "London",
    source: "Referral",
    status: "New",
    score: 88,
    ownerId: "u_3",
    ownerName: "Sara Ahmed",
    expectedValue: 18000,
    currency: "GBP",
    budget: "Estimated",
    interest: "Cloud migration support",
    tags: ["Enterprise", "Cloud"],
    createdAt: iso(4, "11:00"),
    updatedAt: iso(4, "11:00"),
    lastActivityAt: iso(2, "15:45"),
    nextFollowUpAt: iso(3, "13:00"),
    qualification: {
      budget: "Estimated",
      authority: "Likely Decision Maker",
      need: "Strong",
      timeline: "1–2 Months",
      score: 72,
    },
  },
  {
    id: "l_004",
    firstName: "Fatima",
    lastName: "Noor",
    email: "fatima.noor@greentech.pk",
    phone: "+92 321 7654321",
    whatsapp: "+92 321 7654321",
    companyName: "GreenTech",
    jobTitle: "Operations Lead",
    country: "Pakistan",
    city: "Lahore",
    source: "WhatsApp",
    status: "Contacted",
    score: 71,
    ownerId: "u_4",
    ownerName: "Zain Malik",
    expectedValue: 9500,
    currency: "USD",
    budget: "Unclear",
    interest: "Inventory automation",
    tags: ["SMB", "Logistics"],
    createdAt: iso(11, "16:20"),
    updatedAt: iso(2, "10:10"),
    lastActivityAt: iso(2, "10:10"),
    nextFollowUpAt: iso(4, "12:00"),
    qualification: {
      budget: "Unclear",
      authority: "Influencer",
      need: "Moderate",
      timeline: "This Quarter",
      score: 55,
    },
  },
  {
    id: "l_005",
    firstName: "Ali",
    lastName: "Raza",
    email: "ali.raza@buildpro.co",
    phone: "+971 50 1234567",
    whatsapp: "+971 50 1234567",
    companyName: "BuildPro",
    jobTitle: "Project Manager",
    country: "United Arab Emirates",
    city: "Dubai",
    source: "Cold Call",
    status: "New",
    score: 65,
    ownerId: "u_5",
    ownerName: "Ayesha Siddiqui",
    expectedValue: 8600,
    currency: "AED",
    budget: "Estimated",
    interest: "Field team tracking",
    tags: ["Construction"],
    createdAt: iso(5, "12:05"),
    updatedAt: iso(5, "12:05"),
    lastActivityAt: iso(6, "17:30"),
    nextFollowUpAt: iso(6, "09:30"),
    qualification: {
      budget: "Estimated",
      authority: "Influencer",
      need: "Moderate",
      timeline: "6+ Months",
      score: 48,
    },
  },
  {
    id: "l_006",
    firstName: "Omar",
    lastName: "Farooq",
    email: "omar@skylineretail.com",
    phone: "+971 4 234 5678",
    whatsapp: "+971 4 234 5678",
    companyName: "Skyline Retail",
    jobTitle: "VP Commerce",
    country: "United Arab Emirates",
    city: "Dubai",
    source: "Facebook",
    status: "Proposal",
    score: 95,
    ownerId: "u_1",
    ownerName: "Hussain Ali",
    expectedValue: 42000,
    currency: "USD",
    budget: "Confirmed",
    interest: "Unified omnichannel commerce",
    tags: ["Enterprise", "Retail"],
    createdAt: iso(20, "09:40"),
    updatedAt: iso(1, "18:00"),
    lastActivityAt: iso(1, "18:00"),
    nextFollowUpAt: iso(1, "15:00"),
    qualification: {
      budget: "Confirmed",
      authority: "Likely Decision Maker",
      need: "Strong",
      timeline: "< 1 Month",
      score: 92,
    },
  },
  {
    id: "l_007",
    firstName: "Nadia",
    lastName: "Hameed",
    email: "nadia@urbankraft.me",
    phone: "+966 55 234 8765",
    whatsapp: "+966 55 234 8765",
    companyName: "Urban Kraft",
    jobTitle: "Founder",
    country: "Saudi Arabia",
    city: "Riyadh",
    source: "Instagram",
    status: "New",
    score: 58,
    ownerId: "u_4",
    ownerName: "Zain Malik",
    expectedValue: 6400,
    currency: "USD",
    budget: "Unclear",
    interest: "Brand storefront",
    tags: ["D2C"],
    createdAt: iso(3, "11:30"),
    updatedAt: iso(3, "11:30"),
    lastActivityAt: iso(1, "08:55"),
    nextFollowUpAt: undefined,
    qualification: {
      budget: "Unclear",
      authority: "Likely Decision Maker",
      need: "Weak",
      timeline: "6+ Months",
      score: 30,
    },
  },
  {
    id: "l_008",
    firstName: "Bilal",
    lastName: "Aziz",
    email: "bilal@finedge.io",
    phone: "+92 333 8899001",
    whatsapp: "+92 333 8899001",
    companyName: "FinEdge",
    jobTitle: "Finance Manager",
    country: "Pakistan",
    city: "Islamabad",
    source: "Website",
    status: "Unqualified",
    score: 44,
    ownerId: "u_2",
    ownerName: "Ali Khan",
    expectedValue: 3000,
    currency: "USD",
    budget: "Unclear",
    interest: "Reporting dashboards",
    tags: ["Fintech"],
    createdAt: iso(16, "10:00"),
    updatedAt: iso(10, "14:15"),
    lastActivityAt: iso(10, "14:15"),
    nextFollowUpAt: undefined,
    qualification: {
      budget: "Unclear",
      authority: "Influencer",
      need: "Weak",
      timeline: "6+ Months",
      score: 22,
    },
  },
  {
    id: "l_009",
    firstName: "Hina",
    lastName: "Shah",
    email: "hina@lotusdigital.ae",
    phone: "+971 55 981 2340",
    whatsapp: "+971 55 981 2340",
    companyName: "Lotus Digital",
    jobTitle: "Head of Growth",
    country: "United Arab Emirates",
    city: "Abu Dhabi",
    source: "Referral",
    status: "Proposal",
    score: 90,
    ownerId: "u_3",
    ownerName: "Sara Ahmed",
    expectedValue: 28000,
    currency: "USD",
    budget: "Confirmed",
    interest: "Lead management + AI assistant",
    tags: ["Agency", "Growth"],
    createdAt: iso(18, "13:10"),
    updatedAt: iso(0, "09:05"),
    lastActivityAt: iso(0, "09:05"),
    nextFollowUpAt: iso(3, "14:00"),
    qualification: {
      budget: "Confirmed",
      authority: "Likely Decision Maker",
      need: "Strong",
      timeline: "1–2 Months",
      score: 88,
    },
  },
  {
    id: "l_010",
    firstName: "Imran",
    lastName: "Qureshi",
    email: "imran@atlaslogistics.com",
    phone: "+92 300 5550190",
    whatsapp: "+92 300 5550190",
    companyName: "Atlas Logistics",
    jobTitle: "Supply Chain Director",
    country: "Pakistan",
    city: "Karachi",
    source: "LinkedIn",
    status: "Contacted",
    score: 73,
    ownerId: "u_5",
    ownerName: "Ayesha Siddiqui",
    expectedValue: 15000,
    currency: "USD",
    budget: "Estimated",
    interest: "Route optimization",
    tags: ["Logistics", "Enterprise"],
    createdAt: iso(7, "15:00"),
    updatedAt: iso(2, "11:50"),
    lastActivityAt: iso(2, "11:50"),
    nextFollowUpAt: iso(7, "10:30"),
    qualification: {
      budget: "Estimated",
      authority: "Likely Decision Maker",
      need: "Moderate",
      timeline: "This Quarter",
      score: 58,
    },
  },
  {
    id: "l_011",
    firstName: "Zoya",
    lastName: "Tariq",
    email: "zoya@mintecommerce.com",
    phone: "+971 2 656 7890",
    whatsapp: "+971 2 656 7890",
    companyName: "Mint E-commerce",
    jobTitle: "GM",
    country: "United Arab Emirates",
    city: "Dubai",
    source: "Email",
    status: "New",
    score: 66,
    ownerId: "u_1",
    ownerName: "Hussain Ali",
    expectedValue: 11000,
    currency: "USD",
    budget: "Unclear",
    interest: "Subscription billing",
    tags: ["D2C", "Retail"],
    createdAt: iso(2, "09:25"),
    updatedAt: iso(2, "09:25"),
    lastActivityAt: iso(0, "10:02"),
    nextFollowUpAt: iso(9, "11:00"),
    qualification: {
      budget: "Unclear",
      authority: "Influencer",
      need: "Moderate",
      timeline: "This Quarter",
      score: 45,
    },
  },
];

const leadActivities: Record<string, LeadActivity[]> = {
  l_001: [
    { id: "a_1", type: "created", title: "Lead created from LinkedIn", detail: "Inbound via LinkedIn campaign 'Enterprise Automation'", at: iso(14, "10:15"), actor: "Hussain Ali" },
    { id: "a_2", type: "email-sent", title: "Intro email sent", detail: "\"Technology partnership\" sent to ahmed.khan@technosolutions.com", at: iso(13, "10:30"), actor: "Hussain Ali" },
    { id: "a_3", type: "email-opened", title: "Intro email opened (2x)", detail: "Opened from Karachi, Pakistan on mobile", at: iso(12, "09:05"), actor: "Ahmed Khan" },
    { id: "a_4", type: "whatsapp", title: "WhatsApp: pricing asked", detail: "Asked about starter vs growth plan pricing", at: iso(10, "16:45"), actor: "Ahmed Khan" },
    { id: "a_5", type: "call", title: "Discovery call completed", detail: "22 min call covering automation pain points", at: iso(7, "11:00"), actor: "Hussain Ali" },
    { id: "a_6", type: "status-change", title: "Status moved to Qualified", detail: "BANT confirmed during discovery call", at: iso(7, "11:35"), actor: "Hussain Ali" },
    { id: "a_7", type: "score-change", title: "Lead score updated 78 → 92", detail: "High budget fit and decision-maker engagement", at: iso(6, "09:20"), actor: "AI Assistant" },
    { id: "a_8", type: "meeting", title: "Discovery call scheduled", detail: "Product walkthrough with technical team", at: iso(5, "14:00"), actor: "Hussain Ali" },
    { id: "a_9", type: "proposal", title: "Proposal draft started", detail: "Starter + growth plan, 12-month contract", at: iso(2, "12:40"), actor: "Hussain Ali" },
  ],
  l_002: [
    { id: "a_10", type: "created", title: "Lead created from Website form", detail: "Downloaded 'Marketing performance checklist'", at: iso(9, "14:30"), actor: "Ali Khan" },
    { id: "a_11", type: "email-sent", title: "Follow-up email sent", detail: "Booked a 15-min intro call", at: iso(4, "09:20"), actor: "Ali Khan" },
  ],
  l_003: [
    { id: "a_12", type: "created", title: "Lead created from Referral", detail: "Referred by Amna Yusuf (Lotus Digital)", at: iso(4, "11:00"), actor: "Sara Ahmed" },
    { id: "a_13", type: "email-opened", title: "Email opened", detail: "Opened pricing overview email", at: iso(2, "15:45"), actor: "John Smith" },
  ],
  l_004: [
    { id: "a_14", type: "created", title: "Lead created from WhatsApp", detail: "Clicked 'Start' on WhatsApp campaign", at: iso(11, "16:20"), actor: "Zain Malik" },
    { id: "a_15", type: "whatsapp", title: "Sent inventory checklist", detail: "Shared inventory automation checklist", at: iso(2, "10:10"), actor: "Zain Malik" },
  ],
  l_005: [
    { id: "a_16", type: "created", title: "Lead created from Cold Call", detail: "Outbound call to field team tracking", at: iso(5, "12:05"), actor: "Ayesha Siddiqui" },
  ],
  l_006: [
    { id: "a_17", type: "created", title: "Lead created from Facebook ad", detail: "Clicked 'Omnichannel commerce' demo ad", at: iso(20, "09:40"), actor: "Hussain Ali" },
    { id: "a_18", type: "email-replied", title: "Replied to proposal email", detail: "Confirmed budget approval in reply", at: iso(4, "16:10"), actor: "Omar Farooq" },
    { id: "a_19", type: "status-change", title: "Status moved to Proposal", detail: "Proposal sent with signed intent letter", at: iso(3, "11:00"), actor: "Hussain Ali" },
    { id: "a_20", type: "meeting", title: "Proposal walkthrough completed", detail: "Attended by VP Commerce + CFO", at: iso(1, "18:00"), actor: "Hussain Ali" },
  ],
  l_007: [
    { id: "a_21", type: "created", title: "Lead created from Instagram", detail: "Engaged with brand storefront story", at: iso(3, "11:30"), actor: "Zain Malik" },
  ],
  l_008: [
    { id: "a_22", type: "created", title: "Lead created from Website", detail: "Requested reporting dashboards demo", at: iso(16, "10:00"), actor: "Ali Khan" },
    { id: "a_23", type: "email-sent", title: "Qualification email sent", detail: "Budget and timeline check-in", at: iso(10, "14:15"), actor: "Ali Khan" },
  ],
  l_009: [
    { id: "a_24", type: "created", title: "Lead created from Referral", detail: "Referred by John Smith (Nova Systems)", at: iso(18, "13:10"), actor: "Sara Ahmed" },
    { id: "a_25", type: "email-replied", title: "Replied to intro email", detail: "Attached their current lead pipeline export", at: iso(8, "10:40"), actor: "Hina Shah" },
    { id: "a_26", type: "status-change", title: "Status moved to Proposal", detail: "Custom implementation proposal sent", at: iso(5, "15:20"), actor: "Sara Ahmed" },
    { id: "a_27", type: "task-completed", title: "Task completed: share security whitepaper", detail: "Security whitepaper shared via email", at: iso(2, "09:30"), actor: "Sara Ahmed" },
  ],
  l_010: [
    { id: "a_28", type: "created", title: "Lead created from LinkedIn", detail: "Engaged with route optimization post", at: iso(7, "15:00"), actor: "Ayesha Siddiqui" },
    { id: "a_29", type: "call", title: "Intro call completed", detail: "18 min call on fleet size and routes", at: iso(3, "11:50"), actor: "Ayesha Siddiqui" },
  ],
  l_011: [
    { id: "a_30", type: "created", title: "Lead created from Email campaign", detail: "Opened 'Subscription billing' newsletter", at: iso(2, "09:25"), actor: "Hussain Ali" },
  ],
};

const leadNotes: Record<string, LeadNote[]> = {
  l_001: [
    { id: "n_1", body: "Techno Solutions runs 40+ internal apps. They are evaluating automation for approvals and reporting. Procurement department needs to be involved before purchase.", author: "Hussain Ali", createdAt: iso(6, "13:00"), pinned: true },
    { id: "n_2", body: "Prefers a single annual contract with a dedicated onboarding lead. Interested in the growth plan add-ons.", author: "Hussain Ali", createdAt: iso(3, "17:20") },
    { id: "n_3", body: "Sent the technical whitepaper and integration docs after the discovery call.", author: "Sara Ahmed", createdAt: iso(1, "09:15") },
  ],
  l_006: [
    { id: "n_4", body: "Budget already approved by the board for Q4. They want a 3-year roadmap commitment.", author: "Hussain Ali", createdAt: iso(4, "12:00"), pinned: true },
  ],
  l_009: [
    { id: "n_5", body: "Expects white-label capability and API access for their agency accounts.", author: "Sara Ahmed", createdAt: iso(3, "16:00") },
  ],
  l_002: [{ id: "n_6", body: "Team of 12, currently using spreadsheets for tracking. Pain point is visibility across channels.", author: "Ali Khan", createdAt: iso(2, "15:00") }],
  l_003: [{ id: "n_7", body: "Cloud migration planned for Q1 next year. This is a timing conversation more than budget.", author: "Sara Ahmed", createdAt: iso(1, "10:30") }],
};

const leadTasks: Record<string, LeadTask[]> = {
  l_001: [
    { id: "t_1", title: "Send formal proposal", due: iso(2, "11:00"), priority: "high", status: "Open", owner: "Hussain Ali" },
    { id: "t_2", title: "Share pricing page", due: iso(3, "16:00"), priority: "medium", status: "Open", owner: "Hussain Ali" },
    { id: "t_3", title: "Follow-up call", due: iso(7, "10:00"), priority: "low", status: "Open", owner: "Sara Ahmed" },
    { id: "t_4", title: "Add to newsletter campaign", due: iso(1, "09:00"), priority: "low", status: "Done", owner: "Ali Khan" },
  ],
  l_002: [
    { id: "t_5", title: "Book discovery call", due: iso(4, "11:00"), priority: "high", status: "Open", owner: "Ali Khan" },
  ],
  l_003: [
    { id: "t_6", title: "Send cloud migration overview", due: iso(3, "12:00"), priority: "medium", status: "Open", owner: "Sara Ahmed" },
  ],
  l_006: [
    { id: "t_7", title: "Prepare board presentation", due: iso(1, "14:00"), priority: "high", status: "Open", owner: "Hussain Ali" },
    { id: "t_8", title: "Send contract draft", due: iso(2, "10:00"), priority: "high", status: "Open", owner: "Hussain Ali" },
  ],
  l_009: [
    { id: "t_9", title: "Share security whitepaper", due: iso(0, "09:00"), priority: "high", status: "Done", owner: "Sara Ahmed" },
    { id: "t_10", title: "Finalize timeline section", due: iso(4, "17:00"), priority: "medium", status: "Open", owner: "Sara Ahmed" },
  ],
  l_004: [{ id: "t_11", title: "Send inventory checklist", due: iso(2, "12:00"), priority: "medium", status: "Done", owner: "Zain Malik" }],
  l_005: [{ id: "t_12", title: "Qualification call", due: iso(6, "09:30"), priority: "medium", status: "Open", owner: "Ayesha Siddiqui" }],
  l_010: [{ id: "t_13", title: "Send route optimization demo video", due: iso(7, "10:30"), priority: "medium", status: "Open", owner: "Ayesha Siddiqui" }],
};

const leadMeetings: Record<string, LeadMeeting[]> = {
  l_001: [
    { id: "m_1", title: "Discovery call", date: iso(7, "11:00"), time: "11:00 AM", duration: "30 min", kind: "past" },
    { id: "m_2", title: "Product walkthrough", date: iso(2, "14:00"), time: "2:00 PM", duration: "45 min", kind: "upcoming", join: "https://meet.relvo.io/ahmed-khan" },
    { id: "m_3", title: "Proposal walkthrough", date: iso(5, "15:00"), time: "3:00 PM", duration: "30 min", kind: "upcoming", join: "https://meet.relvo.io/techno-proposal" },
  ],
  l_006: [
    { id: "m_4", title: "Proposal walkthrough", date: iso(1, "18:00"), time: "6:00 PM", duration: "40 min", kind: "past" },
    { id: "m_5", title: "Contract review", date: iso(3, "13:00"), time: "1:00 PM", duration: "30 min", kind: "upcoming", join: "https://meet.relvo.io/skyline" },
  ],
  l_009: [
    { id: "m_6", title: "Intro call", date: iso(8, "10:30"), time: "10:30 AM", duration: "20 min", kind: "past" },
    { id: "m_7", title: "Technical deep-dive", date: iso(4, "16:00"), time: "4:00 PM", duration: "45 min", kind: "upcoming", join: "https://meet.relvo.io/lotus-tech" },
  ],
  l_002: [{ id: "m_8", title: "Intro call", date: iso(5, "14:30"), time: "2:30 PM", duration: "15 min", kind: "upcoming", join: "https://meet.relvo.io/brightwave" }],
  l_010: [{ id: "m_9", title: "Intro call", date: iso(3, "11:50"), time: "11:50 AM", duration: "18 min", kind: "past" }],
};

const leadEmails: Record<string, LeadEmail[]> = {
  l_001: [
    { id: "e_1", subject: "Technology partnership — Techno Solutions", direction: "out", from: "hussain.ali@relvo.io", to: "ahmed.khan@technosolutions.com", date: iso(13, "10:30"), body: "Hi Ahmed,\n\nGreat connecting on LinkedIn. Based on your interest in automating approvals and reporting pipelines, I'd love to walk you through the Relvo enterprise automation suite.\n\nWould Tuesday or Wednesday next week work for a 30-minute call?\n\nBest,\nHussain" },
    { id: "e_2", subject: "Re: Technology partnership", direction: "in", from: "ahmed.khan@technosolutions.com", to: "hussain.ali@relvo.io", date: iso(12, "14:05"), opened: true, body: "Hi Hussain,\n\nThanks for reaching out. Wednesday works well. Could you also share pricing for the starter and growth plans?\n\nRegards,\nAhmed" },
    { id: "e_3", subject: "Starter vs Growth — pricing overview", direction: "out", from: "hussain.ali@relvo.io", to: "ahmed.khan@technosolutions.com", date: iso(11, "11:00"), body: "Hi Ahmed,\n\nSharing the pricing overview as requested. Growth plan includes the full automation suite and priority onboarding.\n\nLooking forward to Wednesday!\n\nBest,\nHussain" },
  ],
  l_009: [
    { id: "e_4", subject: "Intro email", direction: "out", from: "sara.ahmed@relvo.io", to: "hina@lotusdigital.ae", date: iso(17, "10:00"), body: "Hi Hina,\n\nJohn mentioned your team is scaling lead management across agency accounts..." },
    { id: "e_5", subject: "Re: Intro email", direction: "in", from: "hina@lotusdigital.ae", to: "sara.ahmed@relvo.io", date: iso(8, "10:40"), opened: true, body: "Hi Sara,\n\nWe'd need white-label capability and API access. Attaching our current pipeline export for reference." },
  ],
  l_006: [
    { id: "e_6", subject: "Proposal — Omnichannel commerce", direction: "out", from: "hussain.ali@relvo.io", to: "omar@skylineretail.com", date: iso(3, "11:00"), body: "Hi Omar,\n\nAttached is the proposal for the unified omnichannel commerce rollout..." },
  ],
  l_002: [{ id: "e_7", subject: "Marketing check-in", direction: "out", from: "ali.khan@relvo.io", to: "sarah.malik@brightwave.com", date: iso(4, "09:20"), body: "Hi Sarah,\n\nFollowing up on the download — want to see how the analytics suite would fit BrightWave?" }],
  l_003: [{ id: "e_8", subject: "Cloud migration support", direction: "out", from: "sara.ahmed@relvo.io", to: "john.smith@novasystems.io", date: iso(2, "12:00"), body: "Hi John,\n\nSharing how we support cloud migration projects end-to-end..." }],
};

const leadWhatsApp: Record<string, LeadWhatsAppMessage[]> = {
  l_001: [
    { id: "w_1", from: "customer", text: "Hi Hussain! We looked at your website after you reached out. Can you share the growth plan pricing?", time: iso(10, "16:40") },
    { id: "w_2", from: "agent", text: "Hi Ahmed! Sure — I just emailed the pricing overview covering Starter vs Growth. Happy to walk through it on a call too.", time: iso(10, "16:45") },
    { id: "w_3", from: "customer", text: "Perfect, will review by tonight. Our team liked the approval workflow demo.", time: iso(10, "17:05") },
    { id: "w_4", from: "agent", text: "Great to hear! I can set up a walkthrough with your technical team this week.", time: iso(10, "17:10") },
    { id: "w_5", from: "customer", text: "Let's do Thursday 2 PM if that works.", time: iso(6, "09:00") },
  ],
  l_004: [
    { id: "w_6", from: "customer", text: "Salam Zain! Does the inventory automation connect with our existing ERP?", time: iso(3, "10:00") },
    { id: "w_7", from: "agent", text: "Walaikum salam Fatima! Yes, we have native connectors — I've shared the integration checklist.", time: iso(2, "10:10") },
  ],
  l_007: [
    { id: "w_8", from: "customer", text: "Saw the brand storefront on Instagram — how long does setup take?", time: iso(1, "08:55") },
  ],
  l_010: [{ id: "w_9", from: "agent", text: "Hi Imran! Sent over the route optimization demo video for Atlas Logistics.", time: iso(2, "11:50") }],
};

const leadFiles: Record<string, LeadFile[]> = {
  l_001: [
    { id: "f_1", name: "discovery-call-notes.pdf", type: "pdf", size: "220 KB", uploadedAt: iso(7, "11:40") },
    { id: "f_2", name: "techno-budget-approval.xlsx", type: "xlsx", size: "48 KB", uploadedAt: iso(4, "09:15") },
    { id: "f_3", name: "integration-requirements.docx", type: "docx", size: "310 KB", uploadedAt: iso(1, "09:15") },
  ],
  l_006: [
    { id: "f_4", name: "skyline-q4-board-brief.pdf", type: "pdf", size: "1.2 MB", uploadedAt: iso(4, "12:00") },
  ],
  l_009: [
    { id: "f_5", name: "pipeline-export.xlsx", type: "xlsx", size: "86 KB", uploadedAt: iso(8, "10:40") },
  ],
  l_003: [{ id: "f_6", name: "nova-cloud-architecture.pdf", type: "pdf", size: "940 KB", uploadedAt: iso(2, "12:00") }],
};

export function getLeadById(id: string): LeadRecord | undefined {
  return leadMocks.find((lead) => lead.id === id);
}

export function getLeadActivities(leadId: string): LeadActivity[] {
  return leadActivities[leadId] ?? [];
}

export function getLeadNotes(leadId: string): LeadNote[] {
  return leadNotes[leadId] ?? [];
}

export function getLeadTasks(leadId: string): LeadTask[] {
  return leadTasks[leadId] ?? [];
}

export function getLeadMeetings(leadId: string): LeadMeeting[] {
  return leadMeetings[leadId] ?? [];
}

export function getLeadEmails(leadId: string): LeadEmail[] {
  return leadEmails[leadId] ?? [];
}

export function getLeadWhatsApp(leadId: string): LeadWhatsAppMessage[] {
  return leadWhatsApp[leadId] ?? [];
}

export function getLeadFiles(leadId: string): LeadFile[] {
  return leadFiles[leadId] ?? [];
}

export function leadSummaryStats() {
  const total = leadMocks.length;
  const newLeads = leadMocks.filter((lead) => lead.status === "New").length;
  const qualified = leadMocks.filter((lead) => lead.status === "Qualified").length;
  const hot = leadMocks.filter((lead) => lead.score >= 80).length;
  const conversionRate = Math.round((qualified / total) * 100);
  return { total, newLeads, qualified, hot, conversionRate };
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