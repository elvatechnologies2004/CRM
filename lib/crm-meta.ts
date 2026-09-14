import type {
  CompanyAccountStatus,
  CompanyIndustry,
  ContactLifecycle,
  DealStage,
  DealStageLabel,
  PreferredChannel,
} from "@/lib/types";

export const contactLifecycles: ContactLifecycle[] = [
  "Lead",
  "Subscriber",
  "Opportunity",
  "Customer",
  "Former Customer",
  "Trial",
];

export const preferredChannels: PreferredChannel[] = [
  "Email",
  "WhatsApp",
  "Phone",
  "SMS",
];

export const companyAccountStatuses: CompanyAccountStatus[] = [
  "Customer",
  "Opportunity",
  "Prospect",
  "Former Customer",
  "Churned",
];

export const companyIndustries: CompanyIndustry[] = [
  "Software",
  "Marketing",
  "IT Services",
  "Renewable Energy",
  "Construction",
  "Retail",
  "E-commerce",
  "Agency",
  "Logistics",
  "Manufacturing",
  "Fintech",
  "Other",
];

export const companySizeOptions = [
  "1–10",
  "11–50",
  "51–100",
  "101–250",
  "251–500",
  "500+",
];

export const currencyOptions = ["PKR", "USD", "AED", "SAR", "GBP", "EUR"];

export const dealStageLabels: Record<DealStage, DealStageLabel> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const dealStageLabelList: DealStageLabel[] = [
  "New",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

export function stageFromLabel(label: DealStageLabel): DealStage {
  return (
    (Object.keys(dealStageLabels).find(
      (key) => dealStageLabels[key as DealStage] === label
    ) as DealStage) ?? "new"
  );
}

export function probabilityForStage(stage: DealStage): number {
  switch (stage) {
    case "new":
      return 10;
    case "qualified":
      return 30;
    case "proposal":
      return 55;
    case "negotiation":
      return 80;
    case "won":
      return 100;
    case "lost":
      return 0;
  }
}

export function formatCurrency(value: number, currency = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}