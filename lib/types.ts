export type LeadSource =
  | "Website"
  | "LinkedIn"
  | "Referral"
  | "WhatsApp"
  | "Email"
  | "Cold Call";

export type LeadScoreLevel = "high" | "medium" | "low";

export type DealStage =
  | "new"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type TaskPriority = "high" | "medium" | "low";

export type RiskStatus = "red" | "orange" | "yellow";

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
  organizationId?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  createdAt?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyId?: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  source: LeadSource;
  score: number;
  time: string;
  phone?: string;
  email?: string;
  convertedDealId?: string;
}

export interface Deal {
  id: string;
  name: string;
  companyId?: string;
  value: number;
  stage: DealStage;
  probability: number;
  ownerId?: string;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  subtitle: string;
  priority: TaskPriority;
  completed: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  time: string;
  company: string;
  type: "call" | "video" | "in-person";
}

export interface Quote {
  id: string;
  number: string;
  dealId?: string;
  value: number;
  status: "draft" | "sent" | "accepted" | "rejected";
}

export interface Invoice {
  id: string;
  number: string;
  quoteId?: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "lead" | "deal" | "task" | "system";
}

export interface SystemNotification {
  id: string;
  type: "System" | "Task" | "Follow-up" | "Deal" | "Invoice";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface RevenuePoint {
  month: string;
  value: number;
}

export interface SalesPerformancePoint {
  month: string;
  leads: number;
  deals: number;
  won: number;
}

export interface TeamMemberPerformance {
  id: string;
  name: string;
  dealsWon: number;
  revenue: number;
  growth: number;
}

export interface DealRisk {
  id: string;
  company: string;
  reason: string;
  amount: number;
  status: RiskStatus;
}

export interface DealStageOverview {
  stage: string;
  count: number;
  percentage: number;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  change: string;
  comparison: string;
}

/* ------------------------------ Leads module ------------------------------ */

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal"
  | "Unqualified";

export type LeadSourceOption =
  | "Website"
  | "WhatsApp"
  | "LinkedIn"
  | "Facebook"
  | "Instagram"
  | "Referral"
  | "Email"
  | "Cold Call"
  | "Manual"
  | "Other";

export type LeadActivityType =
  | "created"
  | "email-sent"
  | "email-opened"
  | "email-replied"
  | "whatsapp"
  | "call"
  | "meeting"
  | "note"
  | "task-completed"
  | "status-change"
  | "score-change"
  | "proposal"
  | "quote";

export interface LeadActivity {
  id: string;
  type: LeadActivityType;
  title: string;
  detail?: string;
  at: string;
  actor?: string;
}

export interface LeadNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  pinned?: boolean;
}

export type LeadTaskStatus = "Open" | "Done";

export interface LeadTask {
  id: string;
  title: string;
  due: string;
  priority: TaskPriority;
  status: LeadTaskStatus;
  owner: string;
}

export type LeadMeetingKind = "upcoming" | "past";

export interface LeadMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  kind: LeadMeetingKind;
  join?: string;
}

export type LeadEmailDirection = "in" | "out";

export interface LeadEmail {
  id: string;
  subject: string;
  direction: LeadEmailDirection;
  from: string;
  to: string;
  date: string;
  body: string;
  opened?: boolean;
}

export interface LeadWhatsAppMessage {
  id: string;
  from: "customer" | "agent";
  text: string;
  time: string;
  attachment?: string;
}

export type BudgetLevel = "Confirmed" | "Estimated" | "Unclear";
export type AuthorityLevel =
  | "Likely Decision Maker"
  | "Influencer"
  | "Unknown";
export type NeedLevel = "Strong" | "Moderate" | "Weak";
export type TimelineLevel =
  | "< 1 Month"
  | "1–2 Months"
  | "This Quarter"
  | "6+ Months";

export interface LeadQualification {
  budget: BudgetLevel;
  authority: AuthorityLevel;
  need: NeedLevel;
  timeline: TimelineLevel;
  score: number;
}

export interface LeadFile {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "docx" | "image" | "other";
  size: string;
  uploadedAt: string;
}

export interface LeadRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  companyId?: string;
  companyName: string;
  jobTitle: string;
  country: string;
  city: string;
  source: LeadSourceOption;
  status: LeadStatus;
  score: number;
  ownerId: string;
  ownerName: string;
  expectedValue: number;
  currency: string;
  budget: string;
  interest: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  nextFollowUpAt?: string;
  convertedDealId?: string;
  archivedAt?: string;
  qualification: LeadQualification;
}

