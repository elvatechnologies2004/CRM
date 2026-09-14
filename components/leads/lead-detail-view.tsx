"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { AddTaskDialog, type NewTaskData } from "@/components/leads/add-task-dialog";
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog";
import { LeadProfileHeader } from "@/components/leads/lead-profile-header";
import { LeadTabs, type LeadTabKey } from "@/components/leads/lead-tabs";
import { LeadOverview } from "@/components/leads/lead-overview";
import { LeadActivityTimeline } from "@/components/leads/lead-activity-timeline";
import { LeadDetailsPanel } from "@/components/leads/lead-details-panel";
import { LeadQualification } from "@/components/leads/lead-qualification";
import { LeadTasks } from "@/components/leads/lead-tasks";
import { LeadMeetings } from "@/components/leads/lead-meetings";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadEmails } from "@/components/leads/lead-emails";
import { LeadWhatsApp } from "@/components/leads/lead-whatsapp";
import { LeadFiles } from "@/components/leads/lead-files";
import { buildLeadRecord, type LeadFormData } from "@/lib/lead-form";
import {
  markLeadDeleted,
  readConvertedDeals,
  readPersistedTasks,
  updatePersistedTasks,
  writeConvertedDeal,
  writePersistedTask,
} from "@/lib/lead-local";
import { useCurrentUser } from "@/lib/current-user";
import type {
  AuthorityLevel,
  BudgetLevel,
  LeadActivity,
  LeadEmail,
  LeadFile,
  LeadMeeting,
  LeadNote,
  LeadRecord,
  LeadTask,
  LeadWhatsAppMessage,
  NeedLevel,
  TimelineLevel,
  User,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeadDetailViewProps {
  lead: LeadRecord;
  owners: User[];
  activities: LeadActivity[];
  initialNotes: LeadNote[];
  initialTasks: LeadTask[];
  initialMeetings: LeadMeeting[];
  initialEmails: LeadEmail[];
  initialWhatsApp: LeadWhatsAppMessage[];
  initialFiles: LeadFile[];
}

const budgetScore: Record<BudgetLevel, number> = {
  Confirmed: 28,
  Estimated: 16,
  Unclear: 4,
};
const authorityScore: Record<AuthorityLevel, number> = {
  "Likely Decision Maker": 26,
  Influencer: 12,
  Unknown: 3,
};
const needScore: Record<NeedLevel, number> = {
  Strong: 24,
  Moderate: 12,
  Weak: 4,
};
const timelineScore: Record<TimelineLevel, number> = {
  "< 1 Month": 22,
  "1–2 Months": 18,
  "This Quarter": 9,
  "6+ Months": 3,
};

function computeQualificationScore(q: {
  budget: BudgetLevel;
  authority: AuthorityLevel;
  need: NeedLevel;
  timeline: TimelineLevel;
}) {
  return budgetScore[q.budget] + authorityScore[q.authority] + needScore[q.need] + timelineScore[q.timeline];
}

function leadToForm(lead: LeadRecord): Partial<LeadFormData> {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    companyName: lead.companyName,
    jobTitle: lead.jobTitle,
    country: lead.country,
    city: lead.city,
    source: lead.source,
    status: lead.status,
    ownerName: lead.ownerName,
    expectedValue: lead.expectedValue ? String(lead.expectedValue) : "",
    interest: lead.interest,
    tags: lead.tags.join(", "),
    notes: "",
  };
}

