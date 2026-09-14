import type {
  CrmTask,
  TaskPriorityLevel,
  TaskStatus,
  TaskType,
  RelatedRecordType,
} from "@/lib/types";

export const taskTypes: TaskType[] = [
  "Call",
  "Email",
  "WhatsApp",
  "Meeting",
  "Follow-up",
  "Demo",
  "Proposal",
  "Internal",
  "Other",
];

export const taskStatuses: TaskStatus[] = ["Open", "In Progress", "Completed", "Cancelled"];

export const taskPriorities: TaskPriorityLevel[] = ["Low", "Medium", "High", "Urgent"];

export const taskMocks: CrmTask[] = [];

export function getTaskById(id: string): CrmTask | undefined {
  return taskMocks.find((task) => task.id === id);
}

export function tasksByRelated(type: RelatedRecordType, id: string): CrmTask[] {
  return taskMocks.filter((task) => task.relatedType === type && task.relatedId === id);
}

export function ownerTaskCounts() {
  return {};
}