/* ------------------------- Contacts & Companies module ------------------------- */

export type ContactLifecycle =
  | "Lead"
  | "Subscriber"
  | "Opportunity"
  | "Customer"
  | "Former Customer"
  | "Trial";

export type PreferredChannel = "Email" | "WhatsApp" | "Phone" | "SMS";

export interface ContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  whatsapp: string;
  companyId?: string;
  companyName: string;
  lifecycleStage: ContactLifecycle;
  ownerId: string;
  ownerName: string;
  source: LeadSourceOption;
  country: string;
  city: string;
  address: string;
  tags: string[];
  preferredChannel: PreferredChannel;
  preferredLanguage?: string;
  birthday?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  nextActivityAt?: string;
}

export type ContactActivityType =
  | "created"
  | "email"
  | "whatsapp"
  | "call"
  | "meeting"
  | "task"
  | "note"
  | "deal-created"
  | "deal-stage-change"
  | "proposal"
  | "quote"
  | "invoice"
  | "payment"
  | "support-ticket";

export interface ContactActivity {
  id: string;
  type: ContactActivityType;
  title: string;
  detail?: string;
  at: string;
  actor?: string;
}

export type CompanyAccountStatus =
  | "Customer"
  | "Opportunity"
  | "Prospect"
  | "Former Customer"
  | "Churned";

export type CompanyIndustry =
  | "Software"
  | "Marketing"
  | "IT Services"
  | "Renewable Energy"
  | "Construction"
  | "Retail"
  | "E-commerce"
  | "Agency"
  | "Logistics"
  | "Manufacturing"
  | "Fintech"
  | "Other";

export type CompanyActivityType =
  | "created"
  | "contact"
  | "email"
  | "call"
  | "meeting"
  | "note"
  | "deal"
  | "invoice"
  | "payment"
  | "support";

export interface CompanyActivity {
  id: string;
  type: CompanyActivityType;
  title: string;
  detail?: string;
  at: string;
  actor?: string;
  contactId?: string;
}

export type CompanyRelationshipRole =
  | "Decision Maker"
  | "Finance Contact"
  | "Technical Contact"
  | "Executive Sponsor"
  | "Primary Contact";

export interface CompanyContactLink {
  contactId: string;
  roles: Array<Exclude<CompanyRelationshipRole, "Primary Contact">>;
  primary: boolean;
}

export interface CompanyRecord {
  id: string;
  name: string;
  domain: string;
  website: string;
  industry: CompanyIndustry;
  companySize: string;
  employeeCount: number;
  annualRevenue: string;
  currency: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  accountStatus: CompanyAccountStatus;
  ownerId: string;
  ownerName: string;
  source: LeadSourceOption;
  tags: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export type DealStatus = "Open" | "Won" | "Lost";

export interface CrmDeal {
  id: string;
  name: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedClose: string;
  ownerId: string;
  ownerName: string;
  status: DealStatus;
}

export type DealStageLabel =
  | "New"
  | "Qualified"
  | "Proposal"
  | "Negotiation"
  | "Won"
  | "Lost";

/* ------------------------------ Deals module ------------------------------ */

export type DealHealthStatus = "Healthy" | "Needs Attention" | "At Risk" | "Critical";

export type DealHealthFactorLabel =
  | "Customer Engagement"
  | "Activity Recency"
  | "Decision Maker Access"
  | "Task Completion"
  | "Close Date Confidence"
  | "Proposal Engagement";

export interface DealHealthFactor {
  label: DealHealthFactorLabel;
  value: number;
  tone: "good" | "medium" | "low";
  description?: string;
}

export interface DealHealth {
  score: number;
  status: DealHealthStatus;
  factors: DealHealthFactor[];
  riskFactors: string[];
}

export type DealActivityType =
  | "created"
  | "stage-changed"
  | "value-changed"
  | "probability-changed"
  | "email"
  | "whatsapp"
  | "call"
  | "meeting"
  | "task"
  | "note"
  | "quote"
  | "proposal"
  | "file"
  | "ai-recommendation"
  | "health-changed"
  | "won"
  | "lost";

export interface DealActivity {
  id: string;
  type: DealActivityType;
  title: string;
  detail?: string;
  at: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export type DealProduct = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  subtotal: number;
};

export type DealContactRole =
  | "Decision Maker"
  | "Champion"
  | "Influencer"
  | "Technical Evaluator"
  | "Finance"
  | "Procurement"
  | "End User"
  | "Blocker";

export interface DealContact {
  contactId: string;
  name: string;
  jobTitle: string;
  email: string;
  role: DealContactRole;
  isPrimary: boolean;
}

export interface DealTask {
  id: string;
  title: string;
  due: string;
  priority: TaskPriority;
  status: "Open" | "Done";
  owner: string;
  ownerId?: string;
}

export type DealMeetingKind = "upcoming" | "past";

export interface DealMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  kind: DealMeetingKind;
  join?: string;
  notes?: string;
  participants?: string[];
  aiSummary?: string;
  actionItems?: string[];
}

