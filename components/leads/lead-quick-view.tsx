"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Loader2,
  Mail,
  MessageSquarePlus,
  Phone,
  Plus,
  Sparkles,
  StickyNote,
  User as UserIcon,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { InitialsAvatar } from "@/components/ui/avatar";
import { LeadActivityTimeline } from "@/components/leads/lead-activity-timeline";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { fullName } from "@/components/leads/lead-row";
import {
  addLeadNoteAction,
  getLeadQuickViewAction,
  type LeadQuickViewData,
} from "@/app/leads/actions";
import type { LeadRecord, LeadStatus, User } from "@/lib/types";
import { cn } from "@/lib/utils";

const stageOptions: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Unqualified",
];

interface LeadQuickViewProps {
  lead: LeadRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: User[];
  onStageChange: (leadId: string, status: LeadStatus) => void;
  onRequestUnqualified: (lead: LeadRecord) => void;
  onCreateProposal: (lead: LeadRecord) => void;
  onAddTask: (lead: LeadRecord) => void;
  onOpenFullPage: (leadId: string) => void;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function LeadQuickView({
  lead,
  open,
  onOpenChange,
  onStageChange,
  onRequestUnqualified,
  onCreateProposal,
  onAddTask,
  onOpenFullPage,
}: LeadQuickViewProps) {
  const leadId = lead?.id ?? null;
  const [data, setData] = useState<LeadQuickViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  if (open && leadId && leadId !== activeId) {
    setActiveId(leadId);
    setLoading(true);
    setData(null);
    setNoteText("");
    setNoteError(null);
  }

  useEffect(() => {
    if (!open || !leadId) return;
    let cancelled = false;
    getLeadQuickViewAction(leadId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  if (!lead) return null;

  const notes = data?.notes ?? [];
  const activities = data?.activities ?? [];
  const tasks = data?.tasks ?? [];
  const nextTask = tasks.find((task) => task.status !== "Done") ?? tasks[0];

  const handleAddNote = async () => {
    const body = noteText.trim();
    if (!body || !leadId) return;
    setSavingNote(true);
    setNoteError(null);
    const result = await addLeadNoteAction(leadId, body);
    if (result.error) {
      setNoteError(result.error);
      setSavingNote(false);
      return;
    }
    setData((prev) =>
      prev
        ? {
            ...prev,
            notes: [
              {
                id: `local_${Date.now().toString(36)}`,
                body,
                author: "You",
                createdAt: new Date().toISOString(),
              },
              ...prev.notes,
            ],
          }
        : prev
    );
    setNoteText("");
    setSavingNote(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="inset-y-0 left-auto right-0 top-0 h-full max-h-screen w-full max-w-md translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none rounded-l-2xl p-0 sm:rounded-l-2xl sm:rounded-r-none"
        aria-describedby={undefined}
      >
        <DialogHeader className="sticky top-0 z-10 gap-0 border-b border-border bg-card/95 p-5 backdrop-blur">
          <div className="flex items-start gap-3 pr-8">
            <InitialsAvatar name={fullName(lead)} className="h-10 w-10 text-sm" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">{fullName(lead)}</DialogTitle>
              <DialogDescription className="truncate">
                {lead.companyName || "No company"}
                {lead.jobTitle ? ` · ${lead.jobTitle}` : ""}
              </DialogDescription>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <LeadStatusBadge status={lead.status} converted={Boolean(lead.convertedDealId)} />
            <LeadSourceBadge source={lead.source} />
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Score {lead.score}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-5 p-5">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              asChild
              disabled={!lead.phone}
            >
              <a href={lead.phone ? `tel:${lead.phone}` : undefined}>
                <Phone className="h-3.5 w-3.5" aria-hidden />
                Call
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild disabled={!lead.email}>
              <a href={lead.email ? `mailto:${lead.email}` : undefined}>
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Email
              </a>
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAddTask(lead)}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Create Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpenFullPage(lead.id)}>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              Full profile
            </Button>
          </div>

          {/* Stage actions */}
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Move stage
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stageOptions.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  disabled={stage === lead.status}
                  onClick={() => {
                    if (stage === "Unqualified") onRequestUnqualified(lead);
                    else onStageChange(lead.id, stage);
                  }}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    stage === lead.status
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStageChange(lead.id, "Qualified")}
                disabled={lead.status === "Qualified"}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Qualify Lead
              </Button>
              <Button size="sm" onClick={() => onCreateProposal(lead)}>
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Create Proposal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRequestUnqualified(lead)}
                disabled={lead.status === "Unqualified"}
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden />
                Mark Unqualified
              </Button>
            </div>
          </div>

          {/* Lead info */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Lead information
            </h3>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <InfoRow icon={Mail} label="Email" value={lead.email || "—"} />
              <InfoRow icon={Phone} label="Phone" value={lead.phone || "—"} />
              <InfoRow
                icon={Building2}
                label="Company"
                value={lead.companyName || "—"}
              />
              <InfoRow
                icon={CircleDollarSign}
                label="Expected value"
                value={formatCurrency(lead.expectedValue, lead.currency)}
              />
              <InfoRow icon={UserIcon} label="Owner" value={lead.ownerName || "Unassigned"} />
              {lead.interest && (
                <InfoRow icon={Briefcase} label="Interest" value={lead.interest} />
              )}
            </dl>
          </section>

          {/* Next task */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Next task
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Loading…
              </div>
            ) : nextTask ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{nextTask.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {nextTask.due ? nextTask.due : "No due date"} · {nextTask.priority} priority
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                No tasks yet. Create one to follow up.
              </p>
            )}
          </section>

          {/* Notes */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5" aria-hidden />
              Notes
            </h3>
            <div className="space-y-2">
              <Textarea
                rows={2}
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Add a note…"
              />
              {noteError && <p className="text-xs text-danger">{noteError}</p>}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || savingNote}
                >
                  {savingNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Add Note
                </Button>
              </div>
              {notes.length > 0 ? (
                <ul className="space-y-2">
                  {notes.slice(0, 5).map((note) => (
                    <li
                      key={note.id}
                      className="rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <p className="text-ink">{note.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {note.author} ·{" "}
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No notes yet.</p>
              )}
            </div>
          </section>

          {/* Activities */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent activity
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Loading…
              </div>
            ) : (
              <LeadActivityTimeline activities={activities} limit={6} />
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InfoRowProps {
  icon: typeof Mail;
  label: string;
  value: string;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <dt className="w-32 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-ink">{value}</dd>
    </div>
  );
}

export { LeadQuickView };
