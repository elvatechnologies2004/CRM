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

export const marketingCampaigns: {
  id: string;
  name: string;
  source: MarketingSource;
  status: string;
  started: string;
  budget: number;
  spent: number;
  responseRate: number;
  leadsGenerated: number;
}[] = [];

export const marketingLandingPages: {
  id: string;
  name: string;
  slug: string;
  status: string;
  conversionRate: number;
  visitors: number;
}[] = [];

export const marketingForms: {
  id: string;
  name: string;
  status: string;
  fields: string[];
  submissions: number;
}[] = [];