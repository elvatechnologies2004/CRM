"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, Flag, MessageSquareText, Sparkles } from "lucide-react";

import {
  approveOpportunityNegotiationAction,
  approveOpportunityProposalSubmittedAction,
  closeOpportunityLostAction,
  closeOpportunityWonAction,
  completeOpportunityMeetingAction,
  createOpportunityFollowUpAction,
  createOpportunityMeetingAction,
  recordOpportunityNegotiationAction,
} from "@/app/opportunities/actions";
import { createQuoteAction, updateQuoteStatusAction } from "@/app/quotes/actions";
import {
  approveProposalAction,
  returnProposalForRevisionAction,
  submitProposalForApprovalAction,
  updateQuoteContentAction,
} from "@/app/quotes/actions";
import { Badge } from "@/components/ui/badge";
import { ExportDataDialog } from "@/components/exports/export-data-dialog";
import { RecordManagementMenu } from "@/components/crm/record-management-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getOpportunityNextStep } from "@/lib/leads-workflow";
import type { ProposalApprovalView } from "@/lib/revenue/quotes";
import { QUOTE_APPROVAL_LABELS, type DealRecord, type QuoteApprovalStatus } from "@/lib/types";

const meetingTypes = ["Discovery", "Demo", "Online Meeting", "On-Site Meeting", "Follow-Up", "Other"] as const;
const DEFAULT_TODAY = new Date().toISOString().slice(0, 10);
const DEFAULT_PROPOSAL_VALIDITY = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const DEFAULT_FOLLOW_UP_DATE = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

function safeText(value?: string | null) {
  if (!value || value === "undefined" || value === "null" || value === "Invalid Date") return "—";
  return value;
}

