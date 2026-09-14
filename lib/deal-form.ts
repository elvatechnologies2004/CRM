import type { DealRecord, DealFormData, DealEditFormData } from "@/lib/types";
import { leadOwners, leadSourceOptions } from "@/lib/mock-leads";
export type { DealFormData, DealEditFormData };
export const emptyDealForm: DealFormData = {
  name: "",
  companyId: "",
  companyName: "",
  primaryContactId: "",
  primaryContactName: "",
  pipelineId: "p_001",
  pipelineName: "Main Sales Pipeline",
  stageId: "new",
  stageName: "New",
  value: "",
  currency: "USD",
  probability: "",
  expectedCloseDate: new Date().toISOString(),
  ownerId: leadOwners[0].id,
  ownerName: leadOwners[0].name,
  source: leadSourceOptions[0],
  description: "",
  tags: "",
  products: [],
};

export function buildDealRecord(data: DealFormData): DealRecord {
  const owner = leadOwners.find((candidate) => candidate.name === data.ownerName);
  const now = new Date().toISOString();
  const stageId = data.stageId ?? "new";
  const probability = data.probability ? Math.min(Math.max(Number(data.probability), 0), 100) : defaultProbabilityForStage(stageId);

  const value = Number(data.value) || 0;
  const expectedRevenue = Math.round(value * (probability / 100));

  const stageNames: Record<string, string> = {
    new: "New",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
  };

  const record: DealRecord = {
    id: `d_${Date.now().toString(36)}`,
    name: data.name.trim(),
    companyId: data.companyId,
    companyName: data.companyName,
    primaryContactId: data.primaryContactId || "",
    primaryContactName: data.primaryContactName || "",
    pipelineId: data.pipelineId ?? "p_001",
    pipelineName: data.pipelineName || "Main Sales Pipeline",
    stageId,
    stageName: stageNames[stageId] ?? "New",
    value,
    currency: data.currency || "USD",
    probability,
    expectedRevenue,
    expectedCloseDate: data.expectedCloseDate || now,
    ownerId: owner?.id ?? data.ownerId ?? "u_1",
    ownerName: owner?.name ?? data.ownerName ?? leadOwners[0].name,
    source: data.source || leadSourceOptions[0],
    description: (data.description ?? "").trim(),
    tags: (data.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    products: data.products || [],
    contacts: [],
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
    daysOpen: 0,
    daysInStage: 0,
    healthScore: 50,
    healthStatus: "Needs Attention",
  };
  return record;
}

export function applyDealEdit(
  existing: DealRecord,
  data: DealEditFormData
): DealRecord {
  const now = new Date().toISOString();
  const probability = data.probability ? Math.min(Math.max(Number(data.probability), 0), 100) : defaultProbabilityForStage(data.stageId);

  return {
    ...existing,
    name: data.name.trim(),
    value: Number(data.value) || existing.value,
    currency: data.currency || existing.currency,
    probability,
    expectedRevenue: Math.round(Number(data.value) * (probability / 100)),
    stageId: data.stageId ?? existing.stageId,
    stageName: stageNameFromStageId(data.stageId ?? existing.stageId),
    expectedCloseDate: data.expectedCloseDate ?? existing.expectedCloseDate,
    ownerId: data.ownerId ?? existing.ownerId,
    ownerName: data.ownerName ?? existing.ownerName,
    source: data.source ?? existing.source,
    description: data.description.trim(),
    tags: data.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
    products: data.products ?? existing.products,
    updatedAt: now,
    lastActivityAt: now,
  };
}

function defaultProbabilityForStage(stageId: string): number {
  const defaults: Record<string, number> = {
    new: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    won: 100,
    lost: 0,
  };
  return defaults[stageId] ?? 10;
}

function stageNameFromStageId(stageId: string): string {
  const names: Record<string, string> = {
    new: "New",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
  };
  return names[stageId] ?? "New";
}