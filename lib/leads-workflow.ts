import type { LeadStatus } from "@/lib/types";

export type LeadWorkflowStepState = "completed" | "current" | "upcoming";

export interface LeadNextStepState {
  currentStage: LeadStatus;
  completedSteps: string[];
  nextStep: string;
  title: string;
  description: string;
  primaryAction: string;
  blockedReason?: string;
  aiAvailable: boolean;
  progress: Array<{ label: string; state: LeadWorkflowStepState }>;
}

export function getLeadNextStep(currentStage: LeadStatus): LeadNextStepState {
  switch (currentStage) {
    case "New":
      return {
        currentStage: "New",
        completedSteps: ["Lead Created"],
        nextStep: "CONTACT_CUSTOMER",
        title: "Contact Customer",
        description:
          "Contact this lead and record the interaction before continuing to qualification.",
        primaryAction: "Log Contact",
        aiAvailable: false,
        progress: [
          { label: "Lead Created", state: "completed" },
          { label: "Contact Customer", state: "current" },
          { label: "Qualification", state: "upcoming" },
          { label: "Convert to Opportunity", state: "upcoming" },
        ],
      };
    case "Contacted":
      return {
        currentStage: "Contacted",
        completedSteps: ["Lead Created", "Contacted"],
        nextStep: "QUALIFY_LEAD",
        title: "Qualify Lead",
        description:
          "Review the customer's need, budget, authority, and timeline.",
        primaryAction: "Start Qualification",
        aiAvailable: true,
        progress: [
          { label: "Lead Created", state: "completed" },
          { label: "Contacted", state: "completed" },
          { label: "Qualify Lead", state: "current" },
          { label: "Convert to Opportunity", state: "upcoming" },
        ],
      };
    case "Qualified":
      return {
        currentStage: "Qualified",
        completedSteps: ["Lead Created", "Contacted", "Qualified"],
        nextStep: "CONVERT_TO_OPPORTUNITY",
        title: "Convert to Opportunity",
        description:
          "This Lead is qualified and ready to become a sales Opportunity.",
        primaryAction: "Convert to Opportunity",
        aiAvailable: true,
        progress: [
          { label: "Lead Created", state: "completed" },
          { label: "Contacted", state: "completed" },
          { label: "Qualified", state: "completed" },
          { label: "Convert to Opportunity", state: "current" },
        ],
      };
    case "Unqualified":
      return {
        currentStage: "Unqualified",
        completedSteps: ["Lead Created", "Closed — Unqualified"],
        nextStep: "NONE",
        title: "Lead Closed — Unqualified",
        description: "This lead is no longer active in the sales pipeline.",
        primaryAction: "No next action",
        aiAvailable: false,
        progress: [
          { label: "Lead Created", state: "completed" },
          { label: "Closed — Unqualified", state: "completed" },
          { label: "Next sales action", state: "upcoming" },
        ],
      };
    default:
      return {
        currentStage: "New",
        completedSteps: ["Lead Created"],
        nextStep: "CONTACT_CUSTOMER",
        title: "Contact Customer",
        description: "Contact this lead and record the interaction before continuing to qualification.",
        primaryAction: "Log Contact",
        aiAvailable: false,
        progress: [
          { label: "Lead Created", state: "completed" },
          { label: "Contact Customer", state: "current" },
          { label: "Qualification", state: "upcoming" },
          { label: "Convert to Opportunity", state: "upcoming" },
        ],
      };
  }
}

function matchesStageName(stageName: string | undefined, ...aliases: string[]) {
  const normalized = (stageName ?? "").toLowerCase().replace(/[_-]+/g, " ").trim();
  return aliases.some((alias) => normalized.includes(alias.toLowerCase()));
}

