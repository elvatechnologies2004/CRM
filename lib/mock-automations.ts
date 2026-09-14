import type { CrmAutomation, AutomationStatus, AutomationTrigger, AutomationActionType, AutomationConditionField } from "@/lib/types";

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

export const automationMocks: CrmAutomation[] = [];

export function getAutomation(id: string): CrmAutomation | undefined {
  return automationMocks.find((a) => a.id === id);
}