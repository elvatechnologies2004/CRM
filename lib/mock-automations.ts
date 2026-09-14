import type { CrmAutomation, AutomationStatus, AutomationTrigger, AutomationActionType, AutomationConditionField } from "@/lib/types";
import { iso } from "@/lib/date-utils";

export const automationStatuses: AutomationStatus[] = ["Draft", "Active", "Paused"];

export const automationTriggers: AutomationTrigger[] = [
  "Lead Created",
  "Lead Status Changed",
  "Deal Created",
  "Deal Stage Changed",
  "Deal Won",
  "Deal Lost",
  "Task Overdue",
  "Email Opened",
  "Email Replied",
  "Form Submitted",
  "Quote Accepted",
  "Invoice Overdue",
  "Customer Inactive",
];

export const automationActionTypes: AutomationActionType[] = [
  "Assign Owner",
  "Change Status",
  "Create Task",
  "Send Email",
  "Send WhatsApp",
  "Add Tag",
  "Remove Tag",
  "Move Deal Stage",
  "Add to Sequence",
  "Create Notification",
  "Update Field",
];

export const automationConditionFields: AutomationConditionField[] = [
  "Lead Score",
  "Owner",
  "Source",
  "Deal Value",
  "Stage",
  "Country",
  "Tags",
  "Company",
  "Product",
  "Days Inactive",
];

export const automationMocks: CrmAutomation[] = [
  {
    id: "au_001",
    name: "Assign new leads by source",
    description: "Auto-assign website leads to the SDR rotation and add a welcome task.",
    status: "Active",
    trigger: "Lead Created",
    conditions: [{ id: "con_001", field: "Source", operator: "=", value: "Website" }],
    actions: [
      { id: "act_001", type: "Assign Owner", target: "Owner", value: "Ayesha Siddiqui" },
      { id: "act_002", type: "Create Task", target: "Task", value: "Welcome call within 24h" },
      { id: "act_003", type: "Add Tag", target: "Tags", value: "auto-assigned" },
    ],
    runsCount: 186,
    lastRunAt: iso(0, "09:12"),
    createdAt: iso(40, "10:00"),
  },
  {
    id: "au_002",
    name: "High-value deal stage notify",
    description: "Notify the CSM and create an internal task when deals cross into Negotiation.",
    status: "Active",
    trigger: "Deal Stage Changed",
    conditions: [{ id: "con_002", field: "Stage", operator: "=", value: "Negotiation" }],
    actions: [
      { id: "act_004", type: "Create Notification", target: "team", value: "Deal moved to Negotiation" },
      { id: "act_005", type: "Create Task", target: "Owner", value: "Prepare final proposal" },
    ],
    runsCount: 24,
    lastRunAt: iso(-1, "14:30"),
    createdAt: iso(35, "09:00"),
  },
  {
    id: "au_003",
    name: "Overdue task follow-up",
    description: "Flag overdue follow-up tasks and reassign to the owner's manager for review.",
    status: "Active",
    trigger: "Task Overdue",
    conditions: [{ id: "con_003", field: "Days Inactive", operator: ">", value: "1" }],
    actions: [
      { id: "act_006", type: "Create Notification", target: "manager", value: "Overdue task alert" },
    ],
    runsCount: 63,
    lastRunAt: iso(0, "08:00"),
    createdAt: iso(20, "12:00"),
  },
  {
    id: "au_004",
    name: "Demo follow-up automation",
    description: "Send a WhatsApp recap right after a demo meeting is booked.",
    status: "Draft",
    trigger: "Deal Created",
    conditions: [],
    actions: [{ id: "act_007", type: "Send WhatsApp", target: "Contact", value: "Demo recap template" }],
    runsCount: 0,
    createdAt: iso(3, "11:00"),
  },
  {
    id: "au_005",
    name: "Inactive customer win-back",
    description: "Move customers with no activity for 60 days to a nurture sequence.",
    status: "Paused",
    trigger: "Customer Inactive",
    conditions: [{ id: "con_004", field: "Days Inactive", operator: ">", value: "60" }],
    actions: [
      { id: "act_008", type: "Change Status", target: "Contact", value: "Nurturing" },
      { id: "act_009", type: "Add to Sequence", target: "Sequence", value: "Re-engagement" },
    ],
    runsCount: 11,
    lastRunAt: iso(-6, "09:00"),
    createdAt: iso(18, "10:00"),
  },
];

export function getAutomation(id: string): CrmAutomation | undefined {
  return automationMocks.find((a) => a.id === id);
}