export type DealEmailDirection = "in" | "out";

export interface DealEmail {
  id: string;
  subject: string;
  direction: DealEmailDirection;
  from: string;
  to: string;
  date: string;
  body: string;
  opened?: boolean;
  threadId?: string;
}

export interface DealWhatsAppMessage {
  id: string;
  from: "customer" | "agent";
  text: string;
  time: string;
  attachment?: string;
}

export interface DealQuote {
  id: string;
  number: string;
  value: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  validUntil: string;
  createdAt: string;
}

export interface DealProposal {
  id: string;
  name: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  sentAt?: string;
  viewedAt?: string;
  viewCount?: number;
}

export interface DealHistoryEntry {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export type DealWinReason =
  | "Product Fit"
  | "Price"
  | "Relationship"
  | "Features"
  | "Implementation"
  | "Support"
  | "Other";

export type DealLostReason =
  | "Price"
  | "Competitor"
  | "Budget"
  | "No Decision"
  | "Timing"
  | "Missing Feature"
  | "Lost Contact"
  | "Internal Change"
  | "Other";

export interface DealWonData {
  wonDate: string;
  finalValue: number;
  products: DealProduct[];
  winReason: DealWinReason;
  notes?: string;
}

export interface DealLostData {
  lostDate: string;
  lostReason: DealLostReason;
  competitor?: string;
  notes?: string;
}

export interface DealRecord {
  id: string;
  name: string;
  companyId?: string;
  companyName: string;
  primaryContactId?: string;
  primaryContactName: string;
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
  value: number;
  currency: string;
  probability: number;
  expectedRevenue: number;
  expectedCloseDate: string;
  ownerId: string;
  ownerName: string;
  healthScore: number;
  healthStatus: DealHealthStatus;
  source: LeadSourceOption;
  description?: string;
  tags: string[];
  products: DealProduct[];
  contacts: DealContact[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  daysOpen: number;
  daysInStage: number;
  wonDate?: string;
  lostDate?: string;
  winReason?: DealWinReason;
  lostReason?: DealLostReason;
  competitor?: string;
  archivedAt?: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  defaultProbability: number;
  color: string;
  type: "open" | "won" | "lost";
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault: boolean;
}

export type DealForecastCategory = "Pipeline" | "Best Case" | "Commit" | "Closed Won";

export interface DealForecast {
  category: DealForecastCategory;
  value: number;
  deals: DealRecord[];
}

export interface DealForecastByMonth {
  month: string;
  pipeline: number;
  bestCase: number;
  commit: number;
  closedWon: number;
}

export interface DealStaleAlert {
  dealId: string;
  dealName: string;
  companyName: string;
  reason: string;
  daysSinceActivity: number;
  recommendedAction: string;
}

export interface DealFormData {
  name: string;
  companyId?: string;
  companyName: string;
  primaryContactId?: string;
  primaryContactName?: string;
  pipelineId?: string;
  pipelineName?: string;
  stageId?: string;
  stageName?: string;
  value?: string;
  currency?: string;
  probability?: string;
  expectedCloseDate?: string;
  ownerId?: string;
  ownerName?: string;
  source?: LeadSourceOption;
  description?: string;
  tags?: string;
  products?: DealProduct[];
}

export interface DealEditFormData {
  name: string;
  value: string;
  currency: string;
  probability: string;
  expectedCloseDate: string;
  stageId: string;
  ownerId: string;
  ownerName: string;
  description: string;
  tags: string;
  source: LeadSourceOption;
  products: DealProduct[];
}

export interface CompanyProject {
  id: string;
  name: string;
  status: "Active" | "On Hold" | "Completed";
  value: number;
  startedAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: TaskPriority;
  createdAt: string;
}

export interface AccountHealthFactor {
  label: string;
  value: string;
  tone: "good" | "medium" | "low";
}

export interface AccountHealth {
  score: number;
  status: "Healthy" | "At Risk";
  factors: AccountHealthFactor[];
}

/* ------------------------- STEP 06 — Activities ------------------------- */

export type TaskType =
  | "Call"
  | "Email"
  | "WhatsApp"
  | "Meeting"
  | "Follow-up"
  | "Demo"
  | "Proposal"
  | "Internal"
  | "Other";

export type TaskStatus = "Open" | "In Progress" | "Completed" | "Cancelled";

export type TaskPriorityLevel = "Low" | "Medium" | "High" | "Urgent";

export type RelatedRecordType = "Lead" | "Contact" | "Company" | "Deal";

export interface CrmTask {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriorityLevel;
  status: TaskStatus;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  dueTime?: string;
  relatedType: RelatedRecordType;
  relatedId?: string;
  relatedName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CalendarActivity extends CrmTask {
  kind: "task" | "meeting" | "call" | "follow-up";
}

export type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type MeetingType =
  | "Discovery"
  | "Product Demo"
  | "Follow-up"
  | "Negotiation"
  | "Contract Signing"
  | "Internal"
  | "Kickoff"
  | "Check-in";

export type CallDirection = "Inbound" | "Outbound";

export type CallOutcome =
  | "Connected"
  | "No Answer"
  | "Voicemail"
  | "Busy"
  | "Follow-up Needed";

export interface MeetingParticipant {
  id: string;
  name: string;
  email?: string;
}

export interface CrmMeeting {
  id: string;
  title: string;
  meetingType: MeetingType;
  date: string;
  time: string;
  duration: number;
  ownerId: string;
  ownerName: string;
  participants: MeetingParticipant[];
  relatedDealId?: string;
  relatedDealName?: string;
  relatedContactId?: string;
  relatedContactName?: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
  outcome?: string;
  actionItems?: string[];
  status: MeetingStatus;
  createdAt: string;
  aiSummary?: AiMeetingSummary;
}

export interface AiMeetingSummary {
  keyDiscussion: string[];
  customerRequirements: string[];
  objections: string[];
  actionItems: string[];
  followUpRecommendation: string;
}

export interface CallRecord {
  id: string;
  contactId?: string;
  contactName?: string;
  companyId?: string;
  companyName?: string;
  relatedDealId?: string;
  relatedDealName?: string;
  direction: CallDirection;
  duration?: number;
  date: string;
  time: string;
  ownerId: string;
  ownerName: string;
  outcome: CallOutcome;
  notes?: string;
}

/* ----------------------- STEP 07 — Unified Inbox ------------------------ */

export type InboxChannel = "Email" | "WhatsApp" | "SMS" | "Call";

export interface Conversation {
  id: string;
  channel: InboxChannel;
  contactId?: string;
  contactName: string;
  contactAvatar?: string;
  companyId?: string;
  companyName?: string;
  subject?: string;
  preview: string;
  lastMessageAt: string;
  unreadCount: number;
  assignedToId?: string;
  assignedToName?: string;
  priority: TaskPriorityLevel;
  tags: string[];
  openDeals: string[];
  openDealValue?: number;
  status: "open" | "pending" | "closed";
}

export interface ThreadMessage {
  id: string;
  conversationId: string;
  direction: "in" | "out";
  authorName: string;
  authorEmail?: string;
  content: string;
  channel: InboxChannel;
  sentAt: string;
  status: "sent" | "delivered" | "opened" | "replied";
  attachment?: { name: string; size: string };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

/* ------------------------- STEP 08 — Sequences -------------------------- */

export type SequenceStatus = "Draft" | "Active" | "Paused" | "Archived";

export type SequenceStepType =
  | "Email"
  | "WhatsApp"
  | "SMS"
  | "Call Task"
  | "Manual Task"
  | "Wait";

export type SequenceStopEvent =
  | "Customer replies"
  | "Deal created"
  | "Meeting booked"
  | "Manually stopped";

export interface SequenceStep {
  id: string;
  sequenceId: string;
  title: string;
  type: SequenceStepType;
  delayDays: number;
  content?: string;
  order: number;
}

export interface CrmSequence {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  status: SequenceStatus;
  steps: SequenceStep[];
  enrollmentCount: number;
  replyRate: number;
  meetingsBooked: number;
  conversionRate: number;
  stopEvents: SequenceStopEvent[];
  createdAt: string;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  relatedType: "Lead" | "Contact";
  relatedId: string;
  relatedName: string;
  enrolledAt: string;
  currentStep: number;
  status: "Active" | "Paused" | "Replied" | "Stopped" | "Completed";
}

/* ----------------------- STEP 09 — Automations -------------------------- */

export type AutomationStatus = "Draft" | "Active" | "Paused";

export type AutomationTrigger =
  | "Lead Created"
  | "Lead Status Changed"
  | "Deal Created"
  | "Deal Stage Changed"
  | "Deal Won"
  | "Deal Lost"
  | "Task Overdue"
  | "Email Opened"
  | "Email Replied"
  | "Form Submitted"
  | "Quote Accepted"
  | "Invoice Overdue"
  | "Customer Inactive";

export type AutomationConditionField =
  | "Lead Score"
  | "Owner"
  | "Source"
  | "Deal Value"
  | "Stage"
  | "Country"
  | "Tags"
  | "Company"
  | "Product"
  | "Days Inactive";

export type AutomationActionType =
  | "Assign Owner"
  | "Change Status"
  | "Create Task"
  | "Send Email"
  | "Send WhatsApp"
  | "Add Tag"
  | "Remove Tag"
  | "Move Deal Stage"
  | "Add to Sequence"
  | "Create Notification"
  | "Update Field";

export interface AutomationCondition {
  id: string;
  field: AutomationConditionField;
  operator: ">" | "<" | "=" | "!=" | "contains" | "not contains";
  value: string;
}

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  target: string;
  value: string;
}

export interface CrmAutomation {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  runsCount: number;
  lastRunAt?: string;
  createdAt: string;
}

export interface CrmAutomation {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  runsCount: number;
  lastRunAt?: string;
  createdAt: string;
}

/* --------------------------- STEP 52 — Automation Engine Types -------------------------- */

export type AutomationRunStatus = "running" | "success" | "partial" | "failed" | "skipped";

export type AutomationJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface AutomationRun {
  id: string;
  organization_id: string;
  automation_id: string;
  trigger_event: string;
  trigger_record_type: "lead" | "deal" | "contact" | "task" | "invoice" | "other";
  trigger_record_id: string;
  status: AutomationRunStatus;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  run_id_text: string;
}

export interface AutomationRunStep {
  id: string;
  run_id: string;
  action_type: string;
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  input_payload: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}

export interface AutomationJob {
  id: string;
  organization_id: string;
  automation_id: string;
  run_id?: string;
  action_id?: string;
  execute_at: string;
  status: AutomationJobStatus;
  attempt_count: number;
  max_attempts: number;
  last_error?: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  organization_id: string;
  user_id: string;
  event_type: string;
  in_app: boolean;
  email: boolean;
  push: boolean;
}

/* ---------------------- STEP 11 — Products & Services ------------------- */

export type ProductType = "Product" | "Service" | "Subscription";

export interface CrmProduct {
  id: string;
  name: string;
  sku: string;
  type: ProductType;
  category: string;
  description?: string;
  unitPrice: number;
  currency: string;
  taxRate: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

/* --------------------------- STEP 12 — Quotes --------------------------- */

export type QuoteStatus =
  | "Draft"
  | "Sent"
  | "Viewed"
  | "Accepted"
  | "Rejected"
  | "Expired";

export interface QuoteLineItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface QuoteRecord {
  id: string;
  number: string;
  customerId?: string;
  customerName: string;
  companyId?: string;
  companyName?: string;
  dealId?: string;
  dealName?: string;
  issueDate: string;
  expiryDate: string;
  currency: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  terms?: string;
  notes?: string;
  createdAt: string;
  timeline: TimelineEvent[];
}

export interface Proposal {
  id: string;
  name: string;
  customerName: string;
  issueDate: string;
  expiryDate: string;
  status: QuoteStatus;
  terms: string;
  notes: string;
  timeline: { event: string; at: string }[];
}

export interface TimelineEvent {
  id: string;
  event: string;
  at: string;
  actor?: string;
  detail?: string;
}

/* ------------------------- STEP 13 — Proposals -------------------------- */

export type ProposalStatus =
  | "Draft"
  | "Sent"
  | "Viewed"
  | "Accepted"
  | "Rejected";

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ProposalRecord {
  id: string;
  name: string;
  number: string;
  dealId?: string;
  dealName?: string;
  customerId?: string;
  customerName: string;
  companyId?: string;
  companyName: string;
  status: ProposalStatus;
  sections: ProposalSection[];
  value: number;
  currency: string;
  terms?: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  viewCount?: number;
  timeline: TimelineEvent[];
}

/* ----------------------- STEP 14 — Invoices + Payments ------------------ */

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Partial"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export interface InvoiceLineItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  subtotal: number;
}

export interface InvoiceRecord {
  id: string;
  number: string;
  customerId?: string;
  customerName: string;
  companyId?: string;
  companyName: string;
  dealId?: string;
  dealName?: string;
  quoteId?: string;
  quoteNumber?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod =
  | "Bank Transfer"
  | "Card"
  | "Cash"
  | "PayPal"
  | "Stripe"
  | "Other";

export type PaymentStatus = "Completed" | "Pending" | "Failed" | "Refunded";

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  date: string;
  status: PaymentStatus;
  reference?: string;
}

export interface CrmInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface CrmInvoice {
  id: string;
  number: string;
  customerName: string;
  companyId: string;
  dealId: string;
  dealName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Refunded";
  paymentMethod: string | null;
  terms: string;
  notes: string;
  lineItems: CrmInvoiceLineItem[];
  timeline: { event: string; at: string }[];
}

/* ----------------------- STEP 15 — Projects ----------------------------- */

export type ProjectStatus =
  | "Active"
  | "Not Started"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export type ProjectMilestoneName =
  | "Kickoff"
  | "Configuration"
  | "Implementation"
  | "Training"
  | "Go Live"
  | "Review";

export interface ProjectMilestone {
  id: string;
  name: ProjectMilestoneName;
  dueDate: string;
  status: "Pending" | "In Progress" | "Done";
}

export interface ProjectTask {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Done";
  assignee?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  customerId?: string;
  customerName: string;
  companyId?: string;
  companyName: string;
  sourceDealId?: string;
  sourceDealName?: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  targetDate: string;
  budget: number;
  currency: string;
  status: ProjectStatus;
  progress: number;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  notes?: string;
  createdAt: string;
}

/* ----------------------- STEP 16 — Support Tickets ---------------------- */

export type TicketStatus = "New" | "Open" | "Waiting" | "Resolved" | "Closed";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketCategory =
  | "Technical"
  | "Billing"
  | "Product"
  | "Implementation"
  | "General";

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
  at: string;
  internal: boolean;
}

export interface SupportTicketRecord {
  id: string;
  number: string;
  subject: string;
  customerId?: string;
  customerName?: string;
  companyId?: string;
  companyName?: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  ownerId: string;
  ownerName: string;
  created: string;
  lastUpdate: string;
  conversation: TicketMessage[];
  notes?: string;
}

/* ------------------------ STEP 17 — Customer Success -------------------- */

export type HealthState = "Healthy" | "Needs Attention" | "At Risk" | "Critical";

export interface CustomerSuccessRecord {
  id: string;
  customerName: string;
  companyId?: string;
  companyName: string;
  healthScore: number;
  healthStatus: HealthState;
  revenue: number;
  currency: string;
  openProjects: number;
  supportTickets: number;
  lastActivityAt: string;
  renewalDate?: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  ownerId: string;
  ownerName: string;
  engagement: number;
  paymentHistory: number;
  productUsage: number;
  sentiment: number;
  nextBestAction?: string;
  upsellOpportunity?: string;
  crossSellOpportunity?: string;
}

/* --------------------------- STEP 18 — Marketing ------------------------ */

export type CampaignType =
  | "Email"
  | "Social"
  | "Paid Ads"
  | "Event"
  | "Webinar"
  | "Referral"
  | "Other";

export type CampaignStatus = "Draft" | "Active" | "Completed" | "Paused";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  budget: number;
  leadsGenerated: number;
  opportunities: number;
  revenue: number;
  currency: string;
}

export type FormFieldType = "Text" | "Email" | "Phone" | "Dropdown" | "Checkbox" | "Textarea";

export interface CrmFormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface CrmForm {
  id: string;
  name: string;
  description?: string;
  fields: CrmFormField[];
  submissions: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface LandingPage {
  id: string;
  name: string;
  url: string;
  status: "Active" | "Draft" | "Inactive";
  views: number;
  conversions: number;
  conversionRate: number;
  createdAt: string;
}

export interface MarketingSource {
  id: string;
  name: string;
  type: string;
  leads: number;
  conversionRate: number;
  cost?: number;
  status: "Active" | "Paused";
}

/* -------------------------- STEP 20 — Forecast -------------------------- */

export interface ForecastRecord {
  id: string;
  period: string;
  ownerId: string;
  ownerName: string;
  pipeline: number;
  weightedPipeline: number;
  bestCase: number;
  commit: number;
  closedWon: number;
  target: number;
  currency: string;
}

/* ------------------------- STEP 21 — Notifications ---------------------- */

export type NotificationType =
  | "Task Due"
  | "Task Overdue"
  | "Lead Assigned"
  | "Deal Stage Changed"
  | "Proposal Viewed"
  | "Quote Accepted"
  | "Invoice Overdue"
  | "Meeting Reminder"
  | "AI Alert"
  | "Support Ticket";

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  at: string;
  read: boolean;
  link?: string;
  entityId?: string;
}

/* ---------------------- STEP 24 — Data Quality -------------------------- */

export type DataIssueType =
  | "Duplicate Contacts"
  | "Duplicate Companies"
  | "Missing Emails"
  | "Invalid Phone Numbers"
  | "Incomplete Records"
  | "Stale Records";

export interface DataIssue {
  id: string;
  metric: string;
  issue: string;
  severity: "Low" | "Medium" | "High";
  resolved: boolean;
}

/* --------------------- STEP 25-28 — Settings & System ------------------- */

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: "Active" | "Inactive";
}

