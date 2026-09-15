import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ForbiddenState } from "@/components/admin/forbidden-state";
import { getAdminGuardResult } from "@/lib/admin/auth";
import { isAdminDbConfigured } from "@/lib/admin/db";

export const metadata: Metadata = {
  title: "Platform Administration",
  description: "FinloNexa SaaS platform administration",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getAdminGuardResult();

  if (result.status === "unauthenticated") {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }

  if (result.status === "forbidden") {
    return <ForbiddenState />;
  }

  if (!isAdminDbConfigured()) {
    return (
      <AdminShell role={result.ctx.role}>
        <DbNotConfigured />
      </AdminShell>
    );
  }

  return <AdminShell role={result.ctx.role}>{children}</AdminShell>;
}