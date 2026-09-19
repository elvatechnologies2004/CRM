"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Circle, Flag, MessageSquareText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExportDataDialog } from "@/components/exports/export-data-dialog";
import { AddLeadDialog, type AddLeadFormState } from "@/components/leads/add-lead-dialog";
import { RecordManagementMenu } from "@/components/crm/record-management-menu";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getLeadNextStep } from "@/lib/leads-workflow";
import { createLeadActivityAction, logLeadContactAction, updateLeadAction } from "@/app/leads/actions";
import type { LeadRecord, LeadStatus, User } from "@/lib/types";

const methods = ["Call", "Email", "WhatsApp", "Meeting", "Other"] as const;
const unqualifiedReasons = [
  "No Budget",
  "No Requirement",
  "Not Decision Maker",
  "Bad Fit",
  "No Response",
  "Timing",
  "Duplicate",
  "Invalid Lead",
  "Other",
] as const;

function formatValue(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function leadStageBadge(stage: LeadStatus) {
  const map: Record<LeadStatus, "secondary" | "info" | "success" | "danger"> = {
    New: "secondary",
    Contacted: "info",
    Qualified: "success",
    Unqualified: "danger",
    Proposal: "secondary",
  };
  return map[stage] ?? "outline";
}

interface LeadDetailClientProps {
  lead: LeadRecord;
  owners: User[];
}

export function LeadDetailClient({ lead: initialLead, owners }: LeadDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lead, setLead] = useState(initialLead);
  const [contactMethod, setContactMethod] = useState<(typeof methods)[number]>("Call");
  const [contactDate, setContactDate] = useState(new Date().toISOString().slice(0, 16));
  const [contactOutcome, setContactOutcome] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [logContactOpen, setLogContactOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [qualificationOpen, setQualificationOpen] = useState(false);
  const [qualificationForm, setQualificationForm] = useState({
    budget: "",
    authority: "",
    need: "Strong",
    timeline: "This Quarter",
    expectedValue: "",
    requirements: "",
    notes: "",
  });
  const [conversionOpen, setConversionOpen] = useState(false);
  const [conversionDraft, setConversionDraft] = useState({
    opportunityName: "",
    value: "",
    expectedCloseDate: "",
    owner: "",
    description: "",
  });
  const [unqualifiedOpen, setUnqualifiedOpen] = useState(false);
  const [unqualifiedReason, setUnqualifiedReason] = useState<(typeof unqualifiedReasons)[number]>("No Budget");
  const [unqualifiedNotes, setUnqualifiedNotes] = useState("");
  const [conversionLoading, setConversionLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1");
  const [editLoading, setEditLoading] = useState(false);

  const isConverted = Boolean(lead.convertedDealId);
  const displayStatus = isConverted ? "Converted" : lead.status;
  const workflow = useMemo(() => getLeadNextStep(lead.status), [lead.status]);
  const leadEditInitial: AddLeadFormState = {
    customerName: `${lead.firstName} ${lead.lastName}`.trim(),
    company: lead.companyName,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    owner: lead.ownerName,
    notes: lead.interest,
  };

  const handleLeadUpdate = async (values: AddLeadFormState) => {
    setEditLoading(true);
    try {
      const nameParts = values.customerName.trim().split(/\s+/);
      const result = await updateLeadAction(lead.id, {
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        companyName: values.company,
        email: values.email,
        phone: values.phone,
        source: values.source,
        ownerId: owners.find((owner) => owner.name === values.owner)?.id,
        notes: values.notes,
      });
      if (!result.lead) {
        window.alert(result.error || "Failed to update lead.");
        return;
      }
      setLead(result.lead);
      router.refresh();
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogContact = async () => {
    const result = await logLeadContactAction(lead.id, {
      method: contactMethod,
      occurredAt: new Date(contactDate).toISOString(),
      outcome: contactOutcome,
      notes: contactNotes,
    });

    if (!result.ok) {
      window.alert(result.message || "Unable to log contact.");
      return;
    }

    const next = await updateLeadAction(lead.id, { status: "Contacted" });
    if (next.lead) setLead(next.lead);
    setLogContactOpen(false);
    setApprovalOpen(false);
    router.refresh();
  };

  const handleApproveContact = async () => {
    const result = await updateLeadAction(lead.id, { status: "Contacted" });
    if (result.lead) setLead(result.lead);
    setApprovalOpen(false);
    await createLeadActivityAction(lead.id, "Moved to Contacted", "Customer contact approved and stage advanced to Contacted.", "lead_stage_changed");
    router.refresh();
  };

  const handleApproveQualification = async () => {
    const result = await updateLeadAction(lead.id, { status: "Qualified" });
    if (result.lead) setLead(result.lead);
    setQualificationOpen(false);
    await createLeadActivityAction(lead.id, "Qualification Completed", "Qualification was approved and the lead moved to Qualified.", "lead_stage_changed");
    router.refresh();
  };

  const handleMarkUnqualified = async () => {
    const result = await updateLeadAction(lead.id, {
      status: "Unqualified",
      unqualifiedReason,
      unqualifiedNotes,
    });
    if (result.lead) setLead(result.lead);
    setUnqualifiedOpen(false);
    await createLeadActivityAction(lead.id, "Marked Unqualified", `Reason: ${unqualifiedReason}${unqualifiedNotes ? ` · ${unqualifiedNotes}` : ""}`, "lead_stage_changed");
    router.refresh();
  };

  const handleConvertToOpportunity = async () => {
    if (!lead || lead.status !== "Qualified") {
      window.alert("Only qualified leads can convert to an opportunity.");
      return;
    }

    setConversionLoading(true);
    try {
      const result = await import("@/app/leads/actions").then((mod) => mod.convertLeadAction(lead.id, {
        name: conversionDraft.opportunityName || undefined,
        value: conversionDraft.value ? Number(conversionDraft.value) : lead.expectedValue || undefined,
        expectedCloseDate: conversionDraft.expectedCloseDate || undefined,
        ownerId: owners.find((owner) => owner.name === conversionDraft.owner)?.id || lead.ownerId || undefined,
        description: conversionDraft.description || undefined,
      }));

      if (!result.ok) {
        window.alert(result.message || result.error || "Opportunity creation failed.");
        return;
      }

      setLead({ ...lead, convertedDealId: result.dealId, status: "Qualified" });
      setConversionOpen(false);
      router.refresh();
    } finally {
      setConversionLoading(false);
    }
  };

  const nextStepDescription =
    lead.status === "New"
      ? "Contact this lead and record the interaction before continuing to qualification."
      : lead.status === "Contacted"
        ? "Review the customer's need, budget, authority and timeline."
        : lead.status === "Qualified"
          ? "This Lead is qualified and ready to become a sales Opportunity."
          : "This lead has been closed as unqualified.";

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-ink">{`${lead.firstName} ${lead.lastName}`.trim() || "Lead"}</h1>
            <Badge variant={leadStageBadge(lead.status)}>{displayStatus}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Lead detail and sales progression.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}>Export Data</Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>
          <RecordManagementMenu type="lead" id={lead.id} name={`${lead.firstName} ${lead.lastName}`.trim() || "Lead"} converted={isConverted} directDelete onRefresh={() => router.refresh()} />
          <Button variant="outline" onClick={() => router.push("/leads")}>Back to Leads</Button>
        </div>
      </div>

      <ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} defaultScope="lead" recordId={lead.id} title="Export Lead" />
      <AddLeadDialog
        open={editOpen}
        owners={owners.map((owner) => owner.name)}
        initial={leadEditInitial}
        mode="edit"
        loading={editLoading}
        onOpenChange={setEditOpen}
        onCreate={async () => undefined}
        onUpdate={handleLeadUpdate}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Customer Name</div><div className="mt-1 font-medium text-ink">{formatValue(`${lead.firstName} ${lead.lastName}`)}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Company</div><div className="mt-1 font-medium text-ink">{formatValue(lead.companyName)}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Email</div><div className="mt-1 font-medium text-ink">{formatValue(lead.email)}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Phone</div><div className="mt-1 font-medium text-ink">{formatValue(lead.phone)}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Source</div><div className="mt-1 font-medium text-ink">{formatValue(lead.source)}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Owner</div><div className="mt-1 font-medium text-ink">{formatValue(lead.ownerName)}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Current Stage</div><div className="mt-1 font-medium text-ink">{formatValue(lead.status)}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Created Date</div><div className="mt-1 font-medium text-ink">{new Date(lead.createdAt).toLocaleDateString()}</div></div>
            <div><div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Last Activity</div><div className="mt-1 font-medium text-ink">{new Date(lead.lastActivityAt).toLocaleDateString()}</div></div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Flag className="h-4 w-4" />
            Next Step
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink">{workflow.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{nextStepDescription}</p>

          {lead.status === "Unqualified" ? null : (
            <div className="mt-4 flex flex-wrap gap-2">
              {workflow.primaryAction === "Log Contact" && (
                <Button onClick={() => setLogContactOpen(true)}>{workflow.primaryAction}</Button>
              )}
              {workflow.primaryAction === "Start Qualification" && (
                <Button onClick={() => setQualificationOpen(true)}>{workflow.primaryAction}</Button>
              )}
              {workflow.primaryAction === "Convert to Opportunity" && !isConverted && (
                <Button onClick={() => {
                  const owner = owners.find((candidate) => candidate.id === lead.ownerId)?.name || lead.ownerName || "";
                  setConversionDraft({
                    opportunityName: `${lead.companyName || `${lead.firstName} ${lead.lastName}`.trim() || "Customer"}${lead.companyName ? ` - ${`${lead.firstName} ${lead.lastName}`.trim() || "Customer"}` : " Opportunity"}`,
                    value: lead.expectedValue ? String(lead.expectedValue) : "",
                    expectedCloseDate: "",
                    owner,
                    description: lead.interest || lead.budget || "",
                  });
                  setConversionOpen(true);
                }}>{workflow.primaryAction}</Button>
              )}
              {isConverted && (
                <>
                  <Button onClick={() => router.push(`/opportunities/${lead.convertedDealId}`)}>Open Opportunity</Button>
                  <Button variant="outline" onClick={() => router.push("/leads")}>Back to Leads</Button>
                </>
              )}
              {(lead.status === "New" || lead.status === "Contacted") && (
                <Button variant="outline" onClick={() => setUnqualifiedOpen(true)}>Mark Unqualified</Button>
              )}
            </div>
          )}
        </Card>
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
              <span className={step.state === "current" ? "font-semibold text-ink" : "text-muted-foreground"}>{step.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={logContactOpen} onOpenChange={setLogContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Customer Contact</DialogTitle>
            <DialogDescription>Record the interaction and prepare the next stage approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contact Method *</Label>
              <Select value={contactMethod} onValueChange={(value) => setContactMethod(value as (typeof methods)[number])}>
                <SelectTrigger>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-date">Contact Date / Time *</Label>
              <Input id="contact-date" type="datetime-local" value={contactDate} onChange={(event) => setContactDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-outcome">Outcome</Label>
              <Input id="contact-outcome" value={contactOutcome} onChange={(event) => setContactOutcome(event.target.value)} placeholder="Positive interest" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea id="contact-notes" value={contactNotes} onChange={(event) => setContactNotes(event.target.value)} placeholder="Key details from the conversation" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogContactOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!contactOutcome.trim()) {
                window.alert("Outcome is required.");
                return;
              }
              setApprovalOpen(true);
            }}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Contact Completed</DialogTitle>
            <DialogDescription>Customer: {lead.firstName} {lead.lastName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Method:</span> {contactMethod}</p>
            <p><span className="font-medium">Outcome:</span> {contactOutcome}</p>
            <p className="mt-3">Recommended Next Stage: NEW → CONTACTED</p>
            <p className="text-muted-foreground">The customer contact has been recorded. Would you like to move this Lead to Contacted?</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setApprovalOpen(false)}>Stay in New</Button>
            <Button onClick={handleApproveContact}>Approve & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qualificationOpen} onOpenChange={setQualificationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Qualify Lead</DialogTitle>
            <DialogDescription>Capture the qualification details before approval.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Budget</Label><Input value={qualificationForm.budget} onChange={(e) => setQualificationForm((p) => ({ ...p, budget: e.target.value }))} placeholder="Budget range" /></div>
            <div className="space-y-2"><Label>Authority</Label><Input value={qualificationForm.authority} onChange={(e) => setQualificationForm((p) => ({ ...p, authority: e.target.value }))} placeholder="Decision maker" /></div>
            <div className="space-y-2"><Label>Need *</Label><Select value={qualificationForm.need} onValueChange={(value) => setQualificationForm((p) => ({ ...p, need: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Strong">Strong</SelectItem><SelectItem value="Moderate">Moderate</SelectItem><SelectItem value="Weak">Weak</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Timeline</Label><Input value={qualificationForm.timeline} onChange={(e) => setQualificationForm((p) => ({ ...p, timeline: e.target.value }))} placeholder="This Quarter" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Expected Opportunity Value</Label><Input value={qualificationForm.expectedValue} onChange={(e) => setQualificationForm((p) => ({ ...p, expectedValue: e.target.value }))} placeholder="250000" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Customer Requirements</Label><Textarea value={qualificationForm.requirements} onChange={(e) => setQualificationForm((p) => ({ ...p, requirements: e.target.value }))} placeholder="What does the customer need?" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea value={qualificationForm.notes} onChange={(e) => setQualificationForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Additional context" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQualificationOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!qualificationForm.need.trim()) {
                window.alert("Need is required.");
                return;
              }
              setQualificationOpen(false);
              setApprovalOpen(true);
            }}><Sparkles className="h-4 w-4" />Analyze with AI</Button>
            <Button onClick={handleApproveQualification}>Approve & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={conversionOpen} onOpenChange={setConversionOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert to Opportunity</DialogTitle>
            <DialogDescription>This Lead is qualified and ready to become an Opportunity.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Customer Information</p>
                <div className="mt-3 grid gap-3 text-sm">
                  <div><span className="font-medium">Customer Name:</span> {`${lead.firstName} ${lead.lastName}`.trim() || "—"}</div>
                  <div><span className="font-medium">Company:</span> {lead.companyName || "—"}</div>
                  <div><span className="font-medium">Email:</span> {lead.email || "—"}</div>
                  <div><span className="font-medium">Phone:</span> {lead.phone || "—"}</div>
                  <div><span className="font-medium">Source:</span> {lead.source || "—"}</div>
                  <div><span className="font-medium">Owner:</span> {lead.ownerName || "—"}</div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Qualification Information</p>
                <div className="mt-3 grid gap-3 text-sm">
                  <div><span className="font-medium">Need:</span> {lead.qualification?.need || "—"}</div>
                  <div><span className="font-medium">Budget:</span> {lead.budget || "—"}</div>
                  <div><span className="font-medium">Authority:</span> {lead.qualification?.authority || "—"}</div>
                  <div><span className="font-medium">Timeline:</span> {lead.qualification?.timeline || "—"}</div>
                  <div><span className="font-medium">Customer Requirements:</span> {lead.interest || "—"}</div>
                  <div><span className="font-medium">Expected Opportunity Value:</span> {lead.expectedValue ? `${lead.currency} ${lead.expectedValue}` : "—"}</div>
                  <div><span className="font-medium">Qualification Notes:</span> {lead.interest || lead.budget || "—"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opp-name">Opportunity Name *</Label>
                <Input id="opp-name" value={conversionDraft.opportunityName} onChange={(event) => setConversionDraft((current) => ({ ...current, opportunityName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-value">Opportunity Value</Label>
                <Input id="opp-value" type="number" value={conversionDraft.value} onChange={(event) => setConversionDraft((current) => ({ ...current, value: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-close-date">Expected Close Date</Label>
                <Input id="opp-close-date" type="date" value={conversionDraft.expectedCloseDate} onChange={(event) => setConversionDraft((current) => ({ ...current, expectedCloseDate: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-owner">Owner</Label>
                <Select value={conversionDraft.owner} onValueChange={(value) => setConversionDraft((current) => ({ ...current, owner: value }))}>
                  <SelectTrigger id="opp-owner">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.name}>{owner.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-notes">Description / Opportunity Notes</Label>
                <Textarea id="opp-notes" value={conversionDraft.description} onChange={(event) => setConversionDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Opportunity context and next milestone." />
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Initial Stage</div>
                <div className="mt-2 font-medium text-ink">New Opportunity</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Conversion Summary</div>
            <div className="mt-3 space-y-2 text-sm">
              <div><span className="font-medium">Lead:</span> {`${lead.firstName} ${lead.lastName}`.trim() || "—"}</div>
              <div><span className="font-medium">Company:</span> {lead.companyName || "—"}</div>
              <div><span className="font-medium">Opportunity:</span> {conversionDraft.opportunityName || "—"}</div>
              <div><span className="font-medium">Value:</span> {conversionDraft.value ? `${lead.currency || "PKR"} ${conversionDraft.value}` : lead.expectedValue ? `${lead.currency || "PKR"} ${lead.expectedValue}` : "—"}</div>
              <div><span className="font-medium">Owner:</span> {conversionDraft.owner || lead.ownerName || "—"}</div>
              <div><span className="font-medium">Initial Stage:</span> New Opportunity</div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setConversionOpen(false)} disabled={conversionLoading}>Cancel</Button>
            <Button variant="secondary" onClick={() => setConversionOpen(false)} disabled={conversionLoading}>Back to Edit</Button>
            <Button onClick={handleConvertToOpportunity} disabled={conversionLoading || !conversionDraft.opportunityName.trim()}>
              {conversionLoading ? "Creating..." : "Approve & Create Opportunity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unqualifiedOpen} onOpenChange={setUnqualifiedOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mark Lead as Unqualified?</DialogTitle>
            <DialogDescription>Choose a reason before confirming this exit state.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={unqualifiedReason} onValueChange={(value) => setUnqualifiedReason(value as (typeof unqualifiedReasons)[number])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {unqualifiedReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={unqualifiedNotes} onChange={(event) => setUnqualifiedNotes(event.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnqualifiedOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMarkUnqualified}>Confirm Unqualified</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
