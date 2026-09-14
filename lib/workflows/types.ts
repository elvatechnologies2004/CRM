/**
 * STEP 125 — Advanced workflow engine types.
 * Shared between the server engine and the workflow builder UI.
 */

export type WorkflowTriggerType =
  | "lead.created"
  | "lead.assigned"
  | "lead.updated"
  | "lead.converted"
  | "deal.created"
  | "deal.stage_changed"
  | "deal.won"
  | "deal.lost"
  | "contact.created"
  | "manual"
  | "scheduled";

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export type WorkflowRunStatus =
  | "running"
  | "waiting"
  | "awaiting_approval"
  | "success"
  | "partial"
  | "failed"
  | "cancelled";

export type WorkflowActionType =
  | "create_task"
  | "assign_owner"
  | "change_status"
  | "move_deal_stage"
  | "notify"
  | "update_field"
  | "webhook"
  | "ai_analysis"
  | "create_activity"
  | "send_email"
  | "route_lead"
  | "add_tag";

export interface WorkflowActionConfig {
  action: WorkflowActionType;
  // create_task
  task_title?: string;
  task_note?: string;
  assign_to?: string; // user id or {subject.owner_id}
  due_in_days?: number;
  // assign_owner / route_lead
  user_id?: string;
  reason?: string;
  // change_status
  status?: string;
  // move_deal_stage
  stage_id?: string;
  // notify
  title?: string;
  message?: string;
  user_ids?: string[];
  // update_field
  field?: string;
  value?: string;
  // webhook
  url?: string;
  method?: string;
  webhook_payload?: string;
  // ai_analysis
  prompt?: string;
  store_as_field?: string;
  // create_activity
  activity_type?: string;
  activity_title?: string;
  activity_description?: string;
  // send_email
  email_to?: string;
  email_subject?: string;
  email_template?: string;
  email_variables?: string;
  // add_tag
  tag?: string;
}

export interface ConditionNode {
  id: string;
  type: "condition";
  name?: string;
  config: {
    field: string;
    operator: "=" | "!=" | "in" | "not in" | ">" | "<" | ">=" | "<=";
    value: string;
    next_if_true: string | null;
    next_if_false: string | null;
  };
}

export interface ActionNode {
  id: string;
  type: "action";
  name?: string;
  next?: string | null;
  config: WorkflowActionConfig;
}

export interface DelayNode {
  id: string;
  type: "delay";
  name?: string;
  config: { minutes: number; next: string | null };
}

export interface WaitUntilNode {
  id: string;
  type: "wait_until";
  name?: string;
  config: { at_field: string; next: string | null };
}

export interface ApprovalNode {
  id: string;
  type: "approval";
  name?: string;
  config: {
    policy_id: string | null;
    title?: string;
    next_if_approved: string | null;
    next_if_rejected: string | null;
  };
}

export interface ParallelNode {
  id: string;
  type: "parallel";
  name?: string;
  config: { branches: string[][]; next: string | null };
}

export interface EndNode {
  id: string;
  type: "end";
  name?: string;
}

export type WorkflowNode =
  | ConditionNode
  | ActionNode
  | DelayNode
  | WaitUntilNode
  | ApprovalNode
  | ParallelNode
  | EndNode;

export interface WorkflowDefinition {
  start: string;
  nodes: WorkflowNode[];
}

export interface WorkflowEvent {
  type: WorkflowTriggerType;
  subjectType?: string | null;
  subjectId?: string | null;
  payload?: Record<string, unknown>;
  organizationId?: string;
}

export interface WorkflowRunView {
  id: string;
  workflow_id: string;
  workflow_name: string;
  trigger_event: string | null;
  subject_type: string | null;
  subject_id: string | null;
  status: WorkflowRunStatus;
  node_path: string[];
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  steps: { node_id: string; node_type: string; status: string; error_message: string | null }[];
}

export const WORKFLOW_TRIGGERS: { value: WorkflowTriggerType; label: string }[] = [
  { value: "lead.created", label: "Lead created" },
  { value: "lead.assigned", label: "Lead assigned" },
  { value: "lead.updated", label: "Lead updated" },
  { value: "lead.converted", label: "Lead converted" },
  { value: "deal.created", label: "Deal created" },
  { value: "deal.stage_changed", label: "Deal stage changed" },
  { value: "deal.won", label: "Deal won" },
  { value: "deal.lost", label: "Deal lost" },
  { value: "contact.created", label: "Contact created" },
  { value: "manual", label: "Manual / button" },
  { value: "scheduled", label: "Scheduled" },
];