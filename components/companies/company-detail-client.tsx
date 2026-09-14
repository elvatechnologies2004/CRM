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
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CompanyProfileHeader } from "@/components/companies/company-profile-header";
import { CompanyTabs, type CompanyTabKey } from "@/components/companies/company-tabs";
import { CompanyDetailsPanel } from "@/components/companies/company-details-panel";
import { CompanyOverview, companyActivityIcons } from "@/components/companies/company-overview";
import { CompanyContactsTab } from "@/components/companies/company-contacts-tab";
import { CompanyRelationshipsCard } from "@/components/companies/company-relationships-card";
import { CompanyDealsTab, CompanyInvoicesTab, CompanyProjectsTab, CompanyTicketsTab } from "@/components/companies/company-services-tabs";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadFiles } from "@/components/leads/lead-files";
import { buildCompanyRecord, type CompanyFormData } from "@/lib/contact-form";
import {
  markCompanyDeleted,
  readArchivedCompanyIds,
  readStoredCompanies,
  upsertCompany,
  upsertContact,
} from "@/lib/crm-local";
import { useCurrentUser } from "@/lib/current-user";
import type {
  AccountHealth,
  CompanyActivity,
  CompanyContactLink,
  CompanyProject,
  CompanyRecord,
  ContactRecord,
  CrmDeal,
  Invoice,
  LeadFile,
  LeadNote,
  SupportTicket,
  User,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompanyDetailClientProps {
  company: CompanyRecord;
  owners: User[];
  contacts: ContactRecord[];
  links: CompanyContactLink[];
  members: ContactRecord[];
  activities: CompanyActivity[];
  deals: CrmDeal[];
  initialNotes: LeadNote[];
  initialFiles: LeadFile[];
  projects: CompanyProject[];
  invoices: Invoice[];
  tickets: SupportTicket[];
  health: AccountHealth | null;
}

function CompanyDetailClient({
  company: initialCompany,
  owners,
  contacts,
  links: initialLinks,
  members: initialMembers,
  activities,
  deals,
  initialNotes,
  initialFiles,
  projects,
  invoices,
  tickets,
  health,
}: CompanyDetailClientProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [company, setCompany] = useState<CompanyRecord>(initialCompany);
  const [classified, setClassified] = useState(false);
  const [links, setLinks] = useState<CompanyContactLink[]>(initialLinks);
  const [members, setMembers] = useState<ContactRecord[]>(initialMembers);
  const [notes, setNotes] = useState(initialNotes);
  const [files, setFiles] = useState(initialFiles);

  const [tab, setTab] = useState<CompanyTabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [dealsOpenRequest, setDealsOpenRequest] = useState(0);
  const [contactsOpenRequest, setContactsOpenRequest] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readStoredCompanies();
      const override = stored.find((candidate) => candidate.id === initialCompany.id);
      const storedArchived = readArchivedCompanyIds();
      if (override) setCompany(override);
      if (storedArchived.includes(initialCompany.id)) setClassified(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialCompany]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const handleEditSubmit = (data: CompanyFormData) => {
    const rebuilt = buildCompanyRecord(data);
    const updated: CompanyRecord = { ...rebuilt, id: company.id };
    upsertCompany(updated);
    setCompany(updated);
    setEditOpen(false);
    showToast("Company updated");
  };

  const applyPanelEdit = (updated: CompanyRecord) => {
    upsertCompany(updated);
    setCompany(updated);
  };

  const addLink = (link: CompanyContactLink, contact: ContactRecord) => {
    const linked: ContactRecord = {
      ...contact,
      companyId: company.id,
      companyName: company.name,
    };
    upsertContact(linked);
    setLinks((prev) => [...prev, link]);
    setMembers((prev) => {
      const rest = prev.filter((member) => member.id !== contact.id);
      return [linked, ...rest];
    });
    showToast(`${contact.firstName} ${contact.lastName} linked to ${company.name}`);
  };

  const removeLink = (contact: ContactRecord) => {
    upsertContact({ ...contact, companyId: "", companyName: "" });
    setLinks((prev) => prev.filter((link) => link.contactId !== contact.id));
    setMembers((prev) => prev.filter((member) => member.id !== contact.id));
    showToast(`${contact.firstName} ${contact.lastName} unlinked`);
  };

  const toggleRole = (
    contactId: string,
    role: Exclude<CompanyContactLink["roles"][number], "Primary Contact">
  ) => {
    setLinks((prev) =>
      prev.map((link) => {
        if (link.contactId !== contactId) return link;
        const hasRole = link.roles.includes(role);
        return {
          ...link,
          roles: hasRole ? link.roles.filter((candidate) => candidate !== role) : [...link.roles, role],
        };
      })
    );
  };

  const setPrimary = (contactId: string) => {
    setLinks((prev) =>
      prev.map((link) => ({ ...link, primary: link.contactId === contactId }))
    );
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

  const addFile = (file: LeadFile) => {
    setFiles((prev) => [file, ...prev]);
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleDeleteConfirm = () => {
    markCompanyDeleted(company.id);
    router.push("/companies");
  };

  const openDeals = () => {
    setTab("deals");
    setDealsOpenRequest((prev) => prev + 1);
  };

  const openContacts = () => {
    setTab("contacts");
    setContactsOpenRequest((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <CompanyProfileHeader
        company={company}
        classified={classified}
        onBack={() => router.push("/companies")}
        onEdit={() => setEditOpen(true)}
        onAddDeal={openDeals}
        onAddContact={openContacts}
        onArchive={() => setClassified((prev) => !prev)}
        onDelete={() => setConfirmDeleteOpen(true)}
      />

      <CompanyTabs
        active={tab}
        onChange={setTab}
        counts={{
          contacts: members.length,
          deals: deals.length,
          activity: activities.length,
          projects: projects.length,
          invoices: invoices.length,
          support: tickets.length,
          notes: notes.length,
          files: files.length,
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {tab === "overview" && (
            <CompanyOverview
              company={company}
              deals={deals}
              projects={projects}
              tickets={tickets}
              health={health}
              activities={activities}
              onViewAllActivity={() => setTab("activity")}
              onAddDeal={openDeals}
              onAddContact={openContacts}
            />
          )}
          {tab === "contacts" && (
            <CompanyContactsTab
              company={company}
              links={links}
              members={members}
              contacts={contacts}
              owners={owners}
              openRequest={contactsOpenRequest}
              onAddLink={addLink}
              onRemoveLink={removeLink}
            />
          )}
          {tab === "deals" && (
            <CompanyDealsTab
              deals={deals}
              owners={owners}
              category={`company-${company.id}`}
              openRequest={dealsOpenRequest}
            />
          )}
          {tab === "activity" && (
            <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={activities} iconMap={companyActivityIcons} />
              </CardContent>
            </Card>
          )}
          {tab === "projects" && <CompanyProjectsTab projects={projects} />}
          {tab === "invoices" && <CompanyInvoicesTab invoices={invoices} />}
          {tab === "support" && <CompanyTicketsTab tickets={tickets} />}
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
            <CompanyDetailsPanel company={company} onApply={applyPanelEdit} />
            <CompanyRelationshipsCard
              links={links}
              members={members}
              onToggleRole={toggleRole}
              onSetPrimary={setPrimary}
            />
          </div>
        </div>
      </div>

      <AddCompanyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        owners={owners}
        companies={[company]}
        initial={companyToForm(company)}
        mode="edit"
        onSubmit={handleEditSubmit}
        onViewExisting={(existing) => {
          setEditOpen(false);
          router.push(`/companies/${existing.id}`);
        }}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete company?</DialogTitle>
            <DialogDescription>
              This will permanently remove {company.name} and its records from your
              companies. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function companyToForm(company: CompanyRecord): Partial<CompanyFormData> {
  return {
    name: company.name,
    domain: company.domain,
    website: company.website,
    industry: company.industry,
    companySize: company.companySize,
    employeeCount: String(company.employeeCount),
    annualRevenue: company.annualRevenue,
    currency: company.currency,
    phone: company.phone,
    email: company.email,
    country: company.country,
    city: company.city,
    address: company.address,
    accountStatus: company.accountStatus,
    ownerName: company.ownerName,
    source: company.source,
    tags: company.tags.join(", "),
    description: company.description,
    previousId: company.id,
  };
}

export { CompanyDetailClient };