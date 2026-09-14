import type { CrmForm } from "@/lib/types";
import { iso } from "@/lib/date-utils";

export const marketingFormMocks: CrmForm[] = [
  {
    id: "frm_001",
    name: "Newsletter Signup",
    description: "Weekly digest signup for website visitors.",
    fields: [
      { id: "ff_1", label: "First Name", type: "Text", required: true },
      { id: "ff_2", label: "Last Name", type: "Text", required: true },
      { id: "ff_3", label: "Email", type: "Email", required: true },
    ],
    submissions: 1240,
    status: "Active",
    createdAt: iso(-180, "09:00"),
  },
  {
    id: "frm_002",
    name: "Product Demo Request",
    description: "Request a guided product walkthrough.",
    fields: [
      { id: "ff_4", label: "First Name", type: "Text", required: true },
      { id: "ff_5", label: "Last Name", type: "Text", required: true },
      { id: "ff_6", label: "Work Email", type: "Email", required: true },
      { id: "ff_7", label: "Company", type: "Text", required: true },
    ],
    submissions: 890,
    status: "Active",
    createdAt: iso(-150, "11:00"),
  },
  {
    id: "frm_003",
    name: "Partner Program Interest",
    description: "Interest form for the partner program.",
    fields: [
      { id: "ff_8", label: "Company Name", type: "Text", required: true },
      { id: "ff_9", label: "Contact Name", type: "Text", required: true },
      { id: "ff_10", label: "Email", type: "Email", required: true },
    ],
    submissions: 340,
    status: "Active",
    createdAt: iso(-120, "10:00"),
  },
  {
    id: "frm_004",
    name: "Customer Feedback Survey",
    description: "Post-onboarding satisfaction survey.",
    fields: [
      { id: "ff_11", label: "Rating", type: "Dropdown", required: true, options: ["1", "2", "3", "4", "5"] },
      { id: "ff_12", label: "Comments", type: "Textarea", required: false },
    ],
    submissions: 0,
    status: "Inactive",
    createdAt: iso(-30, "09:00"),
  },
];