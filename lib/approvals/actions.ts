"use server";

import {
  cancelApproval,
  createApprovalPolicy,
  decideApproval,
  deleteApprovalPolicy,
  toggleApprovalPolicy,
  updateApprovalPolicy,
  type ApprovalPolicyInput,
} from "@/lib/approvals/engine";

export async function createApprovalPolicyAction(input: ApprovalPolicyInput): Promise<{ ok: boolean }> {
  return { ok: await createApprovalPolicy(input) };
}

export async function updateApprovalPolicyAction(id: string, input: Partial<ApprovalPolicyInput>): Promise<{ ok: boolean }> {
  return { ok: await updateApprovalPolicy(id, input) };
}

export async function toggleApprovalPolicyAction(id: string, isActive: boolean): Promise<{ ok: boolean }> {
  return { ok: await toggleApprovalPolicy(id, isActive) };
}

export async function deleteApprovalPolicyAction(id: string): Promise<{ ok: boolean }> {
  return { ok: await deleteApprovalPolicy(id) };
}

export async function approveRequestAction(requestId: string, comment?: string): Promise<{ ok: boolean; status?: string }> {
  const status = await decideApproval(requestId, "approved", comment);
  return { ok: status !== null, status: status ?? undefined };
}

export async function rejectRequestAction(requestId: string, comment?: string): Promise<{ ok: boolean; status?: string }> {
  const status = await decideApproval(requestId, "rejected", comment);
  return { ok: status !== null, status: status ?? undefined };
}

export async function cancelRequestAction(requestId: string): Promise<{ ok: boolean }> {
  return { ok: await cancelApproval(requestId) };
}