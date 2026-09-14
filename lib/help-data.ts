export type HelpCategory = "Getting Started" | "Sales & Pipeline" | "Communication" | "Automation & AI" | "Billing & Revenue" | "Account & Settings";

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  category: HelpCategory;
  description: string;
  readTime: string;
}

export const helpArticles: HelpArticle[] = [
  {
    id: "1",
    slug: "how-to-create-and-manage-leads",
    title: "How to Create and Manage Leads",
    category: "Getting Started",
    description: "Learn the basics of lead management in the CRM.",
    readTime: "5 min read",
  },
  {
    id: "2",
    slug: "how-to-convert-a-lead-into-a-deal",
    title: "How to Convert a Lead into a Deal",
    category: "Getting Started",
    description: "Step-by-step guide to moving from lead to deal.",
    readTime: "3 min read",
  },
  {
    id: "3",
    slug: "understanding-the-sales-pipeline",
    title: "Understanding the Sales Pipeline",
    category: "Sales & Pipeline",
    description: "How pipeline stages work and how to manage deals.",
    readTime: "4 min read",
  },
  {
    id: "4",
    slug: "how-deal-health-works",
    title: "How Deal Health Works",
    category: "Sales & Pipeline",
    description: "Understanding deal health scores and signals.",
    readTime: "3 min read",
  },
  {
    id: "5",
    slug: "how-to-use-ai-agents",
    title: "How to Use AI Agents",
    category: "Automation & AI",
    description: "Deploy autonomous agents for lead ops, sales, customer success and more.",
    readTime: "6 min read",
  },
  {
    id: "6",
    slug: "how-ai-approvals-work",
    title: "How AI Approvals Work",
    category: "Automation & AI",
    description: "Review and approve AI-proposed actions before they execute.",
    readTime: "4 min read",
  },
  {
    id: "7",
    slug: "creating-crm-automations",
    title: "Creating CRM Automations",
    category: "Automation & AI",
    description: "Set up automated workflows for repetitive tasks.",
    readTime: "5 min read",
  },
  {
    id: "8",
    slug: "creating-quotes-and-proposals",
    title: "Creating Quotes and Proposals",
    category: "Billing & Revenue",
    description: "Guide to creating and sending quotes and proposals.",
    readTime: "4 min read",
  },
  {
    id: "9",
    slug: "managing-tasks-and-meetings",
    title: "Managing Tasks and Meetings",
    category: "Communication",
    description: "Coordinate activities, meetings, and calls in one place.",
    readTime: "3 min read",
  },
  {
    id: "10",
    slug: "managing-users-and-permissions",
    title: "Managing Users and Permissions",
    category: "Account & Settings",
    description: "Add team members, set roles, and manage access.",
    readTime: "4 min read",
  },
];

export type FaqQuestion = 
  | "What is this CRM used for?"
  | "How do I add a new lead?"
  | "Can a lead be converted into a deal?"
  | "How do I move deals through the pipeline?"
  | "What are AI Agents?"
  | "Can AI Agents send messages automatically?"
  | "How does the AI Approval Center work?"
  | "Can I connect Gmail or Outlook?"
  | "Can I connect WhatsApp?"
  | "How are users and permissions managed?"
  | "Can I export CRM data?"
  | "Is my CRM data secure?";

