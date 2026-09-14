import { notFound } from "next/navigation";

import { ContactDetailClient } from "@/components/contacts/contact-detail-client";
import {
  companyMocks,
  getCompanyById,
} from "@/lib/mock-companies";
import {
  getContactActivities,
  getContactById,
  getContactDeals,
  getContactEmails,
  getContactFiles,
  getContactInvoices,
  getContactMeetings,
  getContactNotes,
  getContactTasks,
  getContactTickets,
  getContactWhatsApp,
} from "@/lib/mock-contacts";
import { leadOwners } from "@/lib/mock-leads";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = getContactById(id);
  if (!contact) notFound();
  const company = contact.companyId ? getCompanyById(contact.companyId) : undefined;

  return (
    <ContactDetailClient
      contact={contact}
      company={company ?? null}
      owners={leadOwners}
      activities={getContactActivities(id)}
      deals={getContactDeals(id)}
      initialNotes={getContactNotes(id)}
      initialTasks={getContactTasks(id)}
      initialMeetings={getContactMeetings(id)}
      initialEmails={getContactEmails(id)}
      initialWhatsApp={getContactWhatsApp(id)}
      initialFiles={getContactFiles(id)}
      invoices={getContactInvoices(id)}
      tickets={getContactTickets(id)}
      companies={companyMocks}
    />
  );
}