import { notFound } from "next/navigation";

import { CompanyDetailClient } from "@/components/companies/company-detail-client";
import {
  getAccountHealth,
  getCompanyActivities,
  getCompanyById,
  getCompanyContacts,
  getCompanyDeals,
  getCompanyInvoices,
  getCompanyProjects,
  getCompanyTickets,
} from "@/lib/mock-companies";
import {
  contactMocks,
  getContactsByCompany,
} from "@/lib/mock-contacts";
import { leadOwners } from "@/lib/mock-leads";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  return (
    <CompanyDetailClient
      company={company}
      owners={leadOwners}
      contacts={contactMocks}
      links={getCompanyContacts(id)}
      members={getContactsByCompany(id)}
      activities={getCompanyActivities(id)}
      deals={getCompanyDeals(id)}
      initialNotes={[]}
      initialFiles={[]}
      projects={getCompanyProjects(id)}
      invoices={getCompanyInvoices(id)}
      tickets={getCompanyTickets(id)}
      health={getAccountHealth(id) ?? null}
    />
  );
}