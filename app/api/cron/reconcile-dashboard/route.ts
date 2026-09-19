import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function reconcile(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: organizations, error } = await admin.from("organizations").select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const organization of organizations ?? []) {
    const { error: refreshError } = await admin.rpc("refresh_crm_dashboard_summary", {
      p_org_id: organization.id,
    });
    if (refreshError) return NextResponse.json({ error: refreshError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, organizations: organizations?.length ?? 0 });
}

export async function GET(request: Request) {
  return reconcile(request);
}

export async function POST(request: Request) {
  return reconcile(request);
}