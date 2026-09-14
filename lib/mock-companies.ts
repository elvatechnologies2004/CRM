import type {
  AccountHealth,
  CompanyActivity,
  CompanyContactLink,
  CompanyProject,
  CompanyRecord,
  CrmDeal,
  Invoice,
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

export const companyMocks: CompanyRecord[] = [
  {
    id: "co_01",
    name: "Techno Solutions",
    domain: "technosolutions.com",
    website: "https://technosolutions.com",
    industry: "Software",
    companySize: "51–100",
    employeeCount: 85,
    annualRevenue: "$2.4M",
    currency: "USD",
    phone: "+92 21 3456 7890",
    email: "info@technosolutions.com",
    country: "Pakistan",
    city: "Karachi",
    address: "Gizri Commercial Area, Clifton",
    accountStatus: "Customer",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Website",
    tags: ["Enterprise", "CRM", "High Value"],
    description:
      "Technology services company running 40+ internal applications and evaluating enterprise automation.",
    createdAt: iso(90, "10:00"),
    updatedAt: iso(2, "09:00"),
    lastActivityAt: iso(0, "09:41"),
  },
  {
    id: "co_02",
    name: "BrightWave",
    domain: "brightwave.com",
    website: "https://brightwave.com",
    industry: "Marketing",
    companySize: "11–50",
    employeeCount: 32,
    annualRevenue: "$480K",
    currency: "USD",
    phone: "+92 300 1234567",
    email: "hello@brightwave.com",
    country: "Pakistan",
    city: "Lahore",
    address: "Gulberg III",
    accountStatus: "Opportunity",
    ownerId: leadOwners[1].id,
    ownerName: leadOwners[1].name,
    source: "LinkedIn",
    tags: ["Growth", "Analytics"],
    description: "Full-service digital marketing agency growing a new analytics practice.",
    createdAt: iso(75, "14:20"),
    updatedAt: iso(1, "11:00"),
    lastActivityAt: iso(0, "06:00"),
  },
  {
    id: "co_03",
    name: "Nova Systems",
    domain: "novasystems.io",
    website: "https://novasystems.io",
    industry: "IT Services",
    companySize: "101–250",
    employeeCount: 180,
    annualRevenue: "$8.1M",
    currency: "USD",
    phone: "+1 555 291 1000",
    email: "contact@novasystems.io",
    country: "United States",
    city: "Austin",
    address: "600 Congress Ave",
    accountStatus: "Customer",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Referral",
    tags: ["Cloud", "Enterprise"],
    description: "Managed IT services provider planning a cloud migration project for Q1.",
    createdAt: iso(120, "09:10"),
    updatedAt: iso(1, "16:00"),
    lastActivityAt: iso(1, "16:00"),
  },
  {
    id: "co_04",
    name: "GreenTech",
    domain: "greentech.energy",
    website: "https://greentech.energy",
    industry: "Renewable Energy",
    companySize: "11–50",
    employeeCount: 24,
    annualRevenue: "$1.1M",
    currency: "USD",
    phone: "+92 333 8123456",
    email: "info@greentech.energy",
    country: "Pakistan",
    city: "Islamabad",
    address: "Blue Area",
    accountStatus: "Prospect",
    ownerId: leadOwners[2].id,
    ownerName: leadOwners[2].name,
    source: "Website",
    tags: ["Inbound", "Solar"],
    description: "Renewable energy integrator exploring inventory automation for field teams.",
    createdAt: iso(40, "14:30"),
    updatedAt: iso(2, "10:00"),
    lastActivityAt: iso(2, "10:00"),
  },
  {
    id: "co_05",
    name: "BuildPro",
    domain: "buildpro.ae",
    website: "https://buildpro.ae",
    industry: "Construction",
    companySize: "51–100",
    employeeCount: 64,
    annualRevenue: "$3.5M",
    currency: "AED",
    phone: "+971 4 221 9000",
    email: "ops@buildpro.ae",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "Business Bay",
    accountStatus: "Prospect",
    ownerId: leadOwners[3].id,
    ownerName: leadOwners[3].name,
    source: "WhatsApp",
    tags: ["Field Ops"],
    description: "Construction firm interested in route and dispatch automation.",
    createdAt: iso(25, "16:20"),
    updatedAt: iso(6, "09:30"),
    lastActivityAt: iso(6, "09:30"),
  },
  {
    id: "co_06",
    name: "Skyline Retail",
    domain: "skyline-retail.com",
    website: "https://skyline-retail.com",
    industry: "Retail",
    companySize: "251–500",
    employeeCount: 320,
    annualRevenue: "$22M",
    currency: "USD",
    phone: "+971 4 555 0188",
    email: "commerce@skyline-retail.com",
    country: "Saudi Arabia",
    city: "Riyadh",
    address: "King Fahd Road",
    accountStatus: "Opportunity",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "Facebook",
    tags: ["Commerce", "Omnichannel", "High Value"],
    description: "Multi-channel retailer evaluating an omnichannel commerce rollout.",
    createdAt: iso(18, "09:40"),
    updatedAt: iso(1, "18:00"),
    lastActivityAt: iso(1, "18:00"),
  },
  {
    id: "co_07",
    name: "Lotus Digital",
    domain: "lotusdigital.ae",
    website: "https://lotusdigital.ae",
    industry: "Agency",
    companySize: "11–50",
    employeeCount: 28,
    annualRevenue: "$900K",
    currency: "AED",
    phone: "+971 2 555 0148",
    email: "agency@lotusdigital.ae",
    country: "United Arab Emirates",
    city: "Abu Dhabi",
    address: "Al Reem Island",
    accountStatus: "Customer",
    ownerId: leadOwners[2].id,
    ownerName: leadOwners[2].name,
    source: "Referral",
    tags: ["Agency", "White-label"],
    description: "Digital agency scaling lead management across multiple client accounts.",
    createdAt: iso(60, "13:10"),
    updatedAt: iso(3, "15:20"),
    lastActivityAt: iso(2, "09:30"),
  },
  {
    id: "co_08",
    name: "Atlas Logistics",
    domain: "atlaslogistics.pk",
    website: "https://atlaslogistics.pk",
    industry: "Logistics",
    companySize: "101–250",
    employeeCount: 145,
    annualRevenue: "$6.2M",
    currency: "PKR",
    phone: "+92 42 3577 6600",
    email: "ops@atlaslogistics.pk",
    country: "Pakistan",
    city: "Lahore",
    address: "Ferozepur Road",
    accountStatus: "Customer",
    ownerId: leadOwners[4].id,
    ownerName: leadOwners[4].name,
    source: "Cold Call",
    tags: ["Logistics", "Route Ops"],
    description: "Logistics operator reviewing route optimization software for its fleet.",
    createdAt: iso(30, "15:00"),
    updatedAt: iso(2, "11:50"),
    lastActivityAt: iso(2, "11:50"),
  },
  {
    id: "co_09",
    name: "Mint E-commerce",
    domain: "mint-ecommerce.com",
    website: "https://mint-ecommerce.com",
    industry: "E-commerce",
    companySize: "11–50",
    employeeCount: 41,
    annualRevenue: "$2.0M",
    currency: "AED",
    phone: "+971 4 333 0123",
    email: "growth@mint-ecommerce.com",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "Dubai Internet City",
    accountStatus: "Opportunity",
    ownerId: leadOwners[3].id,
    ownerName: leadOwners[3].name,
    source: "Email",
    tags: ["Commerce", "Billing"],
    description: "Subscription e-commerce brand exploring billing and reporting dashboards.",
    createdAt: iso(12, "09:25"),
    updatedAt: iso(0, "08:00"),
    lastActivityAt: iso(0, "08:00"),
  },
  {
    id: "co_10",
    name: "Urban Kraft",
    domain: "urbankraft.co",
    website: "https://urbankraft.co",
    industry: "Manufacturing",
    companySize: "101–250",
    employeeCount: 200,
    annualRevenue: "$14M",
    currency: "PKR",
    phone: "+92 51 555 0134",
    email: "biz@urbankraft.co",
    country: "Pakistan",
    city: "Sialkot",
    address: "Export Zone",
    accountStatus: "Customer",
    ownerId: leadOwners[1].id,
    ownerName: leadOwners[1].name,
    source: "Instagram",
    tags: ["Manufacturing", "Wholesale"],
    description: "Industrial manufacturer running a brand storefront for wholesale buyers.",
    createdAt: iso(55, "11:30"),
    updatedAt: iso(4, "10:00"),
    lastActivityAt: iso(1, "08:55"),
  },
  {
    id: "co_11",
    name: "FinEdge",
    domain: "finedge.io",
    website: "https://finedge.io",
    industry: "Fintech",
    companySize: "11–50",
    employeeCount: 37,
    annualRevenue: "$1.6M",
    currency: "GBP",
    phone: "+44 20 4555 0199",
    email: "hello@finedge.io",
    country: "United Kingdom",
    city: "London",
    address: "Shoreditch High Street",
    accountStatus: "Prospect",
    ownerId: leadOwners[0].id,
    ownerName: leadOwners[0].name,
    source: "LinkedIn",
    tags: ["Finance", "Compliance"],
    description: "Fintech startup evaluating CRM for its expanding sales operations team.",
    createdAt: iso(9, "10:05"),
    updatedAt: iso(1, "09:00"),
    lastActivityAt: iso(1, "09:00"),
  },
];

export const companyContacts: Record<string, CompanyContactLink[]> = {
  co_01: [
    { contactId: "c_001", roles: ["Decision Maker"], primary: true },
    { contactId: "c_006", roles: ["Finance Contact"], primary: false },
    { contactId: "c_007", roles: ["Technical Contact"], primary: false },
  ],
  co_02: [{ contactId: "c_002", roles: ["Decision Maker"], primary: true }],
  co_03: [{ contactId: "c_003", roles: ["Decision Maker", "Technical Contact"], primary: true }],
  co_04: [{ contactId: "c_004", roles: ["Decision Maker"], primary: true }],
  co_05: [{ contactId: "c_005", roles: ["Decision Maker"], primary: true }],
  co_06: [{ contactId: "c_008", roles: ["Decision Maker"], primary: true }],
  co_07: [{ contactId: "c_009", roles: ["Decision Maker"], primary: true }],
  co_08: [{ contactId: "c_010", roles: ["Decision Maker"], primary: true }],
  co_09: [{ contactId: "c_011", roles: ["Decision Maker"], primary: true }],
  co_10: [{ contactId: "c_012", roles: ["Decision Maker"], primary: true }],
  co_11: [{ contactId: "c_013", roles: ["Decision Maker"], primary: true }],
};

export const companyDeals: Record<string, CrmDeal[]> = {
  co_01: [
    {
      id: "cd_1",
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
      id: "cd_2",
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
      id: "cd_3",
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
  co_03: [
    {
      id: "cd_4",
      name: "Cloud Migration Support",
      value: 36000,
      stage: "proposal",
      probability: 70,
      expectedClose: iso(-21, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Open",
    },
    {
      id: "cd_5",
      name: "Managed Services Retainer",
      value: 28000,
      stage: "negotiation",
      probability: 82,
      expectedClose: iso(-10, "12:00"),
      ownerId: leadOwners[0].id,
      ownerName: leadOwners[0].name,
      status: "Open",
    },
  ],
  co_06: [
    {
      id: "cd_6",
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
  co_08: [
    {
      id: "cd_7",
      name: "Route Optimization Suite",
      value: 15000,
      stage: "qualified",
      probability: 45,
      expectedClose: iso(-30, "12:00"),
      ownerId: leadOwners[4].id,
      ownerName: leadOwners[4].name,
      status: "Open",
    },
  ],
  co_09: [
    {
      id: "cd_8",
      name: "Subscription Billing Reports",
      value: 9500,
      stage: "new",
      probability: 15,
      expectedClose: iso(-35, "12:00"),
      ownerId: leadOwners[3].id,
      ownerName: leadOwners[3].name,
      status: "Open",
    },
  ],
};

export const companyActivities: Record<string, CompanyActivity[]> = {
  co_01: [
    { id: "ca_1", type: "call", title: "Follow-up call completed", detail: "Ahmed confirmed procurement timeline and implementation expectations.", at: iso(1, "16:00"), actor: "Hussain Ali", contactId: "c_001" },
    { id: "ca_2", type: "email", title: "Quote viewed", detail: "Ahmed opened the CRM implementation quote.", at: iso(0, "10:15"), actor: "Ahmed Khan", contactId: "c_001" },
    { id: "ca_3", type: "contact", title: "WhatsApp message received", detail: "Usman asked about API access for their approval workflow.", at: iso(0, "11:42"), actor: "Usman Shah", contactId: "c_007" },
    { id: "ca_4", type: "meeting", title: "Sara attended finance meeting", detail: "Budget discussion with finance team.", at: iso(3, "14:00"), actor: "Sara Ali", contactId: "c_006" },
    { id: "ca_5", type: "deal", title: "Deal moved to Negotiation", detail: "ERP Integration advanced to negotiation.", at: iso(5, "15:20"), actor: "Sara Ahmed" },
    { id: "ca_6", type: "payment", title: "Invoice paid", detail: "Invoice #INV-0042 settled via wire transfer.", at: iso(6, "11:10"), actor: "Sara Ali", contactId: "c_006" },
    { id: "ca_7", type: "support", title: "Support ticket resolved", detail: "SSO configuration issue resolved for the admin console.", at: iso(7, "13:25"), actor: "Support Team" },
    { id: "ca_8", type: "created", title: "Company created", detail: "Added from the website lead capture flow.", at: iso(90, "10:00"), actor: "Hussain Ali" },
  ],
  co_02: [
    { id: "ca_9", type: "email", title: "Marketing check-in sent", detail: "Analytics suite walkthrough scheduled.", at: iso(4, "09:20"), actor: "Ali Khan", contactId: "c_002" },
    { id: "ca_10", type: "created", title: "Company created", detail: "Added from LinkedIn campaign.", at: iso(75, "14:20"), actor: "Ali Khan" },
  ],
  co_03: [
    { id: "ca_11", type: "call", title: "Intro call completed", detail: "Discussed cloud migration scope and timeline.", at: iso(3, "11:50"), actor: "Ayesha Siddiqui", contactId: "c_003" },
    { id: "ca_12", type: "created", title: "Company created", detail: "Referred by Amna Yusuf.", at: iso(120, "09:10"), actor: "Sara Ahmed" },
  ],
};

export const companyInvoices: Record<string, Invoice[]> = {
  co_01: [
    { id: "inv_1", number: "INV-0041", amount: 1500, status: "paid" },
    { id: "inv_2", number: "INV-0042", amount: 3000, status: "sent" },
    { id: "inv_3", number: "INV-0043", amount: 4500, status: "overdue" },
  ],
  co_03: [
    { id: "inv_4", number: "INV-0038", amount: 7200, status: "paid" },
    { id: "inv_5", number: "INV-0039", amount: 1800, status: "overdue" },
  ],
  co_07: [
    { id: "inv_6", number: "INV-0040", amount: 2400, status: "paid" },
  ],
};

export const companyProjects: Record<string, CompanyProject[]> = {
  co_01: [
    { id: "prj_1", name: "CRM Rollout — Phase 1", status: "Active", value: 24000, startedAt: iso(20, "09:00") },
    { id: "prj_2", name: "ERP Integration", status: "On Hold", value: 18000, startedAt: iso(45, "09:00") },
  ],
  co_03: [
    { id: "prj_3", name: "Cloud Migration Assess", status: "Active", value: 12000, startedAt: iso(15, "10:00") },
  ],
  co_07: [
    { id: "prj_4", name: "White-label Portal Build", status: "Active", value: 9600, startedAt: iso(30, "09:30") },
  ],
};

export const companyTickets: Record<string, SupportTicket[]> = {
  co_01: [
    { id: "tkt_1", subject: "SSO configuration failed", status: "Resolved", priority: "high", createdAt: iso(8, "10:00") },
    { id: "tkt_2", subject: "Request: quarterly usage report", status: "Open", priority: "low", createdAt: iso(2, "14:00") },
  ],
  co_03: [
    { id: "tkt_3", subject: "VPN access for new hire", status: "Closed", priority: "medium", createdAt: iso(12, "09:00") },
  ],
};

export const accountHealth: Record<string, AccountHealth> = {
  co_01: {
    score: 88,
    status: "Healthy",
    factors: [
      { label: "Engagement", value: "High", tone: "good" },
      { label: "Payment History", value: "Excellent", tone: "good" },
      { label: "Support Issues", value: "Low", tone: "good" },
      { label: "Deal Activity", value: "Strong", tone: "good" },
      { label: "Customer Sentiment", value: "Positive", tone: "good" },
    ],
  },
  co_03: {
    score: 78,
    status: "Healthy",
    factors: [
      { label: "Engagement", value: "High", tone: "good" },
      { label: "Payment History", value: "Good", tone: "medium" },
      { label: "Support Issues", value: "Low", tone: "good" },
      { label: "Deal Activity", value: "Strong", tone: "good" },
      { label: "Customer Sentiment", value: "Positive", tone: "good" },
    ],
  },
  co_06: {
    score: 82,
    status: "Healthy",
    factors: [
      { label: "Engagement", value: "High", tone: "good" },
      { label: "Payment History", value: "N/A", tone: "medium" },
      { label: "Support Issues", value: "Low", tone: "good" },
      { label: "Deal Activity", value: "Strong", tone: "good" },
      { label: "Customer Sentiment", value: "Positive", tone: "good" },
    ],
  },
  co_04: {
    score: 54,
    status: "At Risk",
    factors: [
      { label: "Engagement", value: "Medium", tone: "medium" },
      { label: "Payment History", value: "N/A", tone: "medium" },
      { label: "Support Issues", value: "N/A", tone: "medium" },
      { label: "Deal Activity", value: "Low", tone: "low" },
      { label: "Customer Sentiment", value: "Neutral", tone: "medium" },
    ],
  },
};

export function getCompanyById(id: string): CompanyRecord | undefined {
  return companyMocks.find((company) => company.id === id);
}

export function getCompanyContacts(companyId: string): CompanyContactLink[] {
  return companyContacts[companyId] ?? [];
}

export function getCompanyDeals(companyId: string): CrmDeal[] {
  return companyDeals[companyId] ?? [];
}

export function getCompanyActivities(companyId: string): CompanyActivity[] {
  return companyActivities[companyId] ?? [];
}

export function getCompanyInvoices(companyId: string): Invoice[] {
  return companyInvoices[companyId] ?? [];
}

export function getCompanyProjects(companyId: string): CompanyProject[] {
  return companyProjects[companyId] ?? [];
}

export function getCompanyTickets(companyId: string): SupportTicket[] {
  return companyTickets[companyId] ?? [];
}

export function getAccountHealth(companyId: string): AccountHealth | undefined {
  return accountHealth[companyId];
}