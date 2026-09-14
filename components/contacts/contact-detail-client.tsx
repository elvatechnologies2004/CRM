"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Building2 } from "lucide-react";

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
import { AddTaskDialog, type NewTaskData } from "@/components/leads/add-task-dialog";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ContactProfileHeader } from "@/components/contacts/contact-profile-header";
import { ContactTabs, type ContactTabKey } from "@/components/contacts/contact-tabs";
import { ContactDetailsPanel } from "@/components/contacts/contact-details-panel";
import { ContactOverview, contactActivityIcons } from "@/components/contacts/contact-overview";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { ContactDealsTab, ContactInvoicesTab } from "@/components/contacts/contact-billing-tabs";
import { CompanyStatusBadge } from "@/components/crm/status-badges";
import { LeadEmails } from "@/components/leads/lead-emails";
import { LeadWhatsApp } from "@/components/leads/lead-whatsapp";
import { LeadMeetings } from "@/components/leads/lead-meetings";
import { LeadTasks } from "@/components/leads/lead-tasks";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadFiles } from "@/components/leads/lead-files";
import { buildContactRecord, type ContactFormData } from "@/lib/contact-form";
import {
  markContactDeleted,
  readContactTasks,
  readStoredContacts,
  updateContactTasks,
  upsertContact,
  writeContactTask,
} from "@/lib/crm-local";
import { useCurrentUser } from "@/lib/current-user";
import type {
  CompanyRecord,
  ContactActivity,
  ContactRecord,
  CrmDeal,
  Invoice,
  LeadEmail,
  LeadFile,
  LeadMeeting,
  LeadNote,
  LeadTask,
  LeadWhatsAppMessage,
  SupportTicket,
  User,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ContactDetailClientProps {
  contact: ContactRecord;
  company: CompanyRecord | null;
  owners: User[];
  activities: ContactActivity[];
  deals: CrmDeal[];
  initialNotes: LeadNote[];
  initialTasks: LeadTask[];
  initialMeetings: LeadMeeting[];
  initialEmails: LeadEmail[];
  initialWhatsApp: LeadWhatsAppMessage[];
  initialFiles: LeadFile[];
  invoices: Invoice[];
  tickets: SupportTicket[];
  companies: CompanyRecord[];
}

function ContactDetailClient({
  contact: initialContact,
  company,
  owners,
  activities,
  deals,
  initialNotes,
  initialTasks,
  initialMeetings,
  initialEmails,
  initialWhatsApp,
  initialFiles,
  invoices,
  tickets,
  companies,
}: ContactDetailClientProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [contact, setContact] = useState<ContactRecord>(initialContact);
  const [archived, setArchived] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [tasks, setTasks] = useState<LeadTask[]>(initialTasks);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [emails, setEmails] = useState(initialEmails);
  const [whatsapp, setWhatsApp] = useState(initialWhatsApp);
  const [files, setFiles] = useState(initialFiles);

  const [tab, setTab] = useState<ContactTabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readStoredContacts();
      const override = stored.find((candidate) => candidate.id === initialContact.id);
      const persistedTasks = readContactTasks();
      const persisted = persistedTasks[initialContact.id];
      if (override) setContact(override);
      if (persisted && persisted.length > 0) {
        setTasks([...persisted, ...initialTasks]);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialContact, initialTasks]);

  const handleEditSubmit = (data: ContactFormData) => {
    const updated = buildContactRecord(data, { existing: contact });
    upsertContact(updated);
    setContact(updated);
    setEditOpen(false);
  };

  const applyPanelEdit = (updated: ContactRecord) => {
    upsertContact(updated);
    setContact(updated);
  };

  const handleTaskSubmit = (task: NewTaskData) => {
    const contactTask: LeadTask = {
      id: `t_${Date.now().toString(36)}`,
      title: task.title,
      due: task.due,
      priority: task.priority,
      status: "Open",
      owner: task.owner,
    };
    writeContactTask(contact.id, contactTask);
    setTasks((prev) => [contactTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    const next = tasks.map((task) =>
      task.id === id
        ? { ...task, status: task.status === "Done" ? ("Open" as const) : ("Done" as const) }
        : task
    );
    updateContactTasks(contact.id, next);
    setTasks(next);
  };

  const deleteTask = (id: string) => {
    const next = tasks.filter((task) => task.id !== id);
    updateContactTasks(contact.id, next);
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
      to: contact.email,
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
    markContactDeleted(contact.id);
    router.push("/contacts");
  };

  const openTaskCount = tasks.filter((task) => task.status === "Open").length;

  return (
    <div className="space-y-4">
      <ContactProfileHeader
        contact={contact}
        archived={archived}
        onBack={() => router.push("/contacts")}
        onEdit={() => setEditOpen(true)}
        onAddTask={() => setTaskOpen(true)}
        onArchive={() => setArchived((prev) => !prev)}
        onDelete={() => setConfirmDeleteOpen(true)}
      />

      <ContactTabs
        active={tab}
        onChange={setTab}
        counts={{
          activity: activities.length,
          deals: deals.length,
          emails: emails.length,
          whatsapp: whatsapp.length,
          meetings: meetings.length,
          tasks: openTaskCount,
          notes: notes.length,
          files: files.length,
          invoices: invoices.length,
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {tab === "overview" && (
            <ContactOverview
              contact={contact}
              onScheduleCall={() => setTab("meetings")}
              onDraftEmail={() => setTab("emails")}
              onViewAllActivity={() => setTab("activity")}
            />
          )}
          {tab === "activity" && (
            <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline
                  activities={activities}
                  iconMap={contactActivityIcons}
                />
              </CardContent>
            </Card>
          )}
          {tab === "deals" && (
            <ContactDealsTab
              deals={deals}
              owners={owners}
              category={`contact-${contact.id}`}
            />
          )}
          {tab === "emails" && (
            <LeadEmails
              emails={emails}
              authorEmail={currentUser?.email ?? ""}
              recipient={contact.email}
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
          {tab === "invoices" && <ContactInvoicesTab invoices={invoices} />}
        </div>

        <div className="min-w-0">
          <div className={cn("space-y-4 lg:sticky lg:top-20")}>
            <ContactDetailsPanel contact={contact} onApply={applyPanelEdit} />
            {company && (
              <CompanyCard company={company} ticketCount={tickets.length} />
            )}
          </div>
        </div>
      </div>

      <AddContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        owners={owners}
        companies={companies}
        contacts={[contact]}
        initial={contactToForm(contact)}
        mode="edit"
        onSubmit={handleEditSubmit}
        onViewExisting={(existing) => {
          setEditOpen(false);
          router.push(`/contacts/${existing.id}`);
        }}
      />

      <AddTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        owners={owners}
        defaultOwner={contact.ownerName}
        onSubmit={handleTaskSubmit}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
            <DialogDescription>
              This will permanently remove {contact.firstName} {contact.lastName} from
              your contacts. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function contactToForm(contact: ContactRecord): Partial<ContactFormData> {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    jobTitle: contact.jobTitle,
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    companyId: contact.companyId ?? "",
    companyName: contact.companyName,
    lifecycleStage: contact.lifecycleStage,
    ownerName: contact.ownerName,
    source: contact.source,
    country: contact.country,
    city: contact.city,
    address: contact.address,
    tags: contact.tags.join(", "),
    preferredChannel: contact.preferredChannel,
    preferredLanguage: contact.preferredLanguage ?? "English",
  };
}

function CompanyCard({ company, ticketCount }: { company: CompanyRecord; ticketCount: number }) {
  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
          Company
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{company.name}</p>
          <CompanyStatusBadge status={company.accountStatus} />
        </div>
        <p className="text-xs text-muted-foreground">
          {company.city}, {company.country} · {company.companySize} people
        </p>
        <a
          href={`/companies/${company.id}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          View company profile
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
        <p className="text-xs text-muted-foreground">
          {ticketCount} open-issue {ticketCount === 1 ? "ticket" : "tickets"} for this company
        </p>
      </CardContent>
    </Card>
  );
}

export { ContactDetailClient };