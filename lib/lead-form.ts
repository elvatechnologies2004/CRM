import type {
  LeadRecord,
  LeadSourceOption,
  LeadStatus,
  User,
} from "@/lib/types";

export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  companyName: string;
  jobTitle: string;
  country: string;
  city: string;
  source: LeadSourceOption;
  status: LeadStatus;
  ownerName: string;
  expectedValue: string;
  interest: string;
  tags: string;
  notes: string;
}

export const emptyLeadForm: LeadFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  whatsapp: "",
  companyName: "",
  jobTitle: "",
  country: "",
  city: "",
  source: "Website",
  status: "New",
  ownerName: "",
  expectedValue: "",
  interest: "",
  tags: "",
  notes: "",
};

export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

interface BuildLeadOptions {
  owners: User[];
  existing?: LeadRecord;
}

export function buildLeadRecord(data: LeadFormData, options: BuildLeadOptions): LeadRecord {
  const owner =
    options.owners.find((candidate) => candidate.name === data.ownerName) ??
    options.owners[0];
  const now = new Date().toISOString();
  const id = options.existing?.id ?? `l_${Date.now().toString(36)}`;

  return {
    id,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    whatsapp: data.whatsapp.trim() || data.phone.trim(),
    companyName: data.companyName.trim(),
    jobTitle: data.jobTitle.trim(),
    country: data.country.trim(),
    city: data.city.trim(),
    source: data.source,
    status: data.status,
    score: options.existing?.score ?? 60,
    ownerId: owner?.id ?? "",
    ownerName: owner?.name ?? data.ownerName,
    expectedValue: Number(data.expectedValue) || 0,
    currency: "PKR",
    budget: "Unclear",
    interest: data.interest.trim(),
    tags: parseTags(data.tags),
    createdAt: options.existing?.createdAt ?? now,
    updatedAt: now,
    lastActivityAt: options.existing?.lastActivityAt ?? now,
    nextFollowUpAt: options.existing?.nextFollowUpAt,
    qualification: options.existing?.qualification ?? {
      budget: "Unclear",
      authority: "Unknown",
      need: "Moderate",
      timeline: "6+ Months",
      score: 30,
    },
  };
}