export type MarketingSource =
  | "Website"
  | "Referral"
  | "Cold Call"
  | "Trade Show"
  | "Partner"
  | "Social Media"
  | "Email Campaign"
  | "Paid Advertising";

export const marketingSources: MarketingSource[] = [
  "Website",
  "Referral",
  "Cold Call",
  "Trade Show",
  "Partner",
  "Social Media",
  "Email Campaign",
  "Paid Advertising",
];

export const marketingCampaigns = [
  { id: "mkt_001", name: "Q4 Black Friday", source: "Paid Advertising", status: "Active", started: "2024-11-01", budget: 5000, spent: 3200, responseRate: 12, leadsGenerated: 45 },
  { id: "mkt_002", name: "Q3 Webinar Series", source: "Email Campaign", status: "Completed", started: "2024-09-15", budget: 2000, spent: 2000, responseRate: 25, leadsGenerated: 30 },
  { id: "mkt_003", name: "Spring Trade Show", source: "Trade Show", status: "Completed", started: "2024-03-10", budget: 3500, spent: 3500, responseRate: 18, leadsGenerated: 22 },
  { id: "mkt_004", name: "Social Media Summer Contest", source: "Social Media", status: "Active", started: "2024-06-01", budget: 1500, spent: 900, responseRate: 30, leadsGenerated: 60 },
  { id: "mkt_005", name: "Partner Program Launch", source: "Partner", status: "Active", started: "2024-05-20", budget: 4000, spent: 2800, responseRate: 15, leadsGenerated: 28 },
];

export const marketingLandingPages = [
  { id: "lp_001", name: "Black Friday Deal", slug: "black-friday-deal", status: "Published", conversionRate: 12, visitors: 2450 },
  { id: "lp_002", name: "Spring Newsletter Signup", slug: "spring-newsletter-signup", status: "Published", conversionRate: 22, visitors: 1800 },
  { id: "lp_003", name: "Product Demo Request", slug: "product-demo-request", status: "Published", conversionRate: 15, visitors: 1200 },
  { id: "lp_004", name: "Waitlist Early Access", slug: "waitlist-early-access", status: "Published", conversionRate: 28, visitors: 890 },
  { id: "lp_005", name: "Integration Comparison", slug: "integration-comparison", status: "Draft", conversionRate: 8, visitors: 340 },
];

export const marketingForms = [
  { id: "frm_001", name: "Newsletter Signup", status: "Active", fields: ["firstName", "lastName", "email"], submissions: 1240 },
  { id: "frm_002", name: "Product Demo Request", status: "Active", fields: ["firstName", "lastName", "email", "company"], submissions: 890 },
  { id: "frm_003", name: "Partner Program Interest", status: "Active", fields: ["companyName", "contactName", "email", "phone"], submissions: 340 },
  { id: "frm_004", name: "Survey - Customer Feedback", status: "Draft", fields: ["firstName", "lastName", "email", "rating", "comments"], submissions: 0 },
];