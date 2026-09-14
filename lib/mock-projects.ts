import type { CrmProject, ProjectStatus } from "@/lib/types";

export const projectStatuses: ProjectStatus[] = [
  "Active",
  "On Hold",
  "Completed",
  "Cancelled",
];

export const projectMocks: CrmProject[] = [];

export function getProjectById(id: string): CrmProject | undefined {
  return projectMocks.find((p) => p.id === id);
}