export interface PermissionMatrix {
  role: string;
  permissions: Record<string, string[]>;
}

export interface PipelineSetting {
  id: string;
  name: string;
  stages: Array<{ id: string; name: string; order: number; probability: number }>;
  isDefault: boolean;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  object: string;
  oldValue?: string;
  newValue?: string;
  date: string;
  ip: string;
}

export interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  status: "Not Connected" | "Connected" | "Coming Soon";
  connectedAt?: string;
  color: string;
}

export interface ApiKey {
  id: string;
  name: string;
  created: string;
  lastUsed?: string;
  status: "Active" | "Revoked";
}

export interface WebhookEndpoint {
  id: string;
  endpoint: string;
  events: string[];
  status: "Active" | "Paused" | "Failing";
}

/* ------------------------ STEP 30 — Customer Portal ---------------------- */

export interface PortalMetric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  trend: "up" | "down";
}

export interface PortalActivity {
  id: string;
  customerName: string;
  action: string;
  channel: "Portal" | "Email" | "Support";
  at: string;
}

/* ------------------------- STEP 31 — Subscriptions ---------------------- */

export type SubscriptionStatus = "Active" | "Trial" | "Past Due" | "Cancelled" | "Expired";

export type BillingCycle = "Monthly" | "Quarterly" | "Yearly";