function LeadDetailView({
  lead: initialLead,
  owners,
  activities,
  initialNotes,
  initialTasks,
  initialMeetings,
  initialEmails,
  initialWhatsApp,
  initialFiles,
}: LeadDetailViewProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [lead, setLead] = useState(initialLead);
  const [convertedDealId, setConvertedDealId] = useState<string | undefined>(
    initialLead.convertedDealId
  );
  const [archived, setArchived] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [tasks, setTasks] = useState<LeadTask[]>(initialTasks);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [emails, setEmails] = useState(initialEmails);
  const [whatsapp, setWhatsApp] = useState(initialWhatsApp);
  const [files, setFiles] = useState(initialFiles);

  const [tab, setTab] = useState<LeadTabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const converted = readConvertedDeals();
      const convertedValue = converted[initialLead.id];
      if (convertedValue) {
        setConvertedDealId(convertedValue);
      }
      const persistedTasks = readPersistedTasks();
      const persisted = persistedTasks[initialLead.id];
      if (persisted && persisted.length > 0) {
        setTasks([...persisted, ...initialTasks]);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialLead, initialTasks]);

  const updateLead = (patch: Partial<LeadRecord>) =>
    setLead((prev) => ({ ...prev, ...patch }));

  const updateQualification = (
    patch: Partial<Omit<LeadRecord["qualification"], "score">>
  ) => {
    setLead((prev) => {
      const nextQualification = { ...prev.qualification, ...patch };
      return {
        ...prev,
        qualification: {
          ...nextQualification,
          score: computeQualificationScore(nextQualification),
        },
      };
    });
  };

  const handleEditSubmit = (data: LeadFormData) => {
    const updated = buildLeadRecord(data, { owners, existing: lead });
    setLead((prev) => ({
      ...updated,
      qualification: prev.qualification,
      convertedDealId: prev.convertedDealId,
    }));
    setEditOpen(false);
  };

  const handleConvert = (_lead: LeadRecord, dealId: string) => {
    writeConvertedDeal(initialLead.id, dealId);
    setConvertedDealId(dealId);
  };

  const handleTaskSubmit = (task: NewTaskData) => {
    const leadTask: LeadTask = {
      id: `t_${Date.now().toString(36)}`,
      title: task.title,
      due: task.due,
      priority: task.priority,
      status: "Open",
      owner: task.owner,
    };
    writePersistedTask(initialLead.id, leadTask);
    setTasks((prev) => [leadTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    const next = tasks.map((task) => {
      if (task.id !== id) return task;
      return {
        ...task,
        status: task.status === "Done" ? ("Open" as const) : ("Done" as const),
      };
    });
    updatePersistedTasks(initialLead.id, next);
    setTasks(next);
  };

  const deleteTask = (id: string) => {
    const next = tasks.filter((task) => task.id !== id);
    updatePersistedTasks(initialLead.id, next);
    setTasks(next);
  };

  const addNote = (body: string) => {
    const note: LeadNote = {
      id: `n_${Date.now().toString(36)}`,
      body,
      author: currentUser?.name ?? "",
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
  };

  const updateNote = (id: string, body: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, body } : note)));
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note))
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const addMeeting = (meeting: LeadMeeting) => {
    setMeetings((prev) => [meeting, ...prev]);
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((meeting) => meeting.id !== id));
  };

  const sendEmail = (subject: string, body: string) => {
    const email: LeadEmail = {
      id: `e_${Date.now().toString(36)}`,
      subject,
      body,
      direction: "out",
      from: currentUser?.email ?? "",
      to: lead.email,
      date: new Date().toISOString(),
    };
    setEmails((prev) => [email, ...prev]);
  };

  const sendWhatsApp = (text: string) => {
    const message: LeadWhatsAppMessage = {
      id: `w_${Date.now().toString(36)}`,
      from: "agent",
      text,
      time: new Date().toISOString(),
    };
    setWhatsApp((prev) => [...prev, message]);
  };

  const addFile = (file: LeadFile) => {
    setFiles((prev) => [file, ...prev]);
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleDeleteConfirm = () => {
    markLeadDeleted(initialLead.id);
    router.push("/leads");
  };

  return (
    <div className="space-y-4">
      <LeadProfileHeader
        lead={lead}
        convertedDealId={convertedDealId}
        archived={archived}
        onBack={() => router.push("/leads")}
        onEdit={() => setEditOpen(true)}
        onConvert={() => setConvertOpen(true)}
        onAddTask={() => setTaskOpen(true)}
        onArchive={() => setArchived((prev) => !prev)}
        onDelete={() => setConfirmDeleteOpen(true)}
      />

      <LeadTabs
        active={tab}
        onChange={setTab}
        counts={{
          activity: activities.length,
          emails: emails.length,
          whatsapp: whatsapp.length,
          meetings: meetings.length,
          tasks: tasks.length,
          notes: notes.length,
          files: files.length,
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {tab === "overview" && (
            <LeadOverview
              lead={lead}
              activities={activities}
              onScheduleCall={() => setTab("meetings")}
              onDraftEmail={() => setTab("emails")}
            />
          )}
          {tab === "activity" && (
            <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadActivityTimeline activities={activities} />
              </CardContent>
            </Card>
          )}
          {tab === "emails" && (
            <LeadEmails
              emails={emails}
              authorEmail={currentUser?.email ?? ""}
              recipient={lead.email}
              onSend={sendEmail}
            />
          )}
          {tab === "whatsapp" && <LeadWhatsApp messages={whatsapp} onSend={sendWhatsApp} />}
          {tab === "meetings" && (
            <LeadMeetings meetings={meetings} onAdd={addMeeting} onDelete={deleteMeeting} />
          )}
          {tab === "tasks" && (
            <LeadTasks tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAdd={() => setTaskOpen(true)} />
          )}
          {tab === "notes" && (
            <LeadNotes
              notes={notes}
              author={currentUser?.name ?? ""}
              onAdd={addNote}
              onUpdate={updateNote}
              onTogglePin={togglePin}
              onDelete={deleteNote}
            />
          )}
          {tab === "files" && <LeadFiles files={files} onAdd={addFile} onDelete={deleteFile} />}
        </div>

        <div className="min-w-0">
          <div className={cn("space-y-4 lg:sticky lg:top-20")}>
            <LeadDetailsPanel lead={lead} owners={owners} onUpdate={updateLead} />
            <LeadQualification
              qualification={lead.qualification}
              onChange={updateQualification}
            />
          </div>
        </div>
      </div>

      <AddLeadDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        owners={owners}
        initial={leadToForm(lead)}
        mode="edit"
        onSubmit={handleEditSubmit}
      />

      <ConvertLeadDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        lead={lead}
        owners={owners}
        onConvert={handleConvert}
      />

      <AddTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        owners={owners}
        defaultOwner={lead.ownerName}
        onSubmit={handleTaskSubmit}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete lead?</DialogTitle>
            <DialogDescription>
              This will permanently remove {lead.firstName} {lead.lastName} from your leads.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { LeadDetailView };