export function getOpportunityNextStep(
  stageName?: string,
  meetingStatus?: string,
  followUpResponse?: string,
  nextFollowUpDate?: string
): LeadNextStepState {
  const normalized = (stageName ?? "New Opportunity").toLowerCase();
  const status = (meetingStatus ?? "none").toLowerCase();
  const followUpReason = (followUpResponse ?? "").toLowerCase();
  const hasFollowUpDate = Boolean(nextFollowUpDate);

  if (matchesStageName(stageName, "closed won")) {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Done", "Proposal Submitted", "Negotiation", "Closed Won"],
      nextStep: "COMPLETED",
      title: "Completed",
      description: "The opportunity has been successfully closed as won.",
      primaryAction: "Completed",
      aiAvailable: false,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Done", state: "completed" },
        { label: "Proposal Submitted", state: "completed" },
        { label: "Negotiation", state: "completed" },
        { label: "Closed Won", state: "completed" },
      ],
    };
  }

  if (matchesStageName(stageName, "closed lost")) {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Done", "Proposal Submitted", "Negotiation", "Closed Lost"],
      nextStep: "COMPLETED",
      title: "Completed",
      description: "The opportunity has been closed as lost.",
      primaryAction: "Completed",
      aiAvailable: false,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Done", state: "completed" },
        { label: "Proposal Submitted", state: "completed" },
        { label: "Negotiation", state: "completed" },
        { label: "Closed Lost", state: "completed" },
      ],
    };
  }

  if (matchesStageName(stageName, "negotiation")) {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Done", "Proposal Submitted", "Negotiation"],
      nextStep: "CONTINUE_NEGOTIATION",
      title: "Continue Negotiation",
      description: "The customer is actively negotiating. Log the activity, review closing readiness, and close the opportunity when approved.",
      primaryAction: "Log Negotiation",
      aiAvailable: true,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Done", state: "completed" },
        { label: "Proposal Submitted", state: "completed" },
        { label: "Negotiation", state: "current" },
        { label: "Closed", state: "upcoming" },
      ],
    };
  }

  if (matchesStageName(stageName, "proposal submitted", "proposal submitted stage", "proposal_submitted", "proposal sent", "proposal sent submitted")) {
    if (followUpReason && followUpReason.includes("interested")) {
      return {
        currentStage: "Qualified",
        completedSteps: ["Opportunity Created", "Meeting Done", "Proposal Submitted", "Customer Follow-Up"],
        nextStep: "NEGOTIATION",
        title: "Negotiation",
        description: "The customer is interested and ready to continue in negotiation.",
        primaryAction: "Approve & Continue",
        aiAvailable: true,
        progress: [
          { label: "Opportunity Created", state: "completed" },
          { label: "Meeting Done", state: "completed" },
          { label: "Proposal Submitted", state: "completed" },
          { label: "Negotiation", state: "current" },
          { label: "Closed", state: "upcoming" },
        ],
      };
    }

    if (followUpReason && (followUpReason.includes("needs more time") || followUpReason.includes("decision pending") || followUpReason.includes("no response"))) {
      return {
        currentStage: "Qualified",
        completedSteps: ["Opportunity Created", "Meeting Done", "Proposal Submitted"],
        nextStep: hasFollowUpDate ? "FOLLOW_UP_AGAIN" : "FOLLOW_UP",
        title: hasFollowUpDate ? "Follow Up Again" : "Follow Up",
        description: "The customer needs more time or has not responded yet. Schedule the next follow-up and keep the opportunity moving.",
        primaryAction: hasFollowUpDate ? "Log Follow Up" : "Log Follow Up",
        aiAvailable: true,
        progress: [
          { label: "Opportunity Created", state: "completed" },
          { label: "Meeting Done", state: "completed" },
          { label: "Proposal Submitted", state: "completed" },
          { label: "Follow Up", state: "current" },
          { label: "Negotiation", state: "upcoming" },
        ],
      };
    }

    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Done", "Proposal Submitted"],
      nextStep: "FOLLOW_UP",
      title: "Follow Up",
      description: "The Proposal has been submitted. Follow up with the customer and record their response.",
      primaryAction: "Log Follow Up",
      aiAvailable: true,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Done", state: "completed" },
        { label: "Proposal Submitted", state: "completed" },
        { label: "Negotiation", state: "upcoming" },
        { label: "Closed", state: "upcoming" },
      ],
    };
  }

  if (matchesStageName(stageName, "proposal submitted", "proposal submitted stage", "proposal_submitted", "proposal sent", "proposal sent submitted")) {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Done", "Proposal Submitted"],
      nextStep: "FOLLOW_UP",
      title: "Follow Up",
      description: "The Proposal has been submitted. Follow up with the customer and record their response.",
      primaryAction: "Log Follow Up",
      aiAvailable: true,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Done", state: "completed" },
        { label: "Proposal Submitted", state: "completed" },
        { label: "Negotiation", state: "upcoming" },
        { label: "Closed", state: "upcoming" },
      ],
    };
  }

  if (matchesStageName(stageName, "meeting done", "meeting_done", "meeting completed", "meeting complete", "meeting finished", "completed meeting")) {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Done"],
      nextStep: "PREPARE_PROPOSAL",
      title: "Prepare Proposal",
      description: "The customer meeting is complete. Prepare and review a proposal for this Opportunity.",
      primaryAction: "Prepare Proposal",
      aiAvailable: false,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Done", state: "completed" },
        { label: "Proposal", state: "current" },
        { label: "Negotiation", state: "upcoming" },
        { label: "Closed", state: "upcoming" },
      ],
    };
  }

  if (status === "completed") {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Done"],
      nextStep: "PREPARE_PROPOSAL",
      title: "Prepare Proposal",
      description: "The customer meeting is complete. Prepare and review a proposal for this Opportunity.",
      primaryAction: "Prepare Proposal",
      aiAvailable: false,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Done", state: "completed" },
        { label: "Proposal", state: "current" },
        { label: "Negotiation", state: "upcoming" },
        { label: "Closed", state: "upcoming" },
      ],
    };
  }

  if (status === "scheduled" || status === "in_progress") {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created", "Meeting Scheduled"],
      nextStep: "COMPLETE_MEETING",
      title: "Complete Meeting",
      description: "A customer meeting is scheduled. Complete and record the meeting before moving this Opportunity forward.",
      primaryAction: "Mark Meeting Complete",
      aiAvailable: true,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting Scheduled", state: "completed" },
        { label: "Complete Meeting", state: "current" },
        { label: "Proposal", state: "upcoming" },
        { label: "Negotiation", state: "upcoming" },
        { label: "Closed", state: "upcoming" },
      ],
    };
  }

  if (normalized.includes("new") || normalized === "new opportunity") {
    return {
      currentStage: "Qualified",
      completedSteps: ["Opportunity Created"],
      nextStep: "SCHEDULE_MEETING",
      title: "Schedule Meeting",
      description: "This Opportunity is ready for customer discovery. Schedule a meeting with the customer to continue the sales process.",
      primaryAction: "Schedule Meeting",
      aiAvailable: false,
      progress: [
        { label: "Opportunity Created", state: "completed" },
        { label: "Meeting", state: "current" },
        { label: "Proposal Submitted", state: "upcoming" },
        { label: "Negotiation", state: "upcoming" },
        { label: "Closed", state: "upcoming" },
      ],
    };
  }

  return {
    currentStage: "Qualified",
    completedSteps: ["Opportunity Created"],
    nextStep: "SCHEDULE_MEETING",
    title: "Schedule Meeting",
    description: "This Opportunity is ready for customer discovery. Schedule a meeting with the customer to continue the sales process.",
    primaryAction: "Schedule Meeting",
    aiAvailable: false,
    progress: [
      { label: "Opportunity Created", state: "completed" },
      { label: "Meeting", state: "current" },
      { label: "Proposal Submitted", state: "upcoming" },
      { label: "Negotiation", state: "upcoming" },
      { label: "Closed", state: "upcoming" },
    ],
  };
}