export interface SubscriptionRecord {
  id: string;
  customerId?: string;
  customerName: string;
  companyId?: string;
  companyName: string;
  plan: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  renewalDate: string;
  status: SubscriptionStatus;
}

/* --------------------------- STEP 32-34 — AI ---------------------------- */

export type AgentType = "Lead" | "Sales" | "Customer Success" | "Support" | "Finance";

export type AgentStatus = "Active" | "Paused" | "Archived" | "Error";

export type ApprovalMode = "Draft Only" | "Ask Before Action" | "Auto-Execute Allowed Actions";

export interface AiAgentPermission {
  object: string;
  level: "Read" | "Read + Write" | "Execute";
}

export interface AiAgent {
  id: string;
  name: string;
  type: AgentType;
  purpose: string;
  status: AgentStatus;
  actionsToday: number;
  pendingApprovals: number;
  permissions: AiAgentPermission[];
  approvalMode: ApprovalMode;
  lastActivity?: string;
}

export type RiskLevel = "Low" | "Medium" | "High";

export interface ApprovalRequest {
  id: string;
  action: string;
  summary: string;
  reasoning: string;
  expectedOutcome: string;
  riskLevel: RiskLevel;
  requestedBy: string;
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected";
}

export type AiInsightKind =
  | "Revenue Opportunity"
  | "At-Risk Deals"
  | "Inactive Customers"
  | "Sales Bottleneck"
  | "High-Performing Source"
  | "Team Performance";

