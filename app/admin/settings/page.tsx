import type { Metadata } from "next";
import { KeyRound, Palette, ShieldCheck, UserCog } from "lucide-react";

import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/admin/db";
import { getAdminDb } from "@/lib/admin/db";
import {
  requirePlatformPermission,
} from "@/lib/admin/auth";
import { hasPlatformPermission } from "@/lib/admin/permissions";
import { isGeminiConfigured, isSupabaseConfigured, stripeEnv } from "@/lib/env";
import type { PlatformAdminUser } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Settings",
  description: "FinloNexa platform settings",
};

export const dynamic = "force-dynamic";

interface AdminSettingsRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_by: string | null;
  created_at: string;
}

export default async function AdminSettingsPage() {
  const ctx = await requirePlatformPermission("platform_settings.manage");
  const canManage = hasPlatformPermission(ctx.role, "platform_settings.manage");

  const adminRows = await getAdminUsers();

  const isSuper = hasPlatformPermission(ctx.role, "platform.dashboard.view") && ctx.role === "super_admin";

  const columns: DataColumn<PlatformAdminUser>[] = [
    {
      header: "User",
      className: "min-w-[200px]",
      cell: (row) => (
        <div>
          <p className="font-medium text-ink">{row.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{row.email ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (row) => <StatusBadge value={row.role} />,
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Granted By",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.created_by?.slice(0, 12) ?? "—"}</span>,
    },
    {
      header: "Granted",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform administrators and environment configuration."
      >
        {canManage ? (
          <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {isSuper ? "Super Admin" : "Manager"}
          </span>
        ) : null}
      </PageHeader>

      {!canManage ? (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="p-4 text-sm text-[#b91c1c]">
            Your role can view these settings but cannot change them. Ask a Super Admin to manage platform administrators.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Platform Admins" value={adminRows.length} icon={UserCog} accent="purple" />
        <StatCard label="Supabase" value={isSupabaseConfigured() ? "Connected" : "Not Configured"} icon={KeyRound} accent={isSupabaseConfigured() ? "green" : "red"} />
        <StatCard label="AI Provider" value={isGeminiConfigured() ? "Gemini" : "Not Configured"} icon={Palette} accent={isGeminiConfigured() ? "green" : "amber"} />
        <StatCard label="Stripe" value={stripeEnv.isConfigured ? "Connected" : "Not Configured"} icon={KeyRound} accent={stripeEnv.isConfigured ? "green" : "amber"} />
      </div>

      <SectionCard
        title="Administrators"
        description="Members of the platform_admins table with their roles and status."
      >
        <DataTable
          columns={columns}
          rows={adminRows}
          empty={
            <EmptyState
              icon={ShieldCheck}
              title="No platform admins yet"
              description="Run the bootstrap SQL (see final report) to grant the first Super Admin. Self-registration is intentionally not exposed."
              compact
            />
          }
        />
      </SectionCard>

      <SectionCard
        title="Managing administrators"
        description="Administration lifecycle is controlled by the database — never by public self-promotion endpoints."
      >
        <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
          <li>
            Add an admin: insert into <code className="font-mono text-xs">platform_admins (user_id, role)</code>.
          </li>
          <li>
            Roles: <code className="font-mono text-xs">super_admin</code>,{" "}
            <code className="font-mono text-xs">platform_admin</code>,{" "}
            <code className="font-mono text-xs">support_admin</code>,{" "}
            <code className="font-mono text-xs">billing_admin</code>,{" "}
            <code className="font-mono text-xs">viewer</code>.
          </li>
          <li>
            Audit events are written for create, role-change and status-change actions.
          </li>
          <li>
            Provider secrets ship only via environment variables; this page never displays them.
          </li>
        </ul>
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          {isSupabaseConfigured()
            ? "Supabase Admin API is configured — platform tables are queried via the service role (server-only)."
            : "Supabase is not configured — add NEXT_PUBLIC_SUPABASE_URL and the service-role key."}
        </div>
      </SectionCard>
    </div>
  );
}

async function getAdminUsers(): Promise<PlatformAdminUser[]> {
  try {
    const db = getAdminDb();
    const { data, error } = await db
      .from("platform_admins")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return [];
    const rows = (data ?? []) as unknown as AdminSettingsRow[];

    const userIds = rows.map((row) => row.user_id);
    const profileById = new Map<string, { full_name: string | null; email: string | null }>();
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        profileById.set(p.id, { full_name: p.full_name, email: p.email });
      }
    }

    return rows.map((row) => {
      const profile = profileById.get(row.user_id);
      return {
        id: row.id,
        user_id: row.user_id,
        role: row.role as PlatformAdminUser["role"],
        status: row.status as PlatformAdminUser["status"],
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.created_at,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        avatar_url: null,
      };
    });
  } catch {
    return [];
  }
}