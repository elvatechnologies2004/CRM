"use server";

import {
  createWorkflow,
  deleteWorkflow,
  processDueJobs,
  runWorkflowManually,
  toggleWorkflow,
  updateWorkflow,
  type WorkflowInput,
} from "@/lib/workflows/engine";

export async function createWorkflowAction(input: WorkflowInput): Promise<{ ok: boolean }> {
  return { ok: await createWorkflow(input) };
}

export async function updateWorkflowAction(id: string, input: Partial<WorkflowInput>): Promise<{ ok: boolean }> {
  return { ok: await updateWorkflow(id, input) };
}

export async function toggleWorkflowAction(id: string, status: "active" | "paused" | "archived"): Promise<{ ok: boolean }> {
  return { ok: await toggleWorkflow(id, status) };
}

export async function deleteWorkflowAction(id: string): Promise<{ ok: boolean }> {
  return { ok: await deleteWorkflow(id) };
}

export async function runWorkflowManuallyAction(workflowId: string): Promise<{ ok: boolean }> {
  return { ok: await runWorkflowManually(workflowId) };
}

export async function processDueJobsAction(): Promise<{ processed: number }> {
  return { processed: await processDueJobs() };
}