export interface AiInsight {
  id: string;
  kind: AiInsightKind;
  headline: string;
  detail: string;
  impact: string;
  action: string;
  actionLabel: string;
}

/* --------------------------- STEP 35-37 — CLV & Goals ------------------- */

export interface ClvMetrics {
  lifetimeRevenue: number;
  averageDeal: number;
  purchaseFrequency: number;
  customerSince: string;
  projectedClv: number;
  currency: string;
}

export type GoalType = "Revenue" | "Deals Won" | "New Leads" | "Meetings" | "Calls";

export type GoalPeriod = "Monthly" | "Quarterly" | "Annual";

export interface SalesGoal {
  id: string;
  type: GoalType;
  ownerId: string;
  ownerName: string;
  team?: string;
  period: GoalPeriod;
  target: number;
  current: number;
  currency?: string;
}

/* ---------------------- STEP 41 — Unified Timeline ---------------------- */

export type UnifiedTimelineEvent =
  | { activity: { type: string; title: string; detail?: string; at: string; actor?: string } }
  | { event: TimelineEvent };

/** Marker type so future shared activity feeds can be composed without friction. */
export interface ActivityFeedItem {
  id: string;
  at: string;
  actor?: string;
  kind: string;
  title: string;
  detail?: string;
  relatedType?: "Lead" | "Contact" | "Company" | "Deal" | "Quote" | "Invoice" | "Project" | "Ticket";
  relatedId?: string;
}

