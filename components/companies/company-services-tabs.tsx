"use client";

import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContactDealsTab,
  ContactInvoicesTab,
  ContactTicketsTab,
} from "@/components/contacts/contact-billing-tabs";
import { formatCurrency } from "@/lib/crm-meta";
import type {
  CompanyProject,
  CrmDeal,
  Invoice,
  SupportTicket,
  User,
} from "@/lib/types";

const projectStatusVariant: Record<CompanyProject["status"], "secondary" | "info" | "success"> = {
  Active: "info",
  "On Hold": "secondary",
  Completed: "success",
};

interface CompanyProjectsTabProps {
  projects: CompanyProject[];
}

function CompanyProjectsTab({ projects }: CompanyProjectsTabProps) {
  if (projects.length === 0) {
    return (
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardContent className="py-10 text-center text-xs text-muted-foreground">
          No projects for this company yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{project.name}</p>
              <p className="text-xs text-muted-foreground">
                Started {new Date(project.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                {" · "}
                <span className="tabular-nums">{formatCurrency(project.value)}</span>
              </p>
            </div>
            <Badge variant={projectStatusVariant[project.status]}>{project.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface CompanyDealsTabProps {
  deals: CrmDeal[];
  owners: User[];
  category: string;
  openRequest?: number;
}

function CompanyDealsTab({ deals, owners, category, openRequest = 0 }: CompanyDealsTabProps) {
  return <ContactDealsTab deals={deals} owners={owners} category={category} openRequest={openRequest} />;
}

interface CompanyInvoicesTabProps {
  invoices: Invoice[];
}

function CompanyInvoicesTab({ invoices }: CompanyInvoicesTabProps) {
  return <ContactInvoicesTab invoices={invoices} />;
}

interface CompanyTicketsTabProps {
  tickets: SupportTicket[];
}

function CompanyTicketsTab({ tickets }: CompanyTicketsTabProps) {
  return <ContactTicketsTab tickets={tickets} />;
}

export { CompanyProjectsTab, CompanyDealsTab, CompanyInvoicesTab, CompanyTicketsTab };