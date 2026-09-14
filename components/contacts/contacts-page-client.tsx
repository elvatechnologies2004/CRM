"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { AddTaskDialog, type NewTaskData } from "@/components/leads/add-task-dialog";
import { CsvImportDialog } from "@/components/crm/csv-import-dialog";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ContactsFilters, defaultContactsFilters, type ContactsFilterState, type ContactsViewMode } from "@/components/contacts/contacts-filters";
import { ContactsHeader } from "@/components/contacts/contacts-header";
import { ContactsStats } from "@/components/contacts/contacts-stats";
import { ContactsTable, contactFullName } from "@/components/contacts/contacts-table";
import { buildContactRecord, type ContactFormData } from "@/lib/contact-form";
import {
  markContactArchived,
  markContactDeleted,
  readArchivedContactIds,
  readDeletedContactIds,
  readStoredContacts,
  upsertContact,
  writeContactTask,
} from "@/lib/crm-local";
import type {
  CompanyRecord,
  ContactLifecycle,
  ContactRecord,
  LeadTask,
  User,
} from "@/lib/types";
import { getContactDeals } from "@/lib/mock-contacts";

interface ContactsPageClientProps {
  initialContacts: ContactRecord[];
  owners: User[];
  companies: CompanyRecord[];
}

function contactMatches(contact: ContactRecord, query: string) {
  const haystack = [
    contact.firstName,
    contact.lastName,
    contact.companyName,
    contact.email,
    contact.jobTitle,
    contact.country,
    contact.city,
    contact.phone,
    ...contact.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

const importTargetFields = [
  { key: "firstName", label: "First name", required: true },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email", required: true },
  { key: "jobTitle", label: "Job title" },
  { key: "companyName", label: "Company" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
];

function ContactsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {["Total", "Customers", "New", "Deals", "Inactive"].map((label) => (
          <Skeleton key={label} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[76px]" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}

function ContactsPageClient({
  initialContacts,
  owners,
  companies,
}: ContactsPageClientProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactRecord[]>(initialContacts);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContactsFilterState>(defaultContactsFilters);
  const [view, setView] = useState<ContactsViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRecord | null>(null);
  const [addTaskFor, setAddTaskFor] = useState<ContactRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readStoredContacts();
      const storedDeleted = readDeletedContactIds();
      const storedArchived = readArchivedContactIds();
      if (stored.length > 0) {
        const merged = [...stored, ...initialContacts.filter((contact) => !stored.some((candidate) => candidate.id === contact.id))];
        setContacts(merged);
      }
      if (storedDeleted.length > 0) setDeleted(new Set(storedDeleted));
      if (storedArchived.length > 0) setArchived(new Set(storedArchived));
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialContacts]);

  const ownerNames = useMemo(() => owners.map((owner) => owner.name), [owners]);
  const companyNames = useMemo(
    () => [...new Set(contacts.map((contact) => contact.companyName).filter(Boolean))].sort(),
    [contacts]
  );

  const stats = useMemo(() => {
    const visible = contacts.filter(
      (contact) => !archived.has(contact.id) && !deleted.has(contact.id)
    );
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return {
      total: visible.length,
      activeCustomers: visible.filter((contact) => contact.lifecycleStage === "Customer").length,
      newThisMonth: visible.filter((contact) => new Date(contact.createdAt) >= monthAgo).length,
      withOpenDeals: visible.filter((contact) =>
        getContactDeals(contact.id).some((deal) => deal.status === "Open")
      ).length,
      noRecentActivity: visible.filter(
        (contact) => new Date(contact.lastActivityAt) < monthAgo
      ).length,
    };
  }, [contacts, archived, deleted]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    let result = contacts.filter(
      (contact) => !archived.has(contact.id) && !deleted.has(contact.id)
    );

    if (query) result = result.filter((contact) => contactMatches(contact, query));
    if (filters.lifecycle !== "all") {
      result = result.filter((contact) => contact.lifecycleStage === filters.lifecycle);
    }
    if (filters.company !== "all") {
      result = result.filter((contact) => contact.companyName === filters.company);
    }

    const sorted = [...result];
    switch (filters.sort) {
      case "recentlyContacted":
        sorted.sort((a, b) => +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt));
        break;
      case "nameAz":
        sorted.sort((a, b) => contactFullName(a).localeCompare(contactFullName(b)));
        break;
      case "nameZa":
        sorted.sort((a, b) => contactFullName(b).localeCompare(contactFullName(a)));
        break;
      default:
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return sorted;
  }, [contacts, archived, deleted, filters]);

  const setFilter = (patch: Partial<ContactsFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const clearFilters = () => setFilters({ ...defaultContactsFilters });

  const handleAddSubmit = (data: ContactFormData) => {
    setContacts((prev) => {
      if (editingContact) {
        const updated = buildContactRecord(data, { existing: editingContact });
        upsertContact(updated);
        return prev.map((contact) => (contact.id === editingContact.id ? updated : contact));
      }
      const created = buildContactRecord(data);
      upsertContact(created);
      return [created, ...prev];
    });
    setEditingContact(null);
    setAddOpen(false);
  };

  const handleViewExisting = (contact: ContactRecord) => {
    setAddOpen(false);
    router.push(`/contacts/${contact.id}`);
  };

  const handleImport = (rows: Record<string, string>[]) => {
    const created: ContactRecord[] = [];
    for (const row of rows) {
      const record = buildContactRecord({
        firstName: row.firstName ?? "",
        lastName: row.lastName ?? "",
        jobTitle: row.jobTitle ?? "",
        email: row.email ?? "",
        phone: row.phone ?? "",
        whatsapp: row.phone ?? "",
        companyId: "",
        companyName: row.companyName ?? "",
        lifecycleStage: "Lead",
        ownerName: owners[0]?.name ?? "Hussain Ali",
        source: "Manual",
        country: row.country ?? "",
        city: row.city ?? "",
        address: "",
        tags: "",
        preferredChannel: "Email",
        preferredLanguage: "English",
      });
      created.push(record);
    }
    if (created.length > 0) {
      created.forEach((record) => upsertContact(record));
      setContacts((prev) => [...created, ...prev]);
      setToast(`${created.length} ${created.length === 1 ? "contact" : "contacts"} imported`);
    }
  };

  const handleTaskSubmit = (task: NewTaskData) => {
    if (!addTaskFor) return;
    const leadTask: LeadTask = {
      id: `t_${Date.now().toString(36)}`,
      title: task.title,
      due: task.due,
      priority: task.priority,
      status: "Open",
      owner: task.owner,
    };
    writeContactTask(addTaskFor.id, leadTask);
    setToast(`Task added for ${contactFullName(addTaskFor)}`);
    setAddTaskFor(null);
  };

  const handleArchive = (contact: ContactRecord) => {
    markContactArchived(contact.id);
    setArchived((prev) => new Set(prev).add(contact.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(contact.id);
      return next;
    });
    setToast(`${contactFullName(contact)} archived`);
  };

  const handleDeleteRow = (contact: ContactRecord) => {
    markContactDeleted(contact.id);
    setContacts((prev) => prev.filter((item) => item.id !== contact.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(contact.id);
      return next;
    });
    setArchived((prev) => {
      const next = new Set(prev);
      next.delete(contact.id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((contact) => contact.id)) : new Set());
  };

  const bulkAssignOwner = (ownerName: string) => {
    setContacts((prev) =>
      prev.map((contact) =>
        selected.has(contact.id)
          ? {
              ...contact,
              ownerName,
              ownerId: owners.find((owner) => owner.name === ownerName)?.id ?? contact.ownerId,
            }
          : contact
      )
    );
  };

  const bulkStage = (stage: ContactLifecycle) => {
    setContacts((prev) =>
      prev.map((contact) =>
        selected.has(contact.id) ? { ...contact, lifecycleStage: stage } : contact
      )
    );
  };

  const bulkDelete = () => {
    for (const id of selected) {
      markContactDeleted(id);
    }
    setContacts((prev) => prev.filter((contact) => !selected.has(contact.id)));
    setSelected(new Set());
  };

  const viewContact = (id: string) => {
    router.push(`/contacts/${id}`);
  };

  const openCreate = () => {
    setEditingContact(null);
    setAddOpen(true);
  };

  const openEdit = (contact: ContactRecord) => {
    setEditingContact(contact);
    setAddOpen(true);
  };

  if (loading) {
    return <ContactsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <ContactsHeader
        onAddContact={openCreate}
        onImport={() => setImportOpen(true)}
      />
      <ContactsStats stats={stats} />

      <ContactsFilters
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        view={view}
        onViewChange={setView}
        companies={companyNames}
        resultCount={filtered.length}
      />

      <ContactsTable
        contacts={filtered}
        selected={selected}
        onToggleSelected={toggleSelected}
        onToggleAll={toggleAll}
        onClearSelection={() => setSelected(new Set())}
        onView={viewContact}
        onEdit={openEdit}
        onAddTask={(contact) => setAddTaskFor(contact)}
        onArchive={handleArchive}
        onDelete={handleDeleteRow}
        onBulkAssignOwner={bulkAssignOwner}
        onBulkStage={bulkStage}
        onBulkDelete={bulkDelete}
        onClearFilters={clearFilters}
        owners={ownerNames}
        cardsView={view === "cards"}
      />

      <AddContactDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        owners={owners}
        companies={companies}
        contacts={contacts}
        initial={editingContact ? contactToForm(editingContact) : null}
        mode={editingContact ? "edit" : "create"}
        onSubmit={handleAddSubmit}
        onViewExisting={handleViewExisting}
      />

      <AddTaskDialog
        open={Boolean(addTaskFor)}
        onOpenChange={(open) => {
          if (!open) setAddTaskFor(null);
        }}
        owners={owners}
        defaultOwner={addTaskFor?.ownerName ?? "Hussain Ali"}
        onSubmit={handleTaskSubmit}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Contacts"
        description="Upload a CSV of contacts, map the columns, then review before importing."
        targetFields={importTargetFields}
        onImport={handleImport}
      />

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

export { ContactsPageClient };