/* ---------------------- MISSING TYPE EXPORTS (added for TypeScript validation) ---------------------- */

export interface CrmCustomerSuccess {
  id: string;
  customerId: string;
  customerName: string;
  contactId: string;
  contactName: string;
  managerId: string;
  managerName: string;
  quarterlyBusinessReviewDate: string;
  nextRenewalDate: string;
  healthScore: number;
  trend: "up" | "stable" | "down";
  quarterlyRevenue: number;
  upsellOpportunity: string;
  churnRisk: "Low" | "Medium" | "High";
  csatScore: number;
  ticketsThisQuarter: number;
  resolutionRate: number;
  upsellValue: number;
}

export interface CustomerHealthScore {
  customerId: string;
  customerName: string;
  healthScore: number;
  trend: "up" | "stable" | "down";
  lastActivity: string;
  quarterlyRevenue: number;
  renewalDate: string;
  riskLevel: "Low" | "Medium" | "High";
  ownerId: string;
  ownerName: string;
}

export interface DataQualityMetric {
  metric: string;
  score: number;
  issues: string[];
  totalContacts?: number;
  completeContacts?: number;
  totalDeals?: number;
  completeDeals?: number;
  totalPipelineValue?: number;
  coveredPipeline?: number;
  lastUpdate?: string;
  totalRecords?: number;
  uniqueRecords?: number;
}