export interface FaqItem {
  question: FaqQuestion;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "What is this CRM used for?",
    answer: "This CRM is used to manage leads, deals, contacts, companies, pipelines, automations, AI agents, support tickets, quotes, proposals, invoices, and more. It helps sales teams track deals, automate workflows, and collaborate effectively.",
  },
  {
    question: "How do I add a new lead?",
    answer: "To add a new lead, go to the Leads page and click ' + Create Lead'. Fill in the lead name, email, company, and source. You can also import leads from a CSV file or integrate with forms.",
  },
  {
    question: "Can a lead be converted into a deal?",
    answer: "Yes. When a lead is qualified, you can convert it into a deal. This will create a new deal with the lead's information populated, and you can then move it through your pipeline stages.",
  },
  {
    question: "How do I move deals through the pipeline?",
    answer: "To move a deal through the pipeline, go to the Deals or Pipeline page. Drag and drop the deal card to the next stage, or use the 'Move to' dropdown on the deal detail page. Each stage represents a step in your sales process.",
  },
  {
    question: "What are AI Agents?",
    answer: "AI Agents are autonomous agents that can research, draft, and complete busywork such as lead qualification, deal monitoring, customer health monitoring, invoice auditing, and support ticket prioritization. They can operate with 'Ask Before Action' or 'Draft Only' approval modes.",
  },
  {
    question: "Can AI Agents send messages automatically?",
    answer: "AI Agents can draft and recommend actions. Consequential actions such as sending customer messages, changing important deal stages, applying discounts, or sending invoices should require user approval unless explicitly permitted by organization settings.",
  },
  {
    question: "How does the AI Approval Center work?",
    answer: "The AI Approval Center allows you to review and approve AI-proposed actions before they execute. You can view pending approvals, approve or reject actions, and set global policies for which action types require approval.",
  },
  {
    question: "Can I connect Gmail or Outlook?",
    answer: "Yes. Go to Settings > Integrations > Email to connect Gmail or Outlook. Once connected, you can send and receive emails directly from the CRM, and all communication is logged against the relevant records.",
  },
  {
    question: "Can I connect WhatsApp?",
    answer: "Yes. Go to Settings > Integrations > WhatsApp to connect your WhatsApp Business account. You can then send WhatsApp messages to leads and contacts from the CRM.",
  },
  {
    question: "How are users and permissions managed?",
    answer: "Go to Settings > Users to add new team members, assign roles (Admin, Manager, Sales, Support), and set permissions. You can also invite users by email, and they'll receive a signup link.",
  },
  {
    question: "Can I export CRM data?",
    answer: "Yes. Go to Settings > Export Data to export leads, deals, contacts, companies, and other records as a CSV file. You can also configure export filters to include only the data you need.",
  },
  {
    question: "Is my CRM data secure?",
    answer: "Your CRM data is stored securely with encryption at rest and in transit. Role-based access controls ensure that users only have access to the data and functions appropriate for their role. See the Security & Permissions guide for more details.",
  },
];

export type SystemStatusKey = "CRM Platform" | "Database" | "Automation Engine" | "AI Services" | "Email Integration" | "WhatsApp Integration";

export type SystemStatusValue = "Operational" | "Degraded" | "Offline" | "Not Connected";

export interface SystemStatusItem {
  key: SystemStatusKey;
  status: SystemStatusValue;
}

export const systemStatusItems: SystemStatusItem[] = [
  { key: "CRM Platform", status: "Operational" },
  { key: "Database", status: "Operational" },
  { key: "Automation Engine", status: "Operational" },
  { key: "AI Services", status: "Operational" },
  { key: "Email Integration", status: "Not Connected" },
  { key: "WhatsApp Integration", status: "Not Connected" },
];

export type SupportCategory = 
  | "Technical Issue"
  | "Account"
  | "CRM Setup"
  | "Sales Module"
  | "Automation"
  | "AI"
  | "Billing"
  | "Integration"
  | "Other";

export type SupportPriority = "Low" | "Normal" | "High" | "Urgent";

export interface SupportRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  message: string;
  screenshot?: string;
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  reference: string;
}

export const initialSupportRequest: SupportRequest = {
  id: "SUP-1024",
  name: "",
  email: "",
  subject: "",
  category: "Technical Issue",
  priority: "Normal",
  message: "",
  status: "Open",
  createdAt: "2026-09-13T09:00:00.000Z",
  reference: "SUP-1024",
};

export type FeatureCategory = 
  | "Leads"
  | "Deals"
  | "Inbox"
  | "Automation"
  | "AI"
  | "Reports"
  | "Settings"
  | "Other";

export type FeaturePriority = "Nice to Have" | "Important" | "Critical";

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: FeatureCategory;
  priority: FeaturePriority;
  submittedAt: string;
  reference: string;
}

export const initialFeatureRequest: FeatureRequest = {
  id: "FR-2024-001",
  title: "",
  description: "",
  category: "Leads",
  priority: "Nice to Have",
  submittedAt: "2026-09-13T09:00:00.000Z",
  reference: "FR-2024-001",
};