function formatDate(value?: string | null) {
  if (!value || value === "Invalid Date") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDateTime(date?: string | null, time?: string | null) {
  if (!date && !time) return "—";
  const d = date ? new Date(date) : new Date();
  if (Number.isNaN(d.getTime()) && !time) return "—";
  const datePart = date ? formatDate(date) : "—";
  return `${datePart} ${time || ""}`.trim();
}

function formatCurrency(value?: number | null, currency?: string) {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: currency || "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function stageVariant(stageName?: string) {
  if (stageName === "New Opportunity") return "secondary";
  if (stageName === "Meeting Done") return "info";
  return "outline";
}

interface OpportunityDetailClientProps {
  deal: DealRecord;
  lead?: { id?: string; full_name?: string | null; email?: string | null; phone?: string | null; company_name?: string | null; source?: string | null; expected_value?: number | null; owner_id?: string | null; created_at?: string | null; last_activity_at?: string | null } | null;
  meeting?: { id?: string; title?: string | null; meeting_type?: string | null; start_at?: string | null; end_at?: string | null; owner_id?: string | null; related_type?: string | null; related_id?: string | null; status?: string | null; notes?: string | null; outcome?: string | null; created_at?: string | null; created_by?: string | null } | null;
  activities?: Array<{ id: string; activity_type: string; title: string; description: string | null; occurred_at: string; actor_user_id?: string | null; metadata?: Record<string, unknown> }>;
  latestProposal?: ProposalApprovalView | null;
  viewer?: { userId: string; role: string; isRsm: boolean; isOrgWide: boolean } | null;
  canApproveProposal?: boolean;
}

type ProposalUiStatus = "draft" | "pending" | "approved" | "returned" | "sent";

const PROPOSAL_UI_LABELS: Record<ProposalUiStatus, string> = {
  draft: "Draft",
  pending: "Pending RSM Approval",
  approved: "Approved",
  returned: "Returned for Revision",
  sent: "Sent",
};

function initialProposalStatus(proposal: ProposalApprovalView | null | undefined): ProposalUiStatus {
  if (!proposal) return "draft";
  if (proposal.status === "Sent") return "sent";
  switch (proposal.approvalStatus) {
    case "approved":
      return "approved";
    case "pending_rsm_approval":
      return "pending";
    case "returned_for_revision":
      return "returned";
    default:
      return "draft";
  }
}

export function OpportunityDetailClient({
  deal,
  lead,
  meeting,
  activities = [],
  latestProposal = null,
  viewer = null,
  canApproveProposal = false,
}: OpportunityDetailClientProps) {
  const router = useRouter();
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalReviewOpen, setProposalReviewOpen] = useState(false);
  const [proposalSendOpen, setProposalSendOpen] = useState(false);
  const [proposalStageOpen, setProposalStageOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpReviewOpen, setFollowUpReviewOpen] = useState(false);
  const [followUpRecommendationOpen, setFollowUpRecommendationOpen] = useState(false);
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [negotiationReviewOpen, setNegotiationReviewOpen] = useState(false);
  const [wonOpen, setWonOpen] = useState(false);
  const [wonConfirmOpen, setWonConfirmOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [lostConfirmOpen, setLostConfirmOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(latestProposal?.id ?? null);
  const [proposalStatus, setProposalStatus] = useState<ProposalUiStatus>(() => initialProposalStatus(latestProposal));
  const [proposalRejectionReason, setProposalRejectionReason] = useState<string>(latestProposal?.rejectionReason ?? "");
  const [returnReasonOpen, setReturnReasonOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const customerName = lead?.full_name || `${deal.companyName || "Customer"}`;

  const [scheduleForm, setScheduleForm] = useState({
    customer: lead?.full_name || "",
    company: lead?.company_name || deal.companyName || "",
    primaryContact: lead?.full_name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    opportunity: deal.name,
    owner: deal.ownerName || "",
    meetingDate: "",
    meetingTime: "",
    duration: "30",
    meetingType: "Discovery" as (typeof meetingTypes)[number],
    agenda: "",
    notes: "",
  });
  const [completeForm, setCompleteForm] = useState({
    notes: "",
    outcome: "",
    customerRequirements: "",
    objections: "",
    budgetDiscussed: "",
    timeline: "",
    nextActions: "",
  });
  const [proposalForm, setProposalForm] = useState({
    title: `Proposal for ${deal.name || "Opportunity"}`,
    proposalDate: DEFAULT_TODAY,
    validityDate: DEFAULT_PROPOSAL_VALIDITY,
    customer: customerName,
    company: deal.companyName || lead?.company_name || "",
    opportunity: deal.name,
    email: lead?.email || "",
    phone: lead?.phone || "",
    owner: deal.ownerName || "",
    opportunityValue: deal.value || 0,
    requirements: completeForm.customerRequirements || "",
    solution: "",
    scope: "",
    deliverables: "",
    timeline: completeForm.timeline || "",
    paymentTerms: "Net 30",
    implementationTimeline: "30-45 days",
    validity: "30 days",
    terms: "Standard terms and conditions apply.",
    internalNotes: "",
    customerNotes: "",
    deliveryMethod: "Manual / Download",
    message: "",
    items: [
      {
        id: "1",
        product: "Professional Services",
        description: "Implementation and project delivery",
        quantity: "1",
        unitPrice: String(deal.value || 0),
        discount: "0",
        tax: "0",
      },
    ],
  });

  // Phase 3 — hydrate the proposal form from the stored proposal (revision /
  // RSM review) so returning BDOs and reviewing RSMs see the real content.
  useEffect(() => {
    if (!latestProposal) return;
    const items = latestProposal.lineItems.map((item, index) => ({
      id: `q-${index}`,
      product: item.name,
      description: item.name,
      quantity: String(item.quantity || 0),
      unitPrice: String(item.unitPrice || 0),
      discount: String(item.discount || 0),
      tax: String(item.tax || 0),
    }));
    setProposalForm((current) => ({
      ...current,
      ...(items.length > 0 ? { items } : {}),
      proposalDate: latestProposal.issueDate ? latestProposal.issueDate.slice(0, 10) : current.proposalDate,
      validityDate: latestProposal.expiryDate ? latestProposal.expiryDate.slice(0, 10) : current.validityDate,
      terms: latestProposal.terms || current.terms,
      internalNotes: latestProposal.notes || current.internalNotes,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestProposal?.id]);
  const [negotiationForm, setNegotiationForm] = useState({
    negotiationType: "Price Discussion",
    customerRequest: "",
    ourResponse: "",
    proposedValue: String(deal.value || 0),
    requestedDiscount: "0",
    competitor: "",
    decisionStatus: "Negotiation Ongoing",
    notes: "",
    nextFollowUpDate: "",
  });
  const [wonForm, setWonForm] = useState({
    finalValue: String(deal.value || 0),
    closeDate: DEFAULT_TODAY,
    closingNotes: "",
    customerDecision: "",
  });
  const [lostForm, setLostForm] = useState({
    lostReason: "",
    competitor: "",
    otherReason: "",
    closeDate: DEFAULT_TODAY,
    finalValue: String(deal.value || 0),
    closingNotes: "",
  });

  const proposalTotals = useMemo(() => {
    const items = proposalForm.items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const discount = Number(item.discount || 0);
      const tax = Number(item.tax || 0);
      const subtotal = quantity * unitPrice;
      return {
        subtotal,
        discount,
        tax,
        total: subtotal - discount + tax,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    const tax = items.reduce((sum, item) => sum + item.tax, 0);
    const total = subtotal - discount + tax;

    return { subtotal, discount, tax, total };
  }, [proposalForm.items]);

  const [followUpForm, setFollowUpForm] = useState({
    customer: customerName,
    company: deal.companyName || lead?.company_name || "",
    opportunity: deal.name,
    proposal: proposalForm.title,
    proposalSentDate: proposalForm.proposalDate,
    proposalTotal: proposalTotals.total || deal.value || 0,
    owner: deal.ownerName || "",
    method: "Call",
    followUpDate: DEFAULT_FOLLOW_UP_DATE,
    followUpTime: "09:00",
    response: "Interested",
    notes: "",
    nextFollowUpDate: "",
  });
  const [aiAgenda, setAiAgenda] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  const latestFollowUpResponse = useMemo(() => {
    const record = [...activities].reverse().find((activity) => activity.activity_type === "follow_up_recorded");
    const metadata = record?.metadata as Record<string, unknown> | undefined;
    return typeof metadata?.customer_response === "string" ? metadata.customer_response : undefined;
  }, [activities]);

  const nextFollowUpDate = useMemo(() => {
    const record = [...activities].reverse().find((activity) => activity.activity_type === "follow_up_recorded");
    const metadata = record?.metadata as Record<string, unknown> | undefined;
    return typeof metadata?.next_follow_up_date === "string" ? metadata.next_follow_up_date : undefined;
  }, [activities]);

  const workflow = useMemo(
    () => getOpportunityNextStep(deal.stageName, meeting?.status ?? undefined, latestFollowUpResponse, nextFollowUpDate),
    [deal.stageName, meeting?.status, latestFollowUpResponse, nextFollowUpDate]
  );

  const upcomingMeeting = meeting && meeting.status !== "completed" && meeting.status !== "cancelled" ? meeting : null;
  const isMeetingScheduled = Boolean(meeting && (meeting.status === "scheduled" || meeting.status === "in_progress"));
  const isMeetingDone = Boolean(meeting && meeting.status === "completed");

  const openScheduleModal = () => {
    setScheduleForm((current) => ({
      ...current,
      customer: lead?.full_name || current.customer || "",
      company: lead?.company_name || deal.companyName || current.company || "",
      primaryContact: lead?.full_name || current.primaryContact || "",
      email: lead?.email || current.email || "",
      phone: lead?.phone || current.phone || "",
      opportunity: deal.name,
      owner: deal.ownerName || current.owner || "",
    }));
    setMeetingOpen(true);
  };

  const handleScheduleContinue = () => {
    if (!scheduleForm.meetingDate || !scheduleForm.meetingTime || !scheduleForm.duration || !scheduleForm.meetingType) {
      window.alert("Meeting date, time, duration, and type are required.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleScheduleApprove = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await createOpportunityMeetingAction(deal.id, {
      leadId: lead?.id ?? null,
      customerName: scheduleForm.customer || lead?.full_name || null,
      companyName: scheduleForm.company || deal.companyName || null,
      ownerId: deal.ownerId || lead?.owner_id || null,
      meetingDate: scheduleForm.meetingDate,
      meetingTime: scheduleForm.meetingTime,
      durationMinutes: Number(scheduleForm.duration || 30),
      meetingType: scheduleForm.meetingType,
      agenda: scheduleForm.agenda || null,
      notes: scheduleForm.notes || null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to schedule meeting.");
      return;
    }

    setConfirmOpen(false);
    setMeetingOpen(false);
    router.refresh();
  };

  const handleCompleteMeeting = () => {
    if (!completeForm.notes.trim() && !completeForm.outcome.trim()) {
      window.alert("Meeting notes or outcome are required.");
      return;
    }
    setCompleteOpen(false);
    setApprovalOpen(true);
  };

  const handleApproveCompletion = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await completeOpportunityMeetingAction(deal.id, {
      meetingId: meeting?.id ?? null,
      notes: completeForm.notes,
      outcome: completeForm.outcome,
      customerRequirements: completeForm.customerRequirements,
      objections: completeForm.objections,
      budgetDiscussed: completeForm.budgetDiscussed,
      timeline: completeForm.timeline,
      nextActions: completeForm.nextActions,
      approveStageTransition: true,
      leadId: lead?.id ?? null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to complete meeting.");
      return;
    }

    setApprovalOpen(false);
    router.refresh();
  };

  const validateProposalDraft = () => {
    if (!proposalForm.title.trim()) {
      window.alert("Proposal title is required.");
      return false;
    }

    const validItems = proposalForm.items.filter((item) => item.product?.trim() || item.description?.trim());
    if (validItems.length === 0) {
      window.alert("Add at least one product or service to the proposal.");
      return false;
    }

    const hasInvalidLine = validItems.some((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      return Number.isNaN(quantity) || Number.isNaN(unitPrice) || quantity <= 0 || unitPrice < 0;
    });

    if (hasInvalidLine) {
      window.alert("Each proposal item needs a valid quantity and unit price.");
      return false;
    }

    return true;
  };

  const handleProposalValueChange = (index: number, field: string, value: string) => {
    setProposalForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleAddProposalItem = () => {
    setProposalForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: `${Date.now()}`,
          product: "",
          description: "",
          quantity: "1",
          unitPrice: "0",
          discount: "0",
          tax: "0",
        },
      ],
    }));
  };

  const handleProposalSaveDraft = async (): Promise<boolean> => {
    if (isSubmitting) return false;
    if (!validateProposalDraft()) return false;

    const cleanItems = proposalForm.items
      .filter((item) => item.product?.trim() || item.description?.trim())
      .map((item) => ({
        name_snapshot: item.product || item.description || "Service",
        description: item.description || item.product || "",
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unitPrice || 0),
        discount_amount: Number(item.discount || 0),
        tax_rate: Number(item.tax || 0),
      }));

    setIsSubmitting(true);

    if (proposalId) {
      // Phase 3 — editing an existing proposal saves to the SAME quote and
      // invalidates any previous RSM approval server-side (revision flow).
      const result = await updateQuoteContentAction({
        quoteId: proposalId,
        issue_date: proposalForm.proposalDate,
        expiry_date: proposalForm.validityDate,
        currency: deal.currency || "PKR",
        notes: `${proposalForm.internalNotes || ""}\n\n${proposalForm.customerNotes || ""}`.trim(),
        items: cleanItems,
      });
      setIsSubmitting(false);

      if (!result.ok || !result.quote) {
        window.alert(result.error || "Unable to save draft.");
        return false;
      }

      setProposalStatus("draft");
      setProposalRejectionReason("");
      setProposalOpen(false);
      router.refresh();
      return true;
    }

    const result = await createQuoteAction({
      customerName: proposalForm.customer,
      dealName: proposalForm.opportunity,
      dealId: deal.id,
      total: proposalTotals.total || Number(proposalForm.opportunityValue || 0),
      status: "Draft",
      currency: deal.currency || "PKR",
      issue_date: proposalForm.proposalDate,
      expiry_date: proposalForm.validityDate,
      notes: `${proposalForm.internalNotes || ""}\n\n${proposalForm.customerNotes || ""}`.trim(),
      items: cleanItems,
    });
    setIsSubmitting(false);

    if (result.error || !result.quote) {
      window.alert(result.error || "Unable to save draft.");
      return false;
    }

    setProposalId(result.quote.id);
    setProposalStatus("draft");
    setProposalRejectionReason("");
    setProposalOpen(false);
    router.refresh();
    return true;
  };

  const handleProposalReview = async () => {
    if (!validateProposalDraft()) return;
    if (!proposalId) {
      const saved = await handleProposalSaveDraft();
      if (!saved) return;
    }
    setProposalReviewOpen(true);
  };

  const handleSubmitProposalForApproval = async () => {
    if (!proposalId || isSubmitting) return;
    setIsSubmitting(true);
    const result = await submitProposalForApprovalAction(proposalId);
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.error || result.message || "Unable to submit proposal for approval.");
      return;
    }

    setProposalStatus("pending");
    setProposalReviewOpen(false);
    router.refresh();
  };

  const handleRsmApproveProposal = async () => {
    if (!proposalId || isSubmitting) return;
    setIsSubmitting(true);
    const result = await approveProposalAction(proposalId);
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.error || result.message || "Unable to approve proposal.");
      return;
    }

    setProposalStatus("approved");
    setProposalReviewOpen(false);
    router.refresh();
  };

  const handleRsmReturnProposal = async () => {
    if (!proposalId || isSubmitting || !returnReason.trim()) return;
    setIsSubmitting(true);
    const result = await returnProposalForRevisionAction(proposalId, returnReason.trim());
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.error || result.message || "Unable to return proposal.");
      return;
    }

    setProposalStatus("returned");
    setProposalRejectionReason(returnReason.trim());
    setReturnReasonOpen(false);
    setReturnReason("");
    setProposalReviewOpen(false);
    router.refresh();
  };

  const handlePrintProposal = () => {
    if (proposalStatus !== "approved" && proposalStatus !== "sent") return;
    window.print();
  };

  const handleApproveSend = async () => {
    if (!proposalId || isSubmitting) return;
    // Phase 3 — client-side mirror of the server send gate.
    if (proposalStatus !== "approved") {
      window.alert("This proposal requires RSM approval before it can be sent.");
      return;
    }
    if (!proposalForm.email?.trim() && !proposalForm.customer?.trim()) {
      window.alert("Customer email or contact information is required before sending the proposal.");
      return;
    }

    setIsSubmitting(true);
    const result = await updateQuoteStatusAction(proposalId, "Sent");
    setIsSubmitting(false);

    if (result.error) {
      window.alert(result.error || "Unable to send proposal.");
      return;
    }

    setProposalStatus("sent");
    setProposalSendOpen(false);
    setProposalStageOpen(true);
  };

  const handleApproveStageMove = async () => {
    if (!proposalId || isSubmitting) return;

    setIsSubmitting(true);
    const result = await approveOpportunityProposalSubmittedAction(deal.id, proposalId);
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to move opportunity to Proposal Submitted.");
      return;
    }

    setProposalStageOpen(false);
    router.refresh();
  };

  const getFollowUpRecommendation = (response: string) => {
    const negotiationSignals = ["Interested", "Price Discussion", "Needs Changes"];
    const followUpAgainSignals = ["Needs More Time", "Decision Pending", "No Response"];

    if (negotiationSignals.includes(response)) {
      return {
        kind: "negotiation" as const,
        reason: "The customer's response indicates active negotiation and a likely need to review pricing or scope.",
      };
    }

    if (followUpAgainSignals.includes(response)) {
      return {
        kind: "follow-up-again" as const,
        reason: "The customer is not ready to decide yet. Keep the opportunity in Proposal Submitted and schedule a follow-up.",
      };
    }

    return {
      kind: "proposal-submitted" as const,
      reason: "The opportunity remains in Proposal Submitted until the customer response is clarified.",
    };
  };

  const handleFollowUpContinue = () => {
    if (!followUpForm.method || !followUpForm.followUpDate || !followUpForm.response) {
      window.alert("Follow-up method, date, and response are required.");
      return;
    }
    setFollowUpReviewOpen(true);
  };

  const handleFollowUpApprove = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await createOpportunityFollowUpAction(deal.id, {
      leadId: lead?.id ?? null,
      customerName: followUpForm.customer || lead?.full_name || null,
      companyName: followUpForm.company || deal.companyName || null,
      ownerId: deal.ownerId || lead?.owner_id || null,
      proposalTitle: followUpForm.proposal || proposalForm.title || null,
      proposalSentDate: followUpForm.proposalSentDate || proposalForm.proposalDate || null,
      proposalTotal: Number(followUpForm.proposalTotal || deal.value || 0),
      method: followUpForm.method,
      followUpDate: followUpForm.followUpDate,
      followUpTime: followUpForm.followUpTime,
      response: followUpForm.response,
      notes: followUpForm.notes || null,
      nextFollowUpDate: followUpForm.nextFollowUpDate || null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to record follow-up.");
      return;
    }

    setFollowUpOpen(false);
    setFollowUpReviewOpen(false);

    const recommendation = getFollowUpRecommendation(followUpForm.response);
    if (recommendation.kind === "negotiation") {
      setFollowUpRecommendationOpen(true);
    } else {
      setFollowUpRecommendationOpen(true);
    }

    router.refresh();
  };

  const handleApproveNegotiation = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await approveOpportunityNegotiationAction(deal.id, {
      followUpTaskId: undefined,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to move opportunity to Negotiation.");
      return;
    }

    setFollowUpRecommendationOpen(false);
    router.refresh();
  };

  const handleNegotiationContinue = () => {
    if (!negotiationForm.negotiationType || !negotiationForm.customerRequest || !negotiationForm.decisionStatus) {
      window.alert("Negotiation type, customer request, and decision status are required.");
      return;
    }
    setNegotiationReviewOpen(true);
  };

  const handleRecordNegotiation = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await recordOpportunityNegotiationAction(deal.id, {
      negotiationType: negotiationForm.negotiationType,
      customerRequest: negotiationForm.customerRequest,
      ourResponse: negotiationForm.ourResponse || null,
      proposedValue: negotiationForm.proposedValue ? Number(negotiationForm.proposedValue) : null,
      requestedDiscount: negotiationForm.requestedDiscount ? Number(negotiationForm.requestedDiscount) : null,
      competitor: negotiationForm.competitor || null,
      decisionStatus: negotiationForm.decisionStatus,
      notes: negotiationForm.notes || null,
      nextFollowUpDate: negotiationForm.nextFollowUpDate || null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to record negotiation activity.");
      return;
    }

    setNegotiationOpen(false);
    setNegotiationReviewOpen(false);
    router.refresh();
  };

  const handleWonContinue = () => {
    const value = Number(wonForm.finalValue || 0);
    if (!wonForm.closeDate || !Number.isFinite(value) || value <= 0) {
      window.alert("Final opportunity value and close date are required.");
      return;
    }
    setWonConfirmOpen(true);
  };

  const handleConfirmWon = async () => {
    if (isSubmitting) return;
    const value = Number(wonForm.finalValue || 0);
    if (!wonForm.closeDate || !Number.isFinite(value) || value <= 0) {
      window.alert("Valid final value and close date are required.");
      return;
    }

    setIsSubmitting(true);
    const result = await closeOpportunityWonAction(deal.id, {
      finalValue: value,
      closeDate: wonForm.closeDate,
      closingNotes: wonForm.closingNotes || null,
      customerDecision: wonForm.customerDecision || null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to close opportunity as won.");
      return;
    }

    setWonConfirmOpen(false);
    setWonOpen(false);
    router.refresh();
  };

  const handleLostContinue = () => {
    if (!lostForm.lostReason) {
      window.alert("Please select a reason before closing this Opportunity as Lost.");
      return;
    }
    if (lostForm.lostReason === "Other" && !lostForm.otherReason.trim()) {
      window.alert("Please provide the other reason before closing this Opportunity as Lost.");
      return;
    }
    if (!lostForm.closeDate) {
      window.alert("Close date is required.");
      return;
    }
    setLostConfirmOpen(true);
  };

  const handleConfirmLost = async () => {
    if (isSubmitting) return;
    if (!lostForm.lostReason) {
      window.alert("Lost Reason Required. Please select a reason before closing this Opportunity as Lost.");
      return;
    }
    if (lostForm.lostReason === "Other" && !lostForm.otherReason.trim()) {
      window.alert("Lost Reason Required. Please provide the other reason before closing this Opportunity as Lost.");
      return;
    }

    setIsSubmitting(true);
    const result = await closeOpportunityLostAction(deal.id, {
      lostReason: lostForm.lostReason,
      competitor: lostForm.competitor || null,
      otherReason: lostForm.otherReason || null,
      closeDate: lostForm.closeDate,
      finalValue: lostForm.finalValue ? Number(lostForm.finalValue) : null,
      closingNotes: lostForm.closingNotes || null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      window.alert(result.message || result.error || "Unable to close opportunity as lost.");
      return;
    }

    setLostConfirmOpen(false);
    setLostOpen(false);
    router.refresh();
  };

  const isClosed = ["Closed Won", "Closed Lost"].includes(deal.stageName || "");

  const formatActivityTitle = (title?: string | null) => {
    if (!title) return "Activity";
    return title
      .replace(/Lead converted to a deal/gi, "Lead converted to Opportunity")
      .replace(/Deal created from lead/gi, "Opportunity created from Lead")
      .replace(/Deal/gi, "Opportunity");
  };

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Opportunity</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">{safeText(deal.name)}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setExportOpen(true)}>Export Data</Button>
            <RecordManagementMenu type="opportunity" id={deal.id} name={deal.name} closed={isClosed} directDelete onRefresh={() => router.refresh()} onDeleted={() => router.push("/opportunities")} />
            <Badge variant={stageVariant(deal.stageName)}>{safeText(deal.stageName) || "New Opportunity"}</Badge>
          </div>
        </div>

        <ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} defaultScope="opportunity" recordId={deal.id} title="Export Opportunity" />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Company</p>
            <p className="mt-1 font-medium text-ink">{safeText(deal.companyName)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Customer</p>
            <p className="mt-1 font-medium text-ink">{customerName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Email</p>
            <p className="mt-1 font-medium text-ink">{safeText(lead?.email || "")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Phone</p>
            <p className="mt-1 font-medium text-ink">{safeText(lead?.phone || "")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Stage</p>
            <p className="mt-1 font-medium text-ink">{safeText(deal.stageName) || "New Opportunity"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Value</p>
            <p className="mt-1 font-medium text-ink">{formatCurrency(deal.value, deal.currency)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Owner</p>
            <p className="mt-1 font-medium text-ink">{safeText(deal.ownerName)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Expected Close Date</p>
            <p className="mt-1 font-medium text-ink">{formatDate(deal.expectedCloseDate)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Source Lead</p>
            <p className="mt-1 font-medium text-ink">{safeText(lead?.id ? lead.full_name || "Qualified Lead" : "—")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Created Date</p>
            <p className="mt-1 font-medium text-ink">{formatDate(deal.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Last Activity</p>
            <p className="mt-1 font-medium text-ink">{formatDate(deal.lastActivityAt)}</p>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" />
          Sales Progress
        </div>
        <div className="mt-5 space-y-3">
          {workflow.progress.map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
                {step.state === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : step.state === "current" ? (
                  <Circle className="h-4 w-4 fill-primary text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className={step.state === "current" ? "font-semibold text-ink" : step.state === "completed" ? "font-medium text-foreground" : "text-muted-foreground"}>{step.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Flag className="h-4 w-4" />
            Next Step
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink">{workflow.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{workflow.description}</p>

          {proposalId && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={proposalStatus === "returned" ? "danger" : proposalStatus === "approved" ? "success" : proposalStatus === "pending" ? "warning" : "secondary"}>
                {PROPOSAL_UI_LABELS[proposalStatus]}
              </Badge>
              {proposalStatus === "pending" && viewer?.isRsm && canApproveProposal && (
                <span className="text-xs text-muted-foreground">Review the proposal to approve or return it.</span>
              )}
              {proposalStatus === "returned" && (
                <span className="text-xs text-danger">{proposalRejectionReason ? `— ${proposalRejectionReason}` : "Revision required before resubmission."}</span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {workflow.primaryAction === "Schedule Meeting" && (
              <Button onClick={openScheduleModal}>{workflow.primaryAction}</Button>
            )}
            {workflow.primaryAction === "Mark Meeting Complete" && (
              <Button onClick={() => setCompleteOpen(true)}>{workflow.primaryAction}</Button>
            )}
            {workflow.primaryAction === "Prepare Proposal" && (
              <Button onClick={() => {
                setProposalForm((current) => ({
                  ...current,
                  title: `Proposal for ${deal.name || "Opportunity"}`,
                  customer: customerName,
                  company: deal.companyName || lead?.company_name || "",
                  opportunity: deal.name,
                  email: lead?.email || current.email,
                  phone: lead?.phone || current.phone,
                  owner: deal.ownerName || current.owner,
                  opportunityValue: deal.value || current.opportunityValue,
                  requirements: completeForm.customerRequirements || current.requirements,
                  timeline: completeForm.timeline || current.timeline,
                  items: current.items.length ? current.items : [{
                    id: "1",
                    product: "Professional Services",
                    description: "Implementation and project delivery",
                    quantity: "1",
                    unitPrice: String(deal.value || 0),
                    discount: "0",
                    tax: "0",
                  }],
                }));
                setProposalOpen(true);
              }}>{workflow.primaryAction}</Button>
            )}
            {workflow.primaryAction === "Log Follow Up" && (
              <Button onClick={() => {
                setFollowUpForm((current) => ({
                  ...current,
                  customer: customerName,
                  company: deal.companyName || lead?.company_name || "",
                  opportunity: deal.name,
                  proposal: proposalForm.title || `Proposal for ${deal.name}`,
                  proposalSentDate: proposalForm.proposalDate || new Date().toISOString().slice(0, 10),
                  proposalTotal: proposalTotals.total || deal.value || 0,
                  owner: deal.ownerName || current.owner,
                }));
                setFollowUpOpen(true);
              }}>{workflow.primaryAction}</Button>
            )}
            {workflow.primaryAction === "Log Negotiation" && (
              <>
                <Button onClick={() => setNegotiationOpen(true)}>{workflow.primaryAction}</Button>
                <Button variant="outline" onClick={() => setWonOpen(true)}>Mark Won</Button>
                <Button variant="outline" onClick={() => setLostOpen(true)}>Mark Lost</Button>
              </>
            )}
            {!isClosed && workflow.primaryAction === "Completed" && <Button variant="secondary" disabled>Completed</Button>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Upcoming Meeting
          </div>

          {upcomingMeeting ? (
            <div className="mt-4 space-y-4 text-sm">
              <div><span className="font-medium text-foreground">Customer:</span> {safeText(lead?.full_name || customerName)}</div>
              <div><span className="font-medium text-foreground">Date:</span> {formatDate(upcomingMeeting.start_at)}</div>
              <div><span className="font-medium text-foreground">Time:</span> {new Date(upcomingMeeting.start_at || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "—"}</div>
              <div><span className="font-medium text-foreground">Duration:</span> {upcomingMeeting.start_at && upcomingMeeting.end_at ? Math.max(0, Math.round((new Date(upcomingMeeting.end_at).getTime() - new Date(upcomingMeeting.start_at).getTime()) / 60000)) : "30"} mins</div>
              <div><span className="font-medium text-foreground">Meeting Type:</span> {safeText(upcomingMeeting.meeting_type)}</div>
              <div><span className="font-medium text-foreground">Agenda:</span> {safeText(upcomingMeeting.notes)}</div>
              <div><span className="font-medium text-foreground">Status:</span> <Badge variant="secondary">{safeText(upcomingMeeting.status)}</Badge></div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" onClick={() => setCompleteOpen(true)}>Mark Meeting Complete</Button>
                <Button variant="outline" onClick={openScheduleModal}>Reschedule</Button>
                <Button variant="ghost" onClick={() => window.alert("Meeting cancellation would be implemented in the next phase.")}>Cancel Meeting</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              No upcoming meeting scheduled.
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <MessageSquareText className="h-4 w-4" />
          Activity Timeline
        </div>
        <div className="mt-5 space-y-4">
          {activities.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity recorded yet.</div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-ink">{formatActivityTitle(activity.title)}</div>
                    <span className="text-xs text-muted-foreground">{formatDate(activity.occurred_at)}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{activity.description || "No details"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>Auto-filled from the opportunity and lead details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={scheduleForm.customer} onChange={(event) => setScheduleForm((current) => ({ ...current, customer: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={scheduleForm.company} onChange={(event) => setScheduleForm((current) => ({ ...current, company: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Primary Contact</Label>
              <Input value={scheduleForm.primaryContact} onChange={(event) => setScheduleForm((current) => ({ ...current, primaryContact: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={scheduleForm.owner} onChange={(event) => setScheduleForm((current) => ({ ...current, owner: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={scheduleForm.email} onChange={(event) => setScheduleForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={scheduleForm.phone} onChange={(event) => setScheduleForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Opportunity</Label>
              <Input value={scheduleForm.opportunity} onChange={(event) => setScheduleForm((current) => ({ ...current, opportunity: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Meeting Date *</Label>
              <Input type="date" value={scheduleForm.meetingDate} onChange={(event) => setScheduleForm((current) => ({ ...current, meetingDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Meeting Time *</Label>
              <Input type="time" value={scheduleForm.meetingTime} onChange={(event) => setScheduleForm((current) => ({ ...current, meetingTime: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Duration *</Label>
              <Input type="number" min={15} step={15} value={scheduleForm.duration} onChange={(event) => setScheduleForm((current) => ({ ...current, duration: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Meeting Type *</Label>
              <Select value={scheduleForm.meetingType} onValueChange={(value) => setScheduleForm((current) => ({ ...current, meetingType: value as (typeof meetingTypes)[number] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Agenda</Label>
              <Textarea value={scheduleForm.agenda} onChange={(event) => setScheduleForm((current) => ({ ...current, agenda: event.target.value }))} placeholder="Proposal discussion, discovery goals, stakeholder alignment..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Optional Notes</Label>
              <Textarea value={scheduleForm.notes} onChange={(event) => setScheduleForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Anything the team should know before the meeting." />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setAiAgenda((current) => current || "Objective: validate needs and budget\nDiscovery questions: ...\nCustomer topics: ...\nTalking points: ...")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Agenda with AI
            </Button>
            {aiAgenda && (
              <div className="flex-1 rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">{aiAgenda}</div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMeetingOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleContinue} disabled={isSubmitting}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule This Meeting?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {scheduleForm.customer || "—"}</div>
            <div><span className="font-medium">Company:</span> {scheduleForm.company || "—"}</div>
            <div><span className="font-medium">Opportunity:</span> {scheduleForm.opportunity || "—"}</div>
            <div><span className="font-medium">Date:</span> {formatDate(scheduleForm.meetingDate)}</div>
            <div><span className="font-medium">Time:</span> {scheduleForm.meetingTime || "—"}</div>
            <div><span className="font-medium">Duration:</span> {scheduleForm.duration ? `${scheduleForm.duration} mins` : "—"}</div>
            <div><span className="font-medium">Type:</span> {scheduleForm.meetingType || "—"}</div>
            <div><span className="font-medium">Agenda:</span> {scheduleForm.agenda || "—"}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Back to Edit</Button>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleApprove} disabled={isSubmitting}>{isSubmitting ? "Scheduling..." : "Approve & Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Approve Meeting Completion</DialogTitle>
            <DialogDescription>This will mark the meeting as complete and move the opportunity to Meeting Done.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {customerName}</div>
            <div><span className="font-medium">Outcome:</span> {completeForm.outcome || "—"}</div>
            <div><span className="font-medium">Notes:</span> {completeForm.notes || "—"}</div>
            <div><span className="font-medium">Next actions:</span> {completeForm.nextActions || "—"}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>Back to Edit</Button>
            <Button onClick={handleApproveCompletion} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Approve & Mark Meeting Done"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
        <DialogContent className="box-border max-h-[92vh] w-[min(95vw,900px)] max-w-[95vw] overflow-y-auto p-0">
          <DialogHeader className="min-w-0 px-6 pt-6">
            <DialogTitle className="text-xl">Prepare Proposal</DialogTitle>
            <DialogDescription>Draft and review the proposal details before continuing to review.</DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-6 px-6 pb-2">
            <section className="min-w-0 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">Proposal details</h3>
                <p className="mt-1 text-xs text-muted-foreground">Set the proposal title and review the linked opportunity.</p>
              </div>
              <div className="grid min-w-0 gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2 sm:col-span-2">
                <Label required>Proposal Title</Label>
                <Input className="w-full min-w-0 max-w-full" value={proposalForm.title} onChange={(event) => setProposalForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Proposal Date</Label>
                <Input className="w-full min-w-0 max-w-full" type="date" value={proposalForm.proposalDate} onChange={(event) => setProposalForm((current) => ({ ...current, proposalDate: event.target.value }))} />
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Validity Date</Label>
                <Input className="w-full min-w-0 max-w-full" type="date" value={proposalForm.validityDate} onChange={(event) => setProposalForm((current) => ({ ...current, validityDate: event.target.value }))} />
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Customer</Label>
                <Input className="w-full min-w-0 max-w-full" value={proposalForm.customer} readOnly />
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Company</Label>
                <Input className="w-full min-w-0 max-w-full" value={proposalForm.company} readOnly />
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Email</Label>
                <Input className="w-full min-w-0 max-w-full" value={proposalForm.email} readOnly />
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Phone</Label>
                <Input className="w-full min-w-0 max-w-full" value={proposalForm.phone} readOnly />
              </div>
              <div className="min-w-0 space-y-2 sm:col-span-2">
                <Label>Opportunity</Label>
                <Input className="w-full min-w-0 max-w-full" value={proposalForm.opportunity} readOnly />
              </div>
              </div>
            </section>

            <section className="min-w-0 rounded-xl border border-border p-4">
              <div className="mb-1 text-sm font-semibold text-ink">Products / Services</div>
              <p className="mb-4 text-xs text-muted-foreground">Add the items included in this proposal and confirm the totals.</p>
              <div className="space-y-3">
                {proposalForm.items.map((item, index) => (
                  <div key={item.id} className="grid min-w-0 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
                    <div className="min-w-0 space-y-2 sm:col-span-2">
                      <Label required>Product / Service</Label>
                      <Input className="w-full min-w-0" value={item.product} onChange={(event) => handleProposalValueChange(index, "product", event.target.value)} placeholder="Service / Package" />
                    </div>
                    <div className="min-w-0 space-y-2 sm:col-span-2">
                      <Label>Description</Label>
                      <Input className="w-full min-w-0" value={item.description} onChange={(event) => handleProposalValueChange(index, "description", event.target.value)} placeholder="Scope and details" />
                    </div>
                    <div className="grid min-w-0 grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
                      <div className="min-w-0 space-y-2">
                        <Label required>Qty</Label>
                        <Input className="w-full min-w-0 max-w-full" type="number" min="1" step="1" value={item.quantity} onChange={(event) => handleProposalValueChange(index, "quantity", event.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label required>Unit Price</Label>
                        <Input className="w-full min-w-0 max-w-full" type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => handleProposalValueChange(index, "unitPrice", event.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label>Discount</Label>
                        <Input className="w-full min-w-0 max-w-full" type="number" min="0" step="0.01" value={item.discount} onChange={(event) => handleProposalValueChange(index, "discount", event.target.value)} />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label>Tax</Label>
                        <Input className="w-full min-w-0 max-w-full" type="number" min="0" step="0.01" value={item.tax} onChange={(event) => handleProposalValueChange(index, "tax", event.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddProposalItem}>+ Add Item</Button>
              </div>
              <div className="mt-4 space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
                <div className="grid grid-cols-[1fr_auto] gap-4"><span>Subtotal</span><span className="text-right tabular-nums">{formatCurrency(proposalTotals.subtotal, deal.currency)}</span></div>
                <div className="grid grid-cols-[1fr_auto] gap-4"><span>Discount</span><span className="text-right tabular-nums">{formatCurrency(proposalTotals.discount, deal.currency)}</span></div>
                <div className="grid grid-cols-[1fr_auto] gap-4"><span>Tax</span><span className="text-right tabular-nums">{formatCurrency(proposalTotals.tax, deal.currency)}</span></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 font-semibold"><span>Grand Total</span><span className="text-right tabular-nums">{formatCurrency(proposalTotals.total, deal.currency)}</span></div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">Scope and terms</h3>
                <p className="mt-1 text-xs text-muted-foreground">Add the customer-facing content and internal notes for this proposal.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Requirements</Label>
                <Textarea value={proposalForm.requirements} onChange={(event) => setProposalForm((current) => ({ ...current, requirements: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Proposed Solution</Label>
                <Textarea value={proposalForm.solution} onChange={(event) => setProposalForm((current) => ({ ...current, solution: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Scope of Work</Label>
                <Textarea value={proposalForm.scope} onChange={(event) => setProposalForm((current) => ({ ...current, scope: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Deliverables</Label>
                <Textarea value={proposalForm.deliverables} onChange={(event) => setProposalForm((current) => ({ ...current, deliverables: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Timeline</Label>
                <Textarea value={proposalForm.timeline} onChange={(event) => setProposalForm((current) => ({ ...current, timeline: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input value={proposalForm.paymentTerms} onChange={(event) => setProposalForm((current) => ({ ...current, paymentTerms: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Delivery / Implementation Timeline</Label>
                <Input value={proposalForm.implementationTimeline} onChange={(event) => setProposalForm((current) => ({ ...current, implementationTimeline: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Validity</Label>
                <Input value={proposalForm.validity} onChange={(event) => setProposalForm((current) => ({ ...current, validity: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Input value={proposalForm.terms} onChange={(event) => setProposalForm((current) => ({ ...current, terms: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea value={proposalForm.internalNotes} onChange={(event) => setProposalForm((current) => ({ ...current, internalNotes: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Customer-facing Notes</Label>
                <Textarea value={proposalForm.customerNotes} onChange={(event) => setProposalForm((current) => ({ ...current, customerNotes: event.target.value }))} />
              </div>
              </div>
            </section>
          </div>

          <DialogFooter className="sticky bottom-0 mt-4 min-w-0 border-t border-border bg-card px-6 py-4">
            <Button variant="outline" onClick={() => setProposalOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleProposalSaveDraft} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Draft"}</Button>
            <Button onClick={handleProposalReview} disabled={isSubmitting}>{isSubmitting ? "Preparing..." : "Continue to Review"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={proposalReviewOpen} onOpenChange={setProposalReviewOpen}>
        <DialogContent className="max-h-[90vh] w-[min(1000px,92vw)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Preview</DialogTitle>
            <DialogDescription>Customer-facing proposal review before approval.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Proposal</div>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{proposalForm.title}</h3>
                </div>
                <Badge variant={proposalStatus === "returned" ? "danger" : proposalStatus === "approved" ? "success" : proposalStatus === "pending" ? "warning" : "secondary"}>
                  {PROPOSAL_UI_LABELS[proposalStatus]}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <div><span className="font-medium">Customer:</span> {proposalForm.customer}</div>
                <div><span className="font-medium">Company:</span> {proposalForm.company}</div>
                <div><span className="font-medium">Date:</span> {formatDate(proposalForm.proposalDate)}</div>
                <div><span className="font-medium">Validity:</span> {proposalForm.validityDate || "—"}</div>
              </div>
              {proposalStatus === "returned" && proposalRejectionReason && (
                <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-[#991b1b]">
                  <span className="font-semibold">Returned for Revision:</span> {proposalRejectionReason}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-ink">Executive Summary</div>
              <p className="text-sm text-muted-foreground">{proposalForm.solution || "The proposed solution addresses the customer requirements and delivery needs for this opportunity."}</p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-ink">Requirements</div>
              <p className="text-sm text-muted-foreground">{proposalForm.requirements || "No detailed requirements provided."}</p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-ink">Scope of Work</div>
              <p className="text-sm text-muted-foreground">{proposalForm.scope || proposalForm.deliverables || "Scope to be confirmed during implementation."}</p>
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-ink">Line Items</div>
              {proposalForm.items.filter((item) => item.product || item.description).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
                  <div>
                    <div className="font-medium text-ink">{item.product || "Service"}</div>
                    <div className="text-muted-foreground">{item.description || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div>{Number(item.quantity || 0)} × {formatCurrency(Number(item.unitPrice || 0), deal.currency)}</div>
                    <div>{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0), deal.currency)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(proposalTotals.subtotal, deal.currency)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(proposalTotals.discount, deal.currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(proposalTotals.tax, deal.currency)}</span></div>
              <div className="mt-2 flex justify-between font-semibold"><span>Grand Total</span><span>{formatCurrency(proposalTotals.total, deal.currency)}</span></div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-ink">Terms</div>
              <p className="text-sm text-muted-foreground">{proposalForm.terms || "Standard terms and conditions apply."}</p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-ink">Customer Notes</div>
              <p className="text-sm text-muted-foreground">{proposalForm.customerNotes || "—"}</p>
            </div>
          </div>

          <DialogFooter className="mt-4">
            {proposalStatus === "sent" && (
              <>
                <Button variant="outline" onClick={() => setProposalReviewOpen(false)}>Back</Button>
                <Button variant="outline" onClick={handlePrintProposal}>Print Proposal</Button>
              </>
            )}
            {proposalStatus === "approved" && (
              <>
                <Button variant="outline" onClick={() => setProposalReviewOpen(false)}>Back</Button>
                <Button variant="outline" onClick={handlePrintProposal}>Print Proposal</Button>
                <Button onClick={() => { setProposalReviewOpen(false); setProposalSendOpen(true); }}>Ready to Send</Button>
              </>
            )}
            {proposalStatus === "pending" && (
              canApproveProposal ? (
                <>
                  <Button variant="outline" onClick={() => setProposalReviewOpen(false)}>Back</Button>
                  {!returnReasonOpen && <Button variant="destructive" onClick={() => setReturnReasonOpen(true)}>Return for Revision</Button>}
                  <Button onClick={handleRsmApproveProposal} disabled={isSubmitting}>{isSubmitting ? "Approving..." : "Approve Proposal"}</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setProposalReviewOpen(false)}>Back</Button>
                  <Button disabled>Awaiting RSM Approval</Button>
                </>
              )
            )}
            {proposalStatus === "returned" && (
              <>
                <Button variant="outline" onClick={() => { setProposalReviewOpen(false); setProposalOpen(true); }}>Back to Edit</Button>
                <Button onClick={handleSubmitProposalForApproval} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Resubmit for Approval"}</Button>
              </>
            )}
            {proposalStatus === "draft" && (
              <>
                <Button variant="outline" onClick={() => setProposalReviewOpen(false)}>Back to Edit</Button>
                <Button onClick={handleSubmitProposalForApproval} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit for RSM Approval"}</Button>
              </>
            )}
          </DialogFooter>

          {returnReasonOpen && (
            <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/20 p-4">
              <Label required>Reason for Return</Label>
              <Textarea
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder="Required — explain what the BDO needs to revise before this proposal can be approved."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setReturnReasonOpen(false); setReturnReason(""); }}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleRsmReturnProposal} disabled={isSubmitting || !returnReason.trim()}>
                  {isSubmitting ? "Returning..." : "Confirm Return"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={proposalSendOpen} onOpenChange={setProposalSendOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Proposal</DialogTitle>
            <DialogDescription>Deliver the approved proposal to the customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div><span className="font-medium">Customer:</span> {proposalForm.customer}</div>
            <div><span className="font-medium">Email:</span> {proposalForm.email || "—"}</div>
            <div><span className="font-medium">Phone:</span> {proposalForm.phone || "—"}</div>
            <div><span className="font-medium">Proposal:</span> {proposalForm.title}</div>
            <div><span className="font-medium">Total:</span> {formatCurrency(proposalTotals.total, deal.currency)}</div>

            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select value={proposalForm.deliveryMethod} onValueChange={(value) => setProposalForm((current) => ({ ...current, deliveryMethod: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual / Download">Manual / Download</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={proposalForm.message} onChange={(event) => setProposalForm((current) => ({ ...current, message: event.target.value }))} placeholder="Hi {customer}, here is the proposal..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProposalSendOpen(false)}>Back</Button>
            <Button variant="outline" onClick={handlePrintProposal}>Print Proposal</Button>
            <Button onClick={handleApproveSend} disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Approve & Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={proposalStageOpen} onOpenChange={setProposalStageOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Proposal Sent Successfully</DialogTitle>
            <DialogDescription>The proposal has been sent successfully. Would you like to move this Opportunity to Proposal Submitted?</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {proposalForm.customer}</div>
            <div><span className="font-medium">Proposal:</span> {proposalForm.title}</div>
            <div><span className="font-medium">Total:</span> {formatCurrency(proposalTotals.total, deal.currency)}</div>
            <div><span className="font-medium">Delivery Method:</span> {proposalForm.deliveryMethod}</div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProposalStageOpen(false)}>Stay in Meeting Done</Button>
            <Button onClick={handleApproveStageMove} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Approve & Continue"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Customer Follow-Up</DialogTitle>
            <DialogDescription>Record the customer response to the proposal and determine the next step.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={followUpForm.customer} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={followUpForm.company} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Opportunity</Label>
              <Input value={followUpForm.opportunity} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={followUpForm.owner} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Proposal</Label>
              <Input value={followUpForm.proposal} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Proposal Sent Date</Label>
              <Input value={formatDate(followUpForm.proposalSentDate)} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Proposal Total</Label>
              <Input value={formatCurrency(followUpForm.proposalTotal, deal.currency)} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Follow-Up Method *</Label>
              <Select value={followUpForm.method} onValueChange={(value) => setFollowUpForm((current) => ({ ...current, method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Follow-Up Date / Time *</Label>
              <Input type="datetime-local" value={`${followUpForm.followUpDate}T${followUpForm.followUpTime || "09:00"}`} onChange={(event) => {
                const [date, time] = event.target.value.split("T");
                setFollowUpForm((current) => ({ ...current, followUpDate: date || current.followUpDate, followUpTime: time || current.followUpTime }));
              }} />
            </div>
            <div className="space-y-2">
              <Label>Customer Response *</Label>
              <Select value={followUpForm.response} onValueChange={(value) => setFollowUpForm((current) => ({ ...current, response: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select response" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Needs Changes">Needs Changes</SelectItem>
                  <SelectItem value="Price Discussion">Price Discussion</SelectItem>
                  <SelectItem value="Needs More Time">Needs More Time</SelectItem>
                  <SelectItem value="Decision Pending">Decision Pending</SelectItem>
                  <SelectItem value="No Response">No Response</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Follow-Up Date</Label>
              <Input type="date" value={followUpForm.nextFollowUpDate} onChange={(event) => setFollowUpForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={followUpForm.notes} onChange={(event) => setFollowUpForm((current) => ({ ...current, notes: event.target.value }))} placeholder="What was discussed and what is the next step?" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
            <Button onClick={handleFollowUpContinue}>Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={followUpReviewOpen} onOpenChange={setFollowUpReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Follow-Up?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {followUpForm.customer}</div>
            <div><span className="font-medium">Method:</span> {followUpForm.method}</div>
            <div><span className="font-medium">Response:</span> {followUpForm.response}</div>
            <div><span className="font-medium">Notes:</span> {followUpForm.notes || "—"}</div>
            <div><span className="font-medium">Next Follow-Up:</span> {followUpForm.nextFollowUpDate ? formatDate(followUpForm.nextFollowUpDate) : "—"}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpReviewOpen(false)}>Back</Button>
            <Button variant="secondary" onClick={() => setFollowUpReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleFollowUpApprove} disabled={isSubmitting}>{isSubmitting ? "Recording..." : "Approve & Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={followUpRecommendationOpen} onOpenChange={setFollowUpRecommendationOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{getFollowUpRecommendation(followUpForm.response).kind === "negotiation" ? "Negotiation Activity Detected" : "Proposal Submitted"}</DialogTitle>
            <DialogDescription>
              {getFollowUpRecommendation(followUpForm.response).kind === "negotiation"
                ? `The customer's response indicates active negotiation. Would you like to move this Opportunity to Negotiation?`
                : getFollowUpRecommendation(followUpForm.response).kind === "follow-up-again"
                  ? `The customer is not ready to decide yet. The opportunity remains in Proposal Submitted and should be followed up again.`
                  : "The customer response has been recorded and the opportunity remains in Proposal Submitted."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {followUpForm.customer}</div>
            <div><span className="font-medium">Response:</span> {followUpForm.response}</div>
            <div><span className="font-medium">Reason:</span> {getFollowUpRecommendation(followUpForm.response).reason}</div>
            {followUpForm.nextFollowUpDate && (
              <div><span className="font-medium">Next Follow-Up:</span> {formatDate(followUpForm.nextFollowUpDate)}</div>
            )}
          </div>
          <DialogFooter>
            {getFollowUpRecommendation(followUpForm.response).kind === "negotiation" ? (
              <>
                <Button variant="outline" onClick={() => setFollowUpRecommendationOpen(false)}>Stay in Proposal Submitted</Button>
                <Button onClick={handleApproveNegotiation} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Approve & Continue"}</Button>
              </>
            ) : (
              <Button onClick={() => setFollowUpRecommendationOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={negotiationOpen} onOpenChange={setNegotiationOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Negotiation</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={customerName} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={deal.companyName || "—"} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Opportunity</Label>
              <Input value={deal.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Proposal</Label>
              <Input value={proposalForm.title || "Proposal for this opportunity"} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Current Opportunity Value</Label>
              <Input value={formatCurrency(deal.value, deal.currency)} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={deal.ownerName || "—"} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Negotiation Type *</Label>
              <Select value={negotiationForm.negotiationType} onValueChange={(value) => setNegotiationForm((current) => ({ ...current, negotiationType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select negotiation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Price Discussion">Price Discussion</SelectItem>
                  <SelectItem value="Discount Request">Discount Request</SelectItem>
                  <SelectItem value="Scope Change">Scope Change</SelectItem>
                  <SelectItem value="Proposal Revision">Proposal Revision</SelectItem>
                  <SelectItem value="Contract Terms">Contract Terms</SelectItem>
                  <SelectItem value="Payment Terms">Payment Terms</SelectItem>
                  <SelectItem value="Timeline Discussion">Timeline Discussion</SelectItem>
                  <SelectItem value="Competitor Discussion">Competitor Discussion</SelectItem>
                  <SelectItem value="Decision Discussion">Decision Discussion</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Decision Status *</Label>
              <Select value={negotiationForm.decisionStatus} onValueChange={(value) => setNegotiationForm((current) => ({ ...current, decisionStatus: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negotiation Ongoing">Negotiation Ongoing</SelectItem>
                  <SelectItem value="Customer Interested">Customer Interested</SelectItem>
                  <SelectItem value="Awaiting Customer Decision">Awaiting Customer Decision</SelectItem>
                  <SelectItem value="Revision Required">Revision Required</SelectItem>
                  <SelectItem value="Ready to Close">Ready to Close</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Customer Request / Objection *</Label>
              <Textarea value={negotiationForm.customerRequest} onChange={(event) => setNegotiationForm((current) => ({ ...current, customerRequest: event.target.value }))} placeholder="What is the customer asking for, objecting to, or needing changed?" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Our Response</Label>
              <Textarea value={negotiationForm.ourResponse} onChange={(event) => setNegotiationForm((current) => ({ ...current, ourResponse: event.target.value }))} placeholder="Describe the response, position, or counter-offer." />
            </div>
            <div className="space-y-2">
              <Label>Proposed Value</Label>
              <Input type="number" min="0" step="0.01" value={negotiationForm.proposedValue} onChange={(event) => setNegotiationForm((current) => ({ ...current, proposedValue: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Requested Discount</Label>
              <Input type="number" min="0" step="0.01" value={negotiationForm.requestedDiscount} onChange={(event) => setNegotiationForm((current) => ({ ...current, requestedDiscount: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Competitor</Label>
              <Input value={negotiationForm.competitor} onChange={(event) => setNegotiationForm((current) => ({ ...current, competitor: event.target.value }))} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Next Follow-Up Date</Label>
              <Input type="date" value={negotiationForm.nextFollowUpDate} onChange={(event) => setNegotiationForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={negotiationForm.notes} onChange={(event) => setNegotiationForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Any details the team should capture from the negotiation conversation." />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setNegotiationOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => setNegotiationOpen(false)}>Close</Button>
            <Button onClick={handleNegotiationContinue}>Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={negotiationReviewOpen} onOpenChange={setNegotiationReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Negotiation Activity?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {customerName}</div>
            <div><span className="font-medium">Negotiation Type:</span> {negotiationForm.negotiationType}</div>
            <div><span className="font-medium">Customer Request:</span> {negotiationForm.customerRequest}</div>
            <div><span className="font-medium">Our Response:</span> {negotiationForm.ourResponse || "—"}</div>
            <div><span className="font-medium">Decision Status:</span> {negotiationForm.decisionStatus}</div>
            <div><span className="font-medium">Next Follow-Up:</span> {negotiationForm.nextFollowUpDate ? formatDate(negotiationForm.nextFollowUpDate) : "—"}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNegotiationReviewOpen(false)}>Back</Button>
            <Button variant="secondary" onClick={() => setNegotiationReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordNegotiation} disabled={isSubmitting}>{isSubmitting ? "Recording..." : "Approve & Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wonOpen} onOpenChange={setWonOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Close Opportunity as Won?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div><span className="font-medium">Customer:</span> {customerName}</div>
            <div><span className="font-medium">Company:</span> {deal.companyName || "—"}</div>
            <div><span className="font-medium">Opportunity:</span> {deal.name}</div>
            <div><span className="font-medium">Proposal:</span> {proposalForm.title || "—"}</div>
            <div><span className="font-medium">Current Value:</span> {formatCurrency(deal.value, deal.currency)}</div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Final Opportunity Value *</Label>
              <Input type="number" min="0" step="0.01" value={wonForm.finalValue} onChange={(event) => setWonForm((current) => ({ ...current, finalValue: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Close Date *</Label>
              <Input type="date" value={wonForm.closeDate} onChange={(event) => setWonForm((current) => ({ ...current, closeDate: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Closing Notes</Label>
              <Textarea value={wonForm.closingNotes} onChange={(event) => setWonForm((current) => ({ ...current, closingNotes: event.target.value }))} placeholder="Optional context or closing summary." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Customer Decision / Summary</Label>
              <Textarea value={wonForm.customerDecision} onChange={(event) => setWonForm((current) => ({ ...current, customerDecision: event.target.value }))} placeholder="Optional summary of the customer's decision." />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <div className="font-medium">Stage Change:</div>
            <div>Negotiation</div>
            <div className="text-muted-foreground">↓</div>
            <div>Closed Won</div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setWonOpen(false)}>Back</Button>
            <Button variant="secondary" onClick={() => setWonOpen(false)}>Cancel</Button>
            <Button onClick={handleWonContinue}>Confirm Closed Won</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wonConfirmOpen} onOpenChange={setWonConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Closed Won</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {customerName}</div>
            <div><span className="font-medium">Opportunity:</span> {deal.name}</div>
            <div><span className="font-medium">Final Value:</span> {formatCurrency(Number(wonForm.finalValue || 0), deal.currency)}</div>
            <div><span className="font-medium">Close Date:</span> {formatDate(wonForm.closeDate)}</div>
            <div><span className="font-medium">Closing Notes:</span> {wonForm.closingNotes || "—"}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWonConfirmOpen(false)}>Back</Button>
            <Button onClick={handleConfirmWon} disabled={isSubmitting}>{isSubmitting ? "Closing..." : "Confirm Closed Won"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Close Opportunity as Lost?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div><span className="font-medium">Customer:</span> {customerName}</div>
            <div><span className="font-medium">Company:</span> {deal.companyName || "—"}</div>
            <div><span className="font-medium">Opportunity:</span> {deal.name}</div>
            <div><span className="font-medium">Proposal:</span> {proposalForm.title || "—"}</div>
            <div><span className="font-medium">Current Value:</span> {formatCurrency(deal.value, deal.currency)}</div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Lost Reason *</Label>
              <Select value={lostForm.lostReason} onValueChange={(value) => setLostForm((current) => ({ ...current, lostReason: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Price Too High">Price Too High</SelectItem>
                  <SelectItem value="Competitor">Competitor</SelectItem>
                  <SelectItem value="Budget">Budget</SelectItem>
                  <SelectItem value="No Response">No Response</SelectItem>
                  <SelectItem value="Timing">Timing</SelectItem>
                  <SelectItem value="Requirement Not Met">Requirement Not Met</SelectItem>
                  <SelectItem value="Decision Delayed">Decision Delayed</SelectItem>
                  <SelectItem value="Customer Cancelled">Customer Cancelled</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {lostForm.lostReason === "Competitor" && (
              <div className="space-y-2">
                <Label>Competitor Name</Label>
                <Input value={lostForm.competitor} onChange={(event) => setLostForm((current) => ({ ...current, competitor: event.target.value }))} placeholder="Optional but recommended" />
              </div>
            )}

            {lostForm.lostReason === "Other" && (
              <div className="space-y-2">
                <Label>Other Reason *</Label>
                <Input value={lostForm.otherReason} onChange={(event) => setLostForm((current) => ({ ...current, otherReason: event.target.value }))} placeholder="Please specify the other reason." />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Close Date *</Label>
                <Input type="date" value={lostForm.closeDate} onChange={(event) => setLostForm((current) => ({ ...current, closeDate: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Final Lost Value</Label>
                <Input type="number" min="0" step="0.01" value={lostForm.finalValue} onChange={(event) => setLostForm((current) => ({ ...current, finalValue: event.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Closing Notes</Label>
              <Textarea value={lostForm.closingNotes} onChange={(event) => setLostForm((current) => ({ ...current, closingNotes: event.target.value }))} placeholder="Optional notes about the lost opportunity." />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <div className="font-medium">Stage Change:</div>
            <div>Negotiation</div>
            <div className="text-muted-foreground">↓</div>
            <div>Closed Lost</div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setLostOpen(false)}>Back</Button>
            <Button variant="secondary" onClick={() => setLostOpen(false)}>Cancel</Button>
            <Button onClick={handleLostContinue}>Confirm Closed Lost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostConfirmOpen} onOpenChange={setLostConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Closed Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Customer:</span> {customerName}</div>
            <div><span className="font-medium">Opportunity:</span> {deal.name}</div>
            <div><span className="font-medium">Lost Reason:</span> {lostForm.lostReason}</div>
            {lostForm.competitor && <div><span className="font-medium">Competitor:</span> {lostForm.competitor}</div>}
            <div><span className="font-medium">Close Date:</span> {formatDate(lostForm.closeDate)}</div>
            {lostForm.closingNotes && <div><span className="font-medium">Notes:</span> {lostForm.closingNotes}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostConfirmOpen(false)}>Back</Button>
            <Button onClick={handleConfirmLost} disabled={isSubmitting}>{isSubmitting ? "Closing..." : "Confirm Closed Lost"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Meeting</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={customerName} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={deal.companyName || "—"} readOnly />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Opportunity</Label>
              <Input value={deal.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Meeting Date</Label>
              <Input value={formatDate(meeting?.start_at || undefined)} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Meeting Time</Label>
              <Input value={meeting?.start_at ? new Date(meeting.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} readOnly />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Agenda</Label>
              <Textarea value={scheduleForm.agenda || meeting?.notes || ""} readOnly />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Meeting Notes</Label>
              <Textarea value={completeForm.notes} onChange={(event) => setCompleteForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes from the customer conversation" />
            </div>
            <div className="space-y-2">
              <Label>Meeting Outcome</Label>
              <Input value={completeForm.outcome} onChange={(event) => setCompleteForm((current) => ({ ...current, outcome: event.target.value }))} placeholder="Interested / Follow-up / Needs review" />
            </div>
            <div className="space-y-2">
              <Label>Customer Requirements</Label>
              <Input value={completeForm.customerRequirements} onChange={(event) => setCompleteForm((current) => ({ ...current, customerRequirements: event.target.value }))} placeholder="Requirements uncovered" />
            </div>
            <div className="space-y-2">
              <Label>Objections</Label>
              <Input value={completeForm.objections} onChange={(event) => setCompleteForm((current) => ({ ...current, objections: event.target.value }))} placeholder="Objections raised" />
            </div>
            <div className="space-y-2">
              <Label>Budget Discussed</Label>
              <Input value={completeForm.budgetDiscussed} onChange={(event) => setCompleteForm((current) => ({ ...current, budgetDiscussed: event.target.value }))} placeholder="Budget range" />
            </div>
            <div className="space-y-2"> 
              <Label>Timeline</Label>
              <Input value={completeForm.timeline} onChange={(event) => setCompleteForm((current) => ({ ...current, timeline: event.target.value }))} placeholder="This quarter" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Next Actions</Label>
              <Input value={completeForm.nextActions} onChange={(event) => setCompleteForm((current) => ({ ...current, nextActions: event.target.value }))} placeholder="Follow-up steps" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="outline"><Sparkles className="mr-2 h-4 w-4" />Analyze with AI</Button>
            {aiSummary && <div className="flex-1 rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">{aiSummary}</div>}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteMeeting}>Complete Meeting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <article className="proposal-print-document" aria-hidden="true">
        <header className="proposal-print-header">
          <div>
            <div className="proposal-print-brand">FinloNexa</div>
            <div className="proposal-print-kicker">Business Proposal</div>
          </div>
          <div className="proposal-print-meta">
            <div>Proposal ID: {proposalId || "—"}</div>
            <div>Status: {PROPOSAL_UI_LABELS[proposalStatus]}</div>
          </div>
        </header>

        <section className="proposal-print-title-block">
          <div className="proposal-print-kicker">Proposal</div>
          <h1>{proposalForm.title || "Proposal"}</h1>
          <div className="proposal-print-date">Issued {formatDate(proposalForm.proposalDate)} · Valid until {formatDate(proposalForm.validityDate)}</div>
        </section>

        <section className="proposal-print-info-grid">
          <div><strong>Customer</strong><span>{proposalForm.customer || "—"}</span></div>
          <div><strong>Company</strong><span>{proposalForm.company || "—"}</span></div>
          <div><strong>Email</strong><span>{proposalForm.email || "—"}</span></div>
          <div><strong>Phone</strong><span>{proposalForm.phone || "—"}</span></div>
          <div><strong>Opportunity</strong><span>{proposalForm.opportunity || "—"}</span></div>
          <div><strong>Owner</strong><span>{proposalForm.owner || "—"}</span></div>
        </section>

        <section className="proposal-print-section">
          <h2>Executive Summary</h2>
          <p>{proposalForm.solution || "The proposed solution addresses the customer requirements and delivery needs for this opportunity."}</p>
        </section>
        <section className="proposal-print-section">
          <h2>Requirements</h2>
          <p>{proposalForm.requirements || "No detailed requirements provided."}</p>
        </section>
        <section className="proposal-print-section">
          <h2>Scope of Work</h2>
          <p>{proposalForm.scope || proposalForm.deliverables || "Scope to be confirmed during implementation."}</p>
        </section>

        <section className="proposal-print-section proposal-print-items">
          <h2>Products / Services</h2>
          <table>
            <thead>
              <tr><th>Item</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Tax</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {proposalForm.items.filter((item) => item.product || item.description).map((item) => {
                const quantity = Number(item.quantity || 0);
                const unitPrice = Number(item.unitPrice || 0);
                const discount = Number(item.discount || 0);
                const tax = Number(item.tax || 0);
                return (
                  <tr key={item.id}>
                    <td>{item.product || "Service"}</td>
                    <td>{item.description || "—"}</td>
                    <td>{quantity}</td>
                    <td>{formatCurrency(unitPrice, deal.currency)}</td>
                    <td>{formatCurrency(discount, deal.currency)}</td>
                    <td>{formatCurrency(tax, deal.currency)}</td>
                    <td>{formatCurrency(quantity * unitPrice - discount + tax, deal.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="proposal-print-totals">
            <div><span>Subtotal</span><strong>{formatCurrency(proposalTotals.subtotal, deal.currency)}</strong></div>
            <div><span>Discount</span><strong>{formatCurrency(proposalTotals.discount, deal.currency)}</strong></div>
            <div><span>Tax</span><strong>{formatCurrency(proposalTotals.tax, deal.currency)}</strong></div>
            <div className="proposal-print-grand-total"><span>Grand Total</span><strong>{formatCurrency(proposalTotals.total, deal.currency)}</strong></div>
          </div>
        </section>

        <section className="proposal-print-section">
          <h2>Terms &amp; Conditions</h2>
          <p>{proposalForm.terms || "Standard terms and conditions apply."}</p>
        </section>
        <section className="proposal-print-section">
          <h2>Customer Notes</h2>
          <p>{proposalForm.customerNotes || "—"}</p>
        </section>

        <footer className="proposal-print-footer">
          Proposal {proposalId || "—"} · {formatDate(proposalForm.proposalDate)} · FinloNexa
        </footer>
      </article>
    </main>
  );
}