export interface ForecastData {
  id: string;
  period: ForecastPeriod;
  name: string;
  confidence: number;
  month?: string;
  actualRevenue?: number;
  forecastedRevenue?: number;
  variance?: number;
  topContributors?: string[];
  quarter?: string;
  forecastedPipeline?: number;
  topDeals?: string[];
  year?: number;
  actualRevenuePreviousYear?: number;
  growthRate?: number;
}

export type ForecastPeriod = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  category: SettingCategory;
  type: string;
  options?: string[];
  description?: string;
}

export type SettingCategory = "General" | "Security" | "Notifications" | "Integrations" | "Appearance";

export interface CrmSupportTicket {
  id: string;
  title: string;
  description: string;
  customerName: string;
  companyId: string;
  dealId: string;
  dealName: string;
  ownerId: string;
  ownerName: string;
  team: string;
  status: SupportStatus;
  priority: TicketPriority;
  tags: string[];
  source: string;
  channel: string;
  relatedTicketId: string | null;
  relatedDealId: string;
  relatedContactId: string;
  relatedContactName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  slaDue: string;
  slaMet: boolean;
  notes: string;
  activityLog: { at: string; action: string; author: string }[];
}

export type SupportStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export type SupportPriority = TicketPriority;

export interface CrmProject {
  id: string;
  name: string;
  description: string;
  customerName: string;
  companyId: string;
  dealId: string;
  dealName: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate: string | null;
  status: ProjectStatus;
  budget: number;
  spent: number;
  progress: number;
  tags: string[];
  contactId: string;
  contactName: string;
}

export type ReportType = "Win Loss" | "Pipeline" | "Forecast" | "Activity" | "Revenue";

export interface ReportData {
  id: string;
  type: ReportType;
  name: string;
  period: string;
  createdAt?: string;
  winRate?: number;
  totalOpportunities?: number;
  won?: number;
  lost?: number;
  totalPipelineValue?: number;
  weightedPipeline?: number;
  opportunities?: number;
  forecastedRevenue?: number;
  confidenceLevel?: number;
  adjustedForecast?: number;
  totalActivities?: number;
  completedActivities?: number;
  openActivities?: number;
  totalRevenue?: number;
  revenueByRegion?: { region: string; revenue: number }[];
}

export interface WinLossData {
  won: number;
  lost: number;
  total: number;
  winRate: number;
}