export interface HelpArticleSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface HelpArticleBody {
  intro: string;
  lastUpdated: string;
  sections: HelpArticleSection[];
}

export const helpArticleBodies: Record<string, HelpArticleBody> = {
  "how-to-create-and-manage-leads": {
    intro:
      "This guide walks through creating, organizing, and managing leads in the CRM so you can keep your sales pipeline full and your data clean.",
    lastUpdated: "2026-08-20",
    sections: [
      {
        heading: "Creating a lead",
        body: "Navigate to the Leads page and click '+ Create Lead' in the top-right corner. Fill in the lead's name, email, and company, then select a source.",
        bullets: [
          "Leads with an email address can receive sequenced messages.",
          "You can assign an owner to route the lead to the right person.",
          "Required fields are marked with an asterisk.",
        ],
      },
      {
        heading: "Segmenting and filtering",
        body: "Use the search bar and filters on the Leads page to narrow results by status, source, owner, or score. Saved views let teams share the same list.",
      },
      {
        heading: "Converting a lead into a deal",
        body: "When a lead is qualified, open the lead detail page and choose 'Convert to Deal'. The CRM pre-fills the new deal with the lead's information.",
        bullets: [
          "The lead and deal remain linked so you can trace history.",
          "Conversion can trigger automations, such as moving the deal to a stage.",
        ],
      },
    ],
  },
  "how-to-convert-a-lead-into-a-deal": {
    intro:
      "Learn the step-by-step process for converting a qualified lead into a deal and keeping the two records connected.",
    lastUpdated: "2026-08-18",
    sections: [
      {
        heading: "When to convert",
        body: "Convert a lead when it is qualified and has a real potential deal value. Use the lead's score and your team's definition of 'qualified' as a guide.",
      },
      {
        heading: "The conversion process",
        body: "From the lead detail page, click 'Convert to Deal'. Review the mapped fields, assign an owner and pipeline stage, then confirm.",
        bullets: [
          "Deal value is copied from the lead by default.",
          "You can choose to copy notes and attachments.",
        ],
      },
    ],
  },
  "understanding-the-sales-pipeline": {
    intro:
      "The pipeline represents the stages a deal moves through from creation to closed. This article explains how stages and deal health work together.",
    lastUpdated: "2026-08-15",
    sections: [
      {
        heading: "Pipeline stages",
        body: "Stages are set under Settings > Pipeline. Common stages include New, Qualified, Proposal, Negotiation, and Closed Won/Lost. Drag deals between stages on the Pipeline page.",
      },
      {
        heading: "Deal health",
        body: "Each deal gets a health score based on its age, stage, recent activity, and signals. A red or amber score flags deals that need attention.",
      },
      {
        heading: "Forecasting",
        body: "Forecasting uses stage probabilities and deal value to project revenue. Keep deal values and stages current for accurate forecasts.",
        bullets: ["Close probability varies by stage.", "Deals stuck in a stage for too long lower the win-rate estimate."],
      },
    ],
  },
  "how-deal-health-works": {
    intro:
      "Deal health helps you find deals at risk early so you can act before they stall.",
    lastUpdated: "2026-08-12",
    sections: [
      {
        heading: "What affects health",
        body: "Health is calculated from deal age, stage duration, engagement, and upcoming tasks or meetings. A deal with no activity for weeks scores poorly.",
        bullets: ["Recent activity improves the score.", "Stale deals drop to amber or red."],
      },
      {
        heading: "Improving a deal's health",
        body: "Log calls and meetings, set the next task, and keep the stage accurate. AI Agents can flag at-risk deals and recommend the next action.",
      },
      {
        heading: "Where to see health",
        body: "Health indicators appear on the Pipeline page and on each deal detail page, alongside a summary of the signals that drive the score.",
      },
    ],
  },
  "how-to-use-ai-agents": {
    intro:
      "AI Agents automate repetitive work across sales, customer success, support, and finance. This guide explains how to deploy and supervise them.",
    lastUpdated: "2026-08-25",
    sections: [
      {
        heading: "Choosing an agent",
        body: "Go to AI > AI Agents to see the available agents, such as Lead Qualifier, Deal Navigator, Health Guardian, Invoice Auditor, and Support Copilot.",
        bullets: [
          "Each agent has a defined purpose and the objects it can read or write.",
          "You can configure permissions per object (Read, Read + Write, Execute).",
        ],
      },
      {
        heading: "Approval modes",
        body: "Set an agent to 'Ask Before Action' to require review, or 'Draft Only' to receive recommendations without execution. Approval mode and organization settings determine what can run automatically.",
      },
      {
        heading: "Reviewing actions",
        body: "AI-proposed actions appear in the Approval Center. Approve, reject, or adjust them before they execute. Review the activity log to understand what each agent has done.",
      },
    ],
  },
  "how-ai-approvals-work": {
    intro:
      "The AI Approval Center is where AI-proposed actions are reviewed before they take effect.",
    lastUpdated: "2026-08-22",
    sections: [
      {
        heading: "What needs approval",
        body: "Consequential actions such as sending customer messages, changing important deal stages, applying discounts, or sending invoices require approval unless explicitly permitted by organization settings.",
      },
      {
        heading: "Approving and rejecting",
        body: "Open the Approval Center, review each proposed action and its reasoning, then approve, reject, or ask for revision. Approved actions execute immediately.",
        bullets: ["You can approve many actions at once.", "Rejected actions are logged for audit."],
      },
      {
        heading: "Setting policies",
        body: "Admins can set global policies defining which action types always require approval. Policies apply across all agents.",
      },
    ],
  },
  "creating-crm-automations": {
    intro:
      "Automations remove repetitive manual work by triggering actions when conditions are met.",
    lastUpdated: "2026-08-10",
    sections: [
      {
        heading: "Building an automation",
        body: "Go to Automations and click '+ Create Automation'. Choose a trigger (such as a new lead or a stage change), add conditions, then add actions like creating a task or sending an email.",
        bullets: ["Triggers define when the automation runs.", "Conditions narrow which records match."],
      },
      {
        heading: "Best practices",
        body: "Start simple, test with a small set of records, and monitor the run log. Avoid actions that could create loops, such as updating a field that triggers another automation.",
      },
    ],
  },
  "creating-quotes-and-proposals": {
    intro:
      "Quotes and proposals turn your deals into shareable documents with products, pricing, and terms.",
    lastUpdated: "2026-08-08",
    sections: [
      {
        heading: "Creating a quote",
        body: "From a deal, choose '+ Create Quote'. Add products or custom line items, set quantities and discounts, then preview the document before sending.",
        bullets: ["Quotes pull product catalog pricing.", "Discounts can be set per line or on the total."],
      },
      {
        heading: "Sending and tracking",
        body: "Send the quote by email and track when it is viewed. When accepted, you can convert it into an invoice to begin billing.",
      },
    ],
  },
  "managing-tasks-and-meetings": {
    intro:
      "Keep your team coordinated by managing tasks, meetings, and calls against the right records.",
    lastUpdated: "2026-08-05",
    sections: [
      {
        heading: "Creating tasks",
        body: "Use the Tasks page to create to-dos assigned to an owner and linked to a lead, deal, or contact. Set a due date and priority so the work surfaces on the calendar.",
      },
      {
        heading: "Scheduling meetings",
        body: "Create meetings from the Calendar page and invite attendees by email. Meetings can be linked to deals so context stays together.",
        bullets: ["Meeting links are included for video calls.", "Past meetings can be logged to keep records current."],
      },
    ],
  },
  "managing-users-and-permissions": {
    intro:
      "Add your team, assign roles, and control access so everyone sees only what they need.",
    lastUpdated: "2026-08-01",
    sections: [
      {
        heading: "Inviting users",
        body: "Go to Settings > Users and click '+ Invite User'. Enter the email address and choose a role (Admin, Manager, Sales, or Support). Invited users receive a signup link.",
      },
      {
        heading: "Roles and permissions",
        body: "Roles bundle permissions across modules. Admins can manage all settings; Managers can configure pipelines and approvals; Sales and Support have access scoped to their records.",
        bullets: ["Roles are applied per team member.", "Permission changes take effect on the next refresh."],
      },
    ],
  },
};