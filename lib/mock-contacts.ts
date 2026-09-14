import type {
  ContactActivity,
  ContactRecord,
  CrmDeal,
  Invoice,
  LeadEmail,
  LeadFile,
  LeadMeeting,
  LeadNote,
  LeadTask,
  LeadWhatsAppMessage,
  SupportTicket,
} from "@/lib/types";
import { leadOwners } from "@/lib/mock-leads";

function iso(daysBack: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const contactMocks: ContactRecord[] = [
  {
    id: "c_001",
    firstName: "Ahmed",
    lastName: "Khan",
    jobTitle: "Operations Manager",
    email: "ahmed@techno.com",
    phone: "+92 300 1234567",
    whatsapp: "+92 300 1234567",
    companyId: "co_01",
    companyName: "Techno Solutions",
    lifecycleStage: "Customer",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Website",
    country: "Pakistan",
    city: "Karachi",
    address: "Clifton, Karachi",
    tags: ["Enterprise", "CRM", "High Value"],
    preferredChannel: "WhatsApp",
    preferredLanguage: "English",
    birthday: "1989-03-15",
    createdAt: iso(4, "09:15"),
    updatedAt: iso(0, "08:00"),
    lastActivityAt: iso(0, "07:30"),
    nextActivityAt: iso(0, "16:00"),
  },
  {
    id: "c_002",
    firstName: "Sarah",
    lastName: "Malik",
    jobTitle: "Marketing Manager",
    email: "sarah@brightwave.com",
    phone: "+92 321 1234567",
    whatsapp: "+92 321 1234567",
    companyId: "co_02",
    companyName: "BrightWave",
    lifecycleStage: "Opportunity",
    ownerId: leadOwners[1].id,
    ownerName: leadOwners[1].name,
    source: "LinkedIn",
    country: "Pakistan",
    city: "Lahore",
    address: "Gulberg, Lahore",
    tags: ["Marketing", "Analytics"],
    preferredChannel: "Email",
    preferredLanguage: "English",
    createdAt: iso(20, "11:00"),
    updatedAt: iso(1, "11:00"),
    lastActivityAt: iso(0, "05:00"),
    nextActivityAt: iso(1, "10:00"),
  },
  {
    id: "c_003",
    firstName: "John",
    lastName: "Smith",
    jobTitle: "IT Director",
    email: "john@nova.com",
    phone: "+1 555 291 1000",
    whatsapp: "+1 555 291 1000",
    companyId: "co_03",
    companyName: "Nova Systems",
    lifecycleStage: "Customer",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Referral",
    country: "United States",
    city: "Austin",
    address: "600 Congress Ave, Austin",
    tags: ["Cloud", "Enterprise"],
    preferredChannel: "Email",
    preferredLanguage: "English",
    createdAt: iso(60, "10:00"),
    updatedAt: iso(1, "16:00"),
    lastActivityAt: iso(1, "16:00"),
    nextActivityAt: iso(2, "14:00"),
  },
  {
    id: "c_004",
    firstName: "Fatima",
    lastName: "Noor",
    jobTitle: "Procurement Lead",
    email: "fatima@greentech.com",
    phone: "+92 333 8123456",
    whatsapp: "+92 333 8123456",
    companyId: "co_04",
    companyName: "GreenTech",
    lifecycleStage: "Lead",
    ownerId: leadOwners[2].id,
    ownerName: leadOwners[2].name,
    source: "Website",
    country: "Pakistan",
    city: "Islamabad",
    address: "Blue Area, Islamabad",
    tags: ["Inbound", "Solar"],
    preferredChannel: "WhatsApp",
    preferredLanguage: "Urdu",
    createdAt: iso(3, "14:30"),
    updatedAt: iso(2, "10:00"),
    lastActivityAt: iso(2, "10:00"),
  },
  {
    id: "c_005",
    firstName: "Ali",
    lastName: "Raza",
    jobTitle: "Operations Head",
    email: "ali.raza@buildpro.com",
    phone: "+971 4 221 9000",
    whatsapp: "+971 4 221 9000",
    companyId: "co_05",
    companyName: "BuildPro",
    lifecycleStage: "Subscriber",
    ownerId: leadOwners[3].id,
    ownerName: leadOwners[3].name,
    source: "WhatsApp",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "Business Bay, Dubai",
    tags: ["Field Ops", "Subscriber"],
    preferredChannel: "WhatsApp",
    preferredLanguage: "English",
    createdAt: iso(25, "16:20"),
    updatedAt: iso(6, "09:30"),
    lastActivityAt: iso(6, "09:30"),
  },
  {
    id: "c_006",
    firstName: "Sara",
    lastName: "Ali",
    jobTitle: "Finance Manager",
    email: "sara.ali@techno.com",
    phone: "+92 300 7654321",
    whatsapp: "+92 300 7654321",
    companyId: "co_01",
    companyName: "Techno Solutions",
    lifecycleStage: "Customer",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Referral",
    country: "Pakistan",
    city: "Karachi",
    address: "Clifton, Karachi",
    tags: ["Finance", "High Value"],
    preferredChannel: "Email",
    preferredLanguage: "English",
    birthday: "1991-11-02",
    createdAt: iso(50, "10:00"),
    updatedAt: iso(3, "14:00"),
    lastActivityAt: iso(3, "14:00"),
  },
  {
    id: "c_007",
    firstName: "Usman",
    lastName: "Shah",
    jobTitle: "IT Manager",
    email: "usman.shah@techno.com",
    phone: "+92 321 5550140",
    whatsapp: "+92 321 5550140",
    companyId: "co_01",
    companyName: "Techno Solutions",
    lifecycleStage: "Customer",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Email",
    country: "Pakistan",
    city: "Karachi",
    address: "Clifton, Karachi",
    tags: ["IT", "Technical"],
    preferredChannel: "WhatsApp",
    preferredLanguage: "English",
    createdAt: iso(45, "12:00"),
    updatedAt: iso(0, "11:42"),
    lastActivityAt: iso(0, "11:42"),
  },
  {
    id: "c_008",
    firstName: "Omar",
    lastName: "Farooq",
    jobTitle: "VP Commerce",
    email: "omar@skyline.com",
    phone: "+971 4 555 0188",
    whatsapp: "+971 4 555 0188",
    companyId: "co_06",
    companyName: "Skyline Retail",
    lifecycleStage: "Opportunity",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Facebook",
    country: "Saudi Arabia",
    city: "Riyadh",
    address: "King Fahd Road, Riyadh",
    tags: ["Commerce", "High Value"],
    preferredChannel: "Email",
    preferredLanguage: "Arabic",
    createdAt: iso(18, "09:40"),
    updatedAt: iso(1, "18:00"),
    lastActivityAt: iso(1, "18:00"),
    nextActivityAt: iso(3, "11:00"),
  },
  {
    id: "c_009",
    firstName: "Hina",
    lastName: "Shah",
    jobTitle: "Agency Director",
    email: "hina@lotusdigital.ae",
    phone: "+971 2 555 0148",
    whatsapp: "+971 2 555 0148",
    companyId: "co_07",
    companyName: "Lotus Digital",
    lifecycleStage: "Customer",
    ownerId: leadOwners[2].id,
    ownerName: leadOwners[2].name,
    source: "Referral",
    country: "United Arab Emirates",
    city: "Abu Dhabi",
    address: "Al Reem Island, Abu Dhabi",
    tags: ["Agency", "White-label"],
    preferredChannel: "Email",
    preferredLanguage: "English",
    createdAt: iso(35, "13:10"),
    updatedAt: iso(2, "09:30"),
    lastActivityAt: iso(2, "09:30"),
  },
  {
    id: "c_010",
    firstName: "Imran",
    lastName: "Qureshi",
    jobTitle: "Chief Operating Officer",
    email: "imran@atlaslogistics.pk",
    phone: "+92 42 3577 6600",
    whatsapp: "+92 42 3577 6600",
    companyId: "co_08",
    companyName: "Atlas Logistics",
    lifecycleStage: "Customer",
    ownerId: leadOwners[4].id,
    ownerName: leadOwners[4].name,
    source: "Cold Call",
    country: "Pakistan",
    city: "Lahore",
    address: "Ferozepur Road, Lahore",
    tags: ["Logistics"],
    preferredChannel: "Phone",
    preferredLanguage: "Urdu",
    createdAt: iso(30, "15:00"),
    updatedAt: iso(2, "11:50"),
    lastActivityAt: iso(2, "11:50"),
  },
  {
    id: "c_011",
    firstName: "Zoya",
    lastName: "Tariq",
    jobTitle: "Head of CX",
    email: "zoya@mint-ecommerce.com",
    phone: "+971 4 333 0123",
    whatsapp: "+971 4 333 0123",
    companyId: "co_09",
    companyName: "Mint E-commerce",
    lifecycleStage: "Opportunity",
    ownerId: leadOwners[3].id,
    ownerName: leadOwners[3].name,
    source: "Email",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "Dubai Internet City",
    tags: ["Commerce", "Billing"],
    preferredChannel: "Email",
    preferredLanguage: "English",
    createdAt: iso(12, "09:25"),
    updatedAt: iso(0, "08:00"),
    lastActivityAt: iso(0, "08:00"),
  },
  {
    id: "c_012",
    firstName: "Nadia",
    lastName: "Hameed",
    jobTitle: "Brand Manager",
    email: "nadia@urbankraft.co",
    phone: "+92 51 555 0134",
    whatsapp: "+92 51 555 0134",
    companyId: "co_10",
    companyName: "Urban Kraft",
    lifecycleStage: "Customer",
    ownerId: leadOwners[1].id,
    ownerName: leadOwners[1].name,
    source: "Instagram",
    country: "Pakistan",
    city: "Sialkot",
    address: "Export Zone, Sialkot",
    tags: ["Wholesale", "Storefront"],
    preferredChannel: "WhatsApp",
    preferredLanguage: "Urdu",
    createdAt: iso(55, "11:30"),
    updatedAt: iso(1, "08:55"),
    lastActivityAt: iso(1, "08:55"),
  },
  {
    id: "c_013",
    firstName: "Bilal",
    lastName: "Aziz",
    jobTitle: "Chief Financial Officer",
    email: "bilal@finedge.io",
    phone: "+44 20 4555 0199",
    whatsapp: "+44 20 4555 0199",
    companyId: "co_11",
    companyName: "FinEdge",
    lifecycleStage: "Lead",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "LinkedIn",
    country: "United Kingdom",
    city: "London",
    address: "Shoreditch High Street, London",
    tags: ["Finance", "Compliance"],
    preferredChannel: "Email",
    preferredLanguage: "English",
    createdAt: iso(9, "10:05"),
    updatedAt: iso(1, "09:00"),
    lastActivityAt: iso(1, "09:00"),
  },
];

export const contactActivities: Record<string, ContactActivity[]> = {
  c_001: [
    { id: "cta_1", type: "whatsapp", title: "WhatsApp message received", detail: "Usman asked about API access for approvals.", at: iso(0, "11:42"), actor: "Usman Shah" },
    { id: "cta_2", type: "quote", title: "Quote viewed", detail: "CRM implementation quote #QT-102 opened (2x).", at: iso(0, "10:15"), actor: "Ahmed Khan" },
    { id: "cta_3", type: "call", title: "Follow-up call completed", detail: "22-minute call covering implementation timeline.", at: iso(1, "16:00"), actor: "Hussain Ali" },
    { id: "cta_4", type: "payment", title: "Invoice paid", detail: "INV-0042 settled via wire transfer.", at: iso(2, "12:10"), actor: "Sara Ali" },
    { id: "cta_5", type: "deal-stage-change", title: "Deal moved to Proposal stage", detail: "CRM Implementation advanced from Qualified.", at: iso(10, "11:35"), actor: "Hussain Ali" },
    { id: "cta_6", type: "email", title: "Starter vs Growth pricing sent", detail: "Email opened twice on mobile.", at: iso(11, "11:00"), actor: "Hussain Ali" },
    { id: "cta_7", type: "meeting", title: "Product walkthrough attended", detail: "Technical team joined the walkthrough.", at: iso(15, "14:00"), actor: "Ahmed Khan" },
    { id: "cta_8", type: "created", title: "Contact created", detail: "Added from the website lead capture flow.", at: iso(4, "09:15"), actor: "Hussain Ali" },
  ],
  c_002: [
    { id: "cta_9", type: "email", title: "Email opened", detail: "Analytics suite overview.", at: iso(0, "05:00"), actor: "Sarah Malik" },
    { id: "cta_10", type: "created", title: "Contact created", detail: "Added from LinkedIn campaign.", at: iso(20, "11:00"), actor: "Ali Khan" },
  ],
  c_003: [
    { id: "cta_11", type: "call", title: "Intro call completed", detail: "18-minute call on migration scope.", at: iso(3, "11:50"), actor: "Ayesha Siddiqui" },
    { id: "cta_12", type: "deal-stage-change", title: "Deal moved to Proposal", detail: "Cloud migration proposal sent.", at: iso(4, "15:20"), actor: "Sara Ahmed" },
    { id: "cta_13", type: "created", title: "Contact created", detail: "Referred by Amna Yusuf.", at: iso(60, "10:00"), actor: "Sara Ahmed" },
  ],
};

export const contactDeals: Record<string, CrmDeal[]> = {
  c_001: [
    {
      id: "cdeal_1",
      name: "CRM Implementation",
      value: 24000,
      stage: "proposal",
      probability: 75,
      expectedClose: iso(-14, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Open",
    },
    {
      id: "cdeal_2",
      name: "Automation Project",
      value: 12000,
      stage: "qualified",
      probability: 50,
      expectedClose: iso(-28, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Open",
    },
    {
      id: "cdeal_3",
      name: "ERP Integration",
      value: 18000,
      stage: "won",
      probability: 100,
      expectedClose: iso(-60, "12:00"),
      ownerId: leadOwners[2].id,
      ownerName: leadOwners[2].name,
      status: "Won",
    },
    {
      id: "cdeal_4",
      name: "Onboarding Retainer",
      value: 6000,
      stage: "won",
      probability: 100,
      expectedClose: iso(-90, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Won",
    },
    {
      id: "cdeal_5",
      name: "Reporting Add-on",
      value: 4000,
      stage: "won",
      probability: 100,
      expectedClose: iso(-120, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Won",
    },
  ],
  c_003: [
    {
      id: "cdeal_6",
      name: "Cloud Migration Support",
      value: 36000,
      stage: "proposal",
      probability: 70,
      expectedClose: iso(-21, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Open",
    },
  ],
  c_006: [
    {
      id: "cdeal_7",
      name: "ERP Integration",
      value: 18000,
      stage: "won",
      probability: 100,
      expectedClose: iso(-60, "12:00"),
      ownerId: leadOwners[2].id,
      ownerName: leadOwners[2].name,
      status: "Won",
    },
  ],
  c_008: [
    {
      id: "cdeal_8",
      name: "Omnichannel Commerce Rollout",
      value: 48000,
      stage: "negotiation",
      probability: 80,
      expectedClose: iso(-16, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Open",
    },
  ],
};

export const contactEmails: Record<string, LeadEmail[]> = {
  c_001: [
    { id: "ce_1", subject: "Technology partnership — Techno Solutions", direction: "out", from: "hussain.ali@relvo.io", to: "ahmed@techno.com", date: iso(13, "10:30"), body: "Hi Ahmed,\n\nBased on your interest in automating approvals and reporting, I'd love to walk you through the Relvo enterprise automation suite.\n\nBest,\nHussain" },
    { id: "ce_2", subject: "Re: Technology partnership", direction: "in", from: "ahmed@techno.com", to: "hussain.ali@relvo.io", date: iso(12, "14:05"), opened: true, body: "Hi Hussain,\n\nThanks for reaching out. Could you share pricing for the starter and growth plans?\n\nRegards,\nAhmed" },
    { id: "ce_3", subject: "Starter vs Growth — pricing overview", direction: "out", from: "hussain.ali@relvo.io", to: "ahmed@techno.com", date: iso(11, "11:00"), body: "Hi Ahmed,\n\nSharing the pricing overview as requested. Growth plan includes the full automation suite.\n\nBest,\nHussain" },
    { id: "ce_4", subject: "Implementation timeline confirmed", direction: "out", from: "hussain.ali@relvo.io", to: "ahmed@techno.com", date: iso(0, "09:00"), body: "Hi Ahmed,\n\nConfirming the rollout timeline and onboarding steps for the CRM implementation.\n\nBest,\nHussain" },
  ],
  c_002: [
    { id: "ce_5", subject: "Marketing check-in", direction: "out", from: "ali.khan@relvo.io", to: "sarah@brightwave.com", date: iso(4, "09:20"), body: "Hi Sarah,\n\nWant to see how the analytics suite would fit BrightWave?" },
  ],
  c_003: [
    { id: "ce_6", subject: "Cloud migration support", direction: "out", from: "sara.ahmed@relvo.io", to: "john@nova.com", date: iso(2, "12:00"), body: "Hi John,\n\nSharing how we support cloud migration projects end-to-end..." },
  ],
};

export const contactWhatsApp: Record<string, LeadWhatsAppMessage[]> = {
  c_001: [
    { id: "cw_1", from: "customer", text: "Hi Hussain! Can you share the growth plan pricing?", time: iso(10, "16:40") },
    { id: "cw_2", from: "agent", text: "Hi Ahmed! Sure — I just emailed the pricing overview covering Starter vs Growth.", time: iso(10, "16:45") },
    { id: "cw_3", from: "customer", text: "Perfect, will review by tonight. Our team liked the approval workflow demo.", time: iso(10, "17:05") },
    { id: "cw_4", from: "customer", text: "Usman — our IT manager — wants API access details.", time: iso(0, "11:42") },
  ],
  c_004: [
    { id: "cw_5", from: "customer", text: "Does the inventory automation connect with our existing ERP?", time: iso(3, "10:00") },
  ],
  c_012: [
    { id: "cw_6", from: "customer", text: "Saw the brand storefront — how long does setup take?", time: iso(1, "08:55") },
  ],
};

export const contactMeetings: Record<string, LeadMeeting[]> = {
  c_001: [
    { id: "cm_1", title: "Discovery call", date: iso(7, "11:00"), time: "11:00 AM", duration: "30 min", kind: "past" },
    { id: "cm_2", title: "Product walkthrough", date: iso(2, "14:00"), time: "2:00 PM", duration: "45 min", kind: "past" },
    { id: "cm_3", title: "Proposal walkthrough", date: iso(0, "15:00"), time: "3:00 PM", duration: "30 min", kind: "upcoming", join: "https://meet.relvo.io/techno-proposal" },
  ],
  c_002: [
    { id: "cm_4", title: "Intro call", date: iso(5, "14:30"), time: "2:30 PM", duration: "15 min", kind: "upcoming", join: "https://meet.relvo.io/brightwave" },
  ],
};

export const contactTasks: Record<string, LeadTask[]> = {
  c_001: [
    { id: "ct_1", title: "Send formal proposal", due: iso(2, "11:00"), priority: "high", status: "Open", owner: "Hussain Ali" },
    { id: "ct_2", title: "Follow up on rollout timeline", due: iso(0, "16:00"), priority: "high", status: "Open", owner: "Hussain Ali" },
    { id: "ct_3", title: "Add to newsletter campaign", due: iso(1, "09:00"), priority: "low", status: "Done", owner: "Ali Khan" },
  ],
  c_002: [
    { id: "ct_4", title: "Book discovery call", due: iso(4, "11:00"), priority: "high", status: "Open", owner: "Ali Khan" },
  ],
};

export const contactNotes: Record<string, LeadNote[]> = {
  c_001: [
    { id: "cn_1", body: "Ahmed runs 40+ internal apps and wants approval + reporting automation. Procurement needs to be involved before purchase.", author: "Hussain Ali", createdAt: iso(6, "13:00"), pinned: true },
    { id: "cn_2", body: "Prefers a single annual contract with a dedicated onboarding lead.", author: "Hussain Ali", createdAt: iso(3, "17:20") },
  ],
  c_002: [
    { id: "cn_3", body: "Team of 12, currently using spreadsheets for tracking.", author: "Ali Khan", createdAt: iso(2, "15:00") },
  ],
};

export const contactFiles: Record<string, LeadFile[]> = {
  c_001: [
    { id: "cf_1", name: "discovery-call-notes.pdf", type: "pdf", size: "220 KB", uploadedAt: iso(7, "11:40") },
    { id: "cf_2", name: "techno-budget-approval.xlsx", type: "xlsx", size: "48 KB", uploadedAt: iso(4, "09:15") },
    { id: "cf_3", name: "integration-requirements.docx", type: "docx", size: "310 KB", uploadedAt: iso(1, "09:15") },
  ],
  c_003: [
    { id: "cf_4", name: "nova-cloud-architecture.pdf", type: "pdf", size: "940 KB", uploadedAt: iso(2, "12:00") },
  ],
};

export const contactInvoices: Record<string, Invoice[]> = {
  c_001: [
    { id: "cinv_1", number: "INV-0041", amount: 1500, status: "paid" },
    { id: "cinv_2", number: "INV-0042", amount: 3000, status: "paid" },
    { id: "cinv_3", number: "INV-0043", amount: 4500, status: "overdue" },
  ],
  c_003: [
    { id: "cinv_4", number: "INV-0038", amount: 7200, status: "paid" },
  ],
};

export const contactTickets: Record<string, SupportTicket[]> = {
  c_001: [
    { id: "ctkt_1", subject: "SSO configuration failed", status: "Resolved", priority: "high", createdAt: iso(8, "10:00") },
  ],
  c_003: [
    { id: "ctkt_2", subject: "VPN access for new hire", status: "Closed", priority: "medium", createdAt: iso(12, "09:00") },
  ],
};

export function getContactById(id: string): ContactRecord | undefined {
  return contactMocks.find((contact) => contact.id === id);
}

export function getContactsByCompany(companyId: string): ContactRecord[] {
  return contactMocks.filter((contact) => contact.companyId === companyId);
}

export function getContactActivities(contactId: string): ContactActivity[] {
  return contactActivities[contactId] ?? [];
}

export function getContactDeals(contactId: string): CrmDeal[] {
  return contactDeals[contactId] ?? [];
}

export function getContactEmails(contactId: string): LeadEmail[] {
  return contactEmails[contactId] ?? [];
}

export function getContactWhatsApp(contactId: string): LeadWhatsAppMessage[] {
  return contactWhatsApp[contactId] ?? [];
}

export function getContactMeetings(contactId: string): LeadMeeting[] {
  return contactMeetings[contactId] ?? [];
}

export function getContactTasks(contactId: string): LeadTask[] {
  return contactTasks[contactId] ?? [];
}

export function getContactNotes(contactId: string): LeadNote[] {
  return contactNotes[contactId] ?? [];
}

export function getContactFiles(contactId: string): LeadFile[] {
  return contactFiles[contactId] ?? [];
}

export function getContactInvoices(contactId: string): Invoice[] {
  return contactInvoices[contactId] ?? [];
}

export function getContactTickets(contactId: string): SupportTicket[] {
  return contactTickets[contactId] ?? [];
}