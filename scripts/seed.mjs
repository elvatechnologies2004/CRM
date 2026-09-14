#!/usr/bin/env node
/**
 * Dev/QA seed for the Step 51 schema.
 *
 * Requires:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (or a local .env for supabase CLI)
 *
 * Usage:
 *   node scripts/seed.mjs            # idempotent — skips if demo org already has data
 *   node scripts/seed.mjs --reset    # deletes the demo org (cascades) and re-seeds
 *
 * It creates 3 demo users (email_confirm), one organization, RBAC roles, the
 * Main Sales Pipeline (7 stages) and realistic demo records so the server data
 * layer lights up after `supabase db push` + `node scripts/seed.mjs`.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env / .env.local loader for a clean run outside Next.
const env = { ...process.env };
for (const file of [".env.local", ".env"]) {
  try {
    const text = readFileSync(path.join(__dirname, "..", file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match && match[2] && !env[match[1]]) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // skip missing files
  }
}

const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local or environment.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_ORG = "FinloNexa Demo";
const RESET = process.argv.includes("--reset");

const PERMISSION_KEYS = [
  "lead.view", "lead.create", "lead.edit", "lead.delete", "lead.export", "lead.convert",
  "contact.view", "contact.create", "contact.edit", "contact.delete",
  "company.view", "company.create", "company.edit", "company.delete",
  "deal.view", "deal.create", "deal.edit", "deal.delete", "pipeline.edit",
  "task.view", "task.create", "task.edit", "task.delete", "task.complete",
  "meeting.view", "meeting.create", "meeting.edit", "call.log",
  "quote.view", "quote.create", "quote.edit",
  "proposal.view", "proposal.create",
  "invoice.view", "invoice.create", "invoice.edit",
  "product.view", "product.edit",
  "project.view", "project.edit",
  "ticket.view", "ticket.edit",
  "report.view", "settings.manage", "users.manage", "teams.manage",
  "notification.manage", "audit.view", "ai.manage", "data.import", "data.export",
];

const users = [
  { email: "hussain@finlonexa.com", first: "Hussain", last: "Ali", job: "Sales Manager" },
  { email: "sara@finlonexa.com", first: "Sara", last: "Ahmed", job: "Account Executive" },
  { email: "zain@finlonexa.com", first: "Zain", last: "Malik", job: "SDR" },
];

const stages = [
  { name: "New", pos: 0, prob: 10, color: "#CBD5E1", type: "open" },
  { name: "Discovery", pos: 1, prob: 25, color: "#93C5FD", type: "open" },
  { name: "Qualified", pos: 2, prob: 50, color: "#818CF8", type: "open" },
  { name: "Proposal", pos: 3, prob: 70, color: "#A78BFA", type: "open" },
  { name: "Negotiation", pos: 4, prob: 85, color: "#F59E0B", type: "open" },
  { name: "Won", pos: 5, prob: 100, color: "#22C55E", type: "won" },
  { name: "Lost", pos: 6, prob: 0, color: "#EF4444", type: "lost" },
];

const companies = [
  { name: "Acme Technologies", domain: "acme.com", industry: "Software", size: "51-200", rev: 2400000, status: "Customer", city: "Austin", country: "USA" },
  { name: "BrightPath Logistics", domain: "brightpath.io", industry: "Logistics", size: "201-500", rev: 5100000, status: "Opportunity", city: "Rotterdam", country: "Netherlands" },
  { name: "Nova Financial", domain: "novafin.co", industry: "Fintech", size: "11-50", rev: 980000, status: "Prospect", city: "London", country: "UK" },
  { name: "Vertex Construction", domain: "vertexbuild.com", industry: "Construction", size: "501-1000", rev: 12200000, status: "Prospect", city: "Dubai", country: "UAE" },
  { name: "EcoGlow Energy", domain: "ecoglow.energy", industry: "Renewable Energy", size: "1-10", rev: 354000, status: "Opportunity", city: "Berlin", country: "Germany" },
];

const contacts = [
  { first: "Daniel", last: "Craig", job: "CTO", company: 0, stage: "Customer", city: "Austin" },
  { first: "Fatima", last: "Noor", job: "Operations Lead", company: 1, stage: "Qualified", city: "Rotterdam" },
  { first: "James", last: "Lee", job: "CFO", company: 2, stage: "Lead", city: "London" },
  { first: "Omar", last: "Farooq", job: "Procurement Manager", company: 3, stage: "Lead", city: "Dubai" },
  { first: "Lena", last: "Keller", job: "Founder", company: 4, stage: "Qualified", city: "Berlin" },
  { first: "Sophie", last: "Turner", job: "VP Sales", company: 0, stage: "Customer", city: "Austin" },
  { first: "Yusuf", last: "Rashid", job: "IT Director", company: 1, stage: "Qualified", city: "Rotterdam" },
  { first: "Maria", last: "Gomez", job: "Head of Finance", company: 2, stage: "Lead", city: "London" },
];

const leads = [
  { first: "Adam", last: "West", company: "BrightPath Logistics", source: "LinkedIn", status: "New", score: 62, owner: 1 },
  { first: "Priya", last: "Sharma", company: "Nova Financial", source: "Website", status: "Contacted", score: 74, owner: 2 },
  { first: "Tom", last: "Brady", company: "Vertex Construction", source: "Referral", status: "Qualified", score: 81, owner: 0 },
  { first: "Emma", last: "Wilson", company: "EcoGlow Energy", source: "Email", status: "Proposal", score: 88, owner: 1 },
  { first: "John", last: "Carter", company: "Acme Technologies", source: "WhatsApp", status: "New", score: 55, owner: 0 },
  { first: "Nadia", last: "Hassan", company: "Vertex Construction", source: "Cold Call", status: "Contacted", score: 67, owner: 2 },
  { first: "Lucas", last: "Moreau", company: "Acme Technologies", source: "Website", status: "Qualified", score: 79, owner: 1 },
  { first: "Aisha", last: "Khan", company: "EcoGlow Energy", source: "Instagram", status: "New", score: 48, owner: 0 },
  { first: "Robert", last: "King", company: "BrightPath Logistics", source: "LinkedIn", status: "Unqualified", score: 30, owner: 2 },
  { first: "Maya", last: "Patel", company: "Nova Financial", source: "Referral", status: "Contacted", score: 71, owner: 0 },
  { first: "Ethan", last: "Brown", company: "Vertex Construction", source: "Email", status: "New", score: 58, owner: 1 },
  { first: "Chloe", last: "Davis", company: "Acme Technologies", source: "Website", status: "Contacted", score: 66, owner: 2 },
];

const deals = [
  { name: "Acme — Annual contract", company: 0, stage: "Won", value: 120000, prob: 100, owner: 0, won: true },
  { name: "BrightPath — Fleet tracker", company: 1, stage: "Qualified", value: 84000, prob: 50, owner: 1 },
  { name: "Nova — Payments platform", company: 2, stage: "Proposal", value: 56000, prob: 70, owner: 2 },
  { name: "Vertex — Site management", company: 3, stage: "Discovery", value: 210000, prob: 25, owner: 0 },
  { name: "EcoGlow — Grid analytics", company: 4, stage: "Negotiation", value: 45000, prob: 85, owner: 1 },
  { name: "Acme — Support renewal", company: 0, stage: "New", value: 24000, prob: 10, owner: 2 },
  { name: "BrightPath — Analytics add-on", company: 1, stage: "Discovery", value: 32000, prob: 25, owner: 0 },
  { name: "Nova — Compliance module", company: 2, stage: "Lost", value: 47000, prob: 0, owner: 1, lost: true },
  { name: "Vertex — Warranty program", company: 3, stage: "Qualified", value: 99000, prob: 50, owner: 2 },
];

const tasks = [
  { title: "Follow up with Priya Sharma on proposal", priority: "High", status: "Open", owner: 2, due: "+1d" },
  { title: "Prep discovery call for Vertex", priority: "Medium", status: "In Progress", owner: 0, due: "+2d" },
  { title: "Send revised quote to EcoGlow", priority: "Urgent", status: "Open", owner: 1, due: "+1d" },
  { title: "Update Acme renewal checklist", priority: "Low", status: "Open", owner: 2, due: "+4d" },
  { title: "Quarterly review of win/loss", priority: "Medium", status: "Open", owner: 0, due: "+7d" },
  { title: "Verify BrightPath onboarding", priority: "High", status: "In Progress", owner: 1, due: "+3d" },
];

const notes = [
  { leadIdx: 1, body: "Asked for a detailed pricing breakdown; very price sensitive." },
  { leadIdx: 2, body: "RFP sent; legal review in progress." },
  { leadIdx: 3, body: "Wants a pilot before signing the full platform." },
];

function daysFromNow(daysStr) {
  const n = Number(daysStr.replace(/[^0-9-]/g, ""));
  return new Date(Date.now() + n * 86400000).toISOString();
}

async function fail(step, err) {
  console.error(`[seed] failed at ${step}: ${err?.message ?? err}`);
  process.exit(1);
}

// ------------------------------------------------------------------
async function main() {
  let orgId;
  const { data: existingOrgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", DEMO_ORG);

  if (RESET && existingOrgs?.length) {
    const { error } = await supabase.from("organizations").delete().eq("id", existingOrgs[0].id);
    if (error) return fail("reset org", error);
    console.log("  deleted demo org (cascaded data)");
  } else if (existingOrgs?.length) {
    const { data: existingLeads } = await supabase.from("leads").select("id").eq("organization_id", existingOrgs[0].id).limit(1);
    if (existingLeads?.length) {
      console.log("Demo workspace already seeded — nothing to do. (Use --reset to re-seed.)");
      return;
    }
    orgId = existingOrgs[0].id;
    console.log("  reusing existing org (no data)");
  }

  // 1. Demo users
  const userIds = {};
  for (const u of users) {
    const { data: existing, error: getErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (getErr) return fail("list users", getErr);
    const found = existing.users.find((x) => x.email === u.email);
    if (found) {
      userIds[u.email] = found.id;
      continue;
    }
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "FinloNexaDemo2026!",
      email_confirm: true,
      user_metadata: { first_name: u.first, last_name: u.last, company: DEMO_ORG },
    });
    if (error) return fail(`create user ${u.email}`, error);
    userIds[u.email] = created.user.id;
    console.log(`  created user ${u.email}`);
  }

  // 2. Organization (reused if it survived a partial run)
  if (!orgId) {
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .insert({ name: DEMO_ORG, slug: "finlonexa-demo", timezone: "UTC", default_currency: "PKR" })
      .select()
      .single();
    if (orgErr) return fail("create org", orgErr);
    orgId = org.id;
    console.log(`  created organization ${DEMO_ORG}`);
  }

  // 3. Profiles
  for (const u of users) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userIds[u.email],
        organization_id: orgId,
        first_name: u.first,
        last_name: u.last,
        full_name: `${u.first} ${u.last}`,
        email: u.email,
        job_title: u.job,
        status: "active",
      },
      { onConflict: "id" },
    );
    if (error) return fail(`profile ${u.email}`, error);
  }

  // 4. RBAC — Admin / Manager / Executive, role_permissions
  const { data: permRows } = await supabase.from("permissions").select("id, key");
  const permId = Object.fromEntries((permRows ?? []).map((p) => [p.key, p.id]));

  async function insertRole(name, keys) {
    const { data: role, error } = await supabase
      .from("roles")
      .insert({ organization_id: orgId, name, is_system: true, description: `${name} role` })
      .select()
      .single();
    if (error) return fail(`role ${name}`, error);
    const rows = keys.map((key) => ({ organization_id: orgId, role_id: role.id, permission_id: permId[key] })).filter((r) => r.permission_id);
    if (rows.length) {
      const { error: rpErr } = await supabase.from("role_permissions").insert(rows);
      if (rpErr) return fail(`role_permissions ${name}`, rpErr);
    }
    return role;
  }

  const adminRole = await insertRole("Admin", PERMISSION_KEYS);
  const managerRole = await insertRole("Sales Manager", [
    "lead.view", "lead.create", "lead.edit", "lead.convert", "lead.export",
    "contact.view", "contact.create", "contact.edit", "company.view", "company.create", "company.edit",
    "deal.view", "deal.create", "deal.edit", "task.view", "task.create", "task.edit", "task.complete",
    "meeting.view", "meeting.create", "call.log", "quote.view", "quote.create", "quote.edit",
    "proposal.view", "proposal.create", "invoice.view", "invoice.create",
    "report.view", "data.import", "data.export", "pipeline.edit",
  ]);
  const execRole = await insertRole("Sales Executive", [
    "lead.view", "lead.create", "lead.edit", "lead.convert",
    "contact.view", "contact.create", "contact.edit",
    "company.view", "company.create",
    "deal.view", "deal.create", "deal.edit",
    "task.view", "task.create", "task.edit", "task.complete",
    "meeting.view", "meeting.create", "call.log",
    "quote.view", "quote.create", "invoice.view",
  ]);

  // 5. Memberships
  const memberships = [
    { email: users[0].email, role: adminRole.id },
    { email: users[1].email, role: managerRole.id },
    { email: users[2].email, role: execRole.id },
  ];
  for (const m of memberships) {
    const { error } = await supabase.from("organization_members").insert({
      organization_id: orgId,
      user_id: userIds[m.email],
      role_id: m.role,
      status: "active",
    });
    if (error) return fail(`membership ${m.email}`, error);
  }

  const ownersByUser = Object.fromEntries(users.map((u, i) => [i, userIds[u.email]]));

  // 6. Pipeline + stages
  const { data: pipeline, error: pipeErr } = await supabase
    .from("pipelines")
    .insert({ organization_id: orgId, name: "Main Sales Pipeline", description: "Default pipeline", is_default: true })
    .select()
    .single();
  if (pipeErr) return fail("pipeline", pipeErr);
  await supabase.from("pipeline_stages").insert(
    stages.map((s) => ({
      organization_id: orgId,
      pipeline_id: pipeline.id,
      name: s.name,
      position: s.pos,
      default_probability: s.prob,
      color: s.color,
      stage_type: s.type,
    })),
  );
  const { data: stageRows } = await supabase.from("pipeline_stages").select("id, name").eq("pipeline_id", pipeline.id);
  const stageId = Object.fromEntries((stageRows ?? []).map((s) => [s.name, s.id]));
  console.log("  created Main Sales Pipeline (7 stages)");

  // 7. Companies
  const companyIds = {};
  for (const c of companies) {
    const { data, error } = await supabase
      .from("companies")
      .insert({
        organization_id: orgId,
        name: c.name,
        domain: c.domain,
        industry: c.industry,
        company_size: c.size,
        employee_count: c.size.includes("501") ? 750 : c.size.includes("201") ? 300 : c.size.includes("51") ? 120 : c.size.includes("11") ? 32 : 8,
        annual_revenue: c.rev,
        currency: "USD",
        country: c.country,
        city: c.city,
        account_status: c.status,
        owner_id: ownersByUser[0],
        source: "Manual",
        tags: [],
        created_by: ownersByUser[0],
      })
      .select()
      .single();
    if (error) return fail(`company ${c.name}`, error);
    companyIds[c.name] = data.id;
  }

  // 8. Contacts
  const contactIds = {};
  for (const c of contacts) {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        organization_id: orgId,
        first_name: c.first,
        last_name: c.last,
        full_name: `${c.first} ${c.last}`,
        email: `${c.first.toLowerCase()}.${c.last.toLowerCase()}@${companies[c.company].domain}`,
        company_id: companyIds[companies[c.company].name],
        job_title: c.job,
        lifecycle_stage: c.stage,
        owner_id: ownersByUser[0],
        source: "Manual",
        city: c.city,
        country: companies[c.company].country,
        tags: [],
        created_by: ownersByUser[0],
      })
      .select()
      .single();
    if (error) return fail(`contact ${c.first}`, error);
    contactIds[`${c.first} ${c.last}`] = data.id;
  }

  // 9. Leads
  const leadIds = {};
  for (const l of leads) {
    const { data, error } = await supabase
      .from("leads")
      .insert({
        organization_id: orgId,
        first_name: l.first,
        last_name: l.last,
        full_name: `${l.first} ${l.last}`,
        email: `${l.first.toLowerCase()}.${l.last.toLowerCase()}@example.com`,
        company_name: l.company,
        source: l.source,
        status: l.status,
        score: l.score,
        owner_id: ownersByUser[l.owner],
        currency: "USD",
        budget: l.status === "Qualified" || l.status === "Proposal" ? "30k-50k" : "Estimated",
        interested_product: "CRM Platform",
        tags: ["warm"],
        created_by: ownersByUser[l.owner],
      })
      .select()
      .single();
    if (error) return fail(`lead ${l.first}`, error);
    leadIds[`${l.first} ${l.last}`] = data.id;
  }

  // 10. Deals
  for (const d of deals) {
    const stage = d.stage;
    const payload = {
      organization_id: orgId,
      name: d.name,
      company_id: companyIds[companies[d.company].name],
      pipeline_id: pipeline.id,
      stage_id: stageId[stage],
      value: d.value,
      currency: "USD",
      probability: d.prob,
      expected_revenue: Math.round(d.value * (d.prob / 100)),
      expected_close_date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      owner_id: ownersByUser[d.owner],
      health_score: d.prob >= 50 ? 80 : 55,
      health_status: d.won ? "Healthy" : d.lost ? "Open" : d.prob >= 70 ? "Healthy" : "At Risk",
      source: "Manual",
      tags: [],
      created_by: ownersByUser[0],
    };
    if (d.won) {
      payload.won_at = new Date(Date.now() - 10 * 86400000).toISOString();
    }
    if (d.lost) {
      payload.lost_at = new Date(Date.now() - 6 * 86400000).toISOString();
      payload.lost_reason = "Budget";
    }
    const { error } = await supabase.from("deals").insert(payload);
    if (error) return fail(`deal ${d.name}`, error);
  }

  // 11. Tasks
  for (const t of tasks) {
    const { error } = await supabase.from("tasks").insert({
      organization_id: orgId,
      title: t.title,
      priority: t.priority,
      status: t.status,
      owner_id: ownersByUser[t.owner],
      due_at: daysFromNow(t.due),
      type: "Follow-up",
      created_by: ownersByUser[t.owner],
    });
    if (error) return fail(`task ${t.title}`, error);
  }

  // 12. Notes + activities
  for (const n of notes) {
    const leadId = leadIds[`${leads[n.leadIdx].first} ${leads[n.leadIdx].last}`];
    if (!leadId) continue;
    await supabase.from("notes").insert({
      organization_id: orgId,
      related_type: "lead",
      related_id: leadId,
      body: n.body,
      created_by: ownersByUser[0],
      is_pinned: false,
    });
    await supabase.from("activities").insert({
      organization_id: orgId,
      activity_type: "note_added",
      related_type: "lead",
      related_id: leadId,
      lead_id: leadId,
      actor_user_id: ownersByUser[0],
      title: "Note added to lead",
      description: n.body,
    });
  }

  // 13. AI agents + recommendations/approvals
  const demoAgents = [
    {
      name: "Lead Qualifier",
      agent_type: "Lead",
      purpose: "Scores inbound leads, enriches records and routes hot leads to owners.",
      status: "Active",
      approval_mode: "Ask Before Action",
      permissions: [
        { object: "Leads", level: "Read + Write" },
        { object: "Sequences", level: "Execute" },
      ],
      recTitles: [
        "Route hot lead to Hussain",
        "Low score — nurture sequence",
        "Follow up with Priya Sharma",
        "Missing phone number enrichment",
      ],
      recCount: 12,
      approvals: 2,
      activityAgoMin: 5,
    },
    {
      name: "Deal Navigator",
      agent_type: "Sales",
      purpose: "Analyzes pipeline, forecasts close probability and flags at-risk deals.",
      status: "Paused",
      approval_mode: "Draft Only",
      permissions: [
        { object: "Deals", level: "Read" },
        { object: "Forecast", level: "Read" },
      ],
      recTitles: [
        "Forecast risk: Vertex site deal",
        "Move Nova payments to Proposal",
        "Won streak at 82%",
      ],
      recCount: 4,
      approvals: 1,
      activityAgoMin: 60,
    },
    {
      name: "Health Guardian",
      agent_type: "Customer Success",
      purpose: "Monitors account health, predicts churn and recommends upsells.",
      status: "Active",
      approval_mode: "Auto-Execute Allowed Actions",
      permissions: [
        { object: "Accounts", level: "Read" },
        { object: "Tasks", level: "Read + Write" },
      ],
      recTitles: [
        "Acme health dropping — open ticket",
        "Upsell candidate: BrightPath",
        "Renewal review for EcoGlow",
      ],
      recCount: 10,
      approvals: 0,
      activityAgoMin: 12,
    },
    {
      name: "Invoice Auditor",
      agent_type: "Finance",
      purpose: "Validates invoices, chases overdue payments and flags anomalies.",
      status: "Archived",
      approval_mode: "Draft Only",
      permissions: [{ object: "Invoices", level: "Read + Write" }],
      recTitles: [],
      recCount: 0,
      approvals: 0,
      activityAgoMin: 60 * 24 * 12,
    },
  ];

  const agentIds = [];
  for (const a of demoAgents) {
    const { data, error } = await supabase
      .from("ai_agents")
      .insert({
        organization_id: orgId,
        name: a.name,
        agent_type: a.agent_type,
        purpose: a.purpose,
        status: a.status,
        approval_mode: a.approval_mode,
        permissions: a.permissions,
        created_by: ownersByUser[0],
        last_activity_at: new Date(Date.now() - a.activityAgoMin * 60000).toISOString(),
      })
      .select()
      .single();
    if (error) return fail(`ai_agent ${a.name}`, error);
    agentIds[a.name] = data.id;

    for (let i = 0; i < a.recCount; i++) {
      const title = a.recTitles[i % a.recTitles.length];
      const applied = i % 3 === 0;
      const { error: recErr } = await supabase.from("ai_recommendations").insert({
        organization_id: orgId,
        agent_id: data.id,
        record_type: a.agent_type === "Finance" ? "invoice" : "deal",
        record_id: null,
        recommendation_type: a.agent_type === "Sales" ? "stage_move" : "enrichment",
        title,
        summary: "Suggested by " + a.name + ".",
        confidence: 60 + ((i * 7) % 40),
        status: applied ? "applied" : "pending",
        created_at: new Date(Date.now() - (i * 17 + 2) * 60000).toISOString(),
      });
      if (recErr) return fail(`ai_recommendation ${a.name}`, recErr);
    }

    for (let i = 0; i < a.approvals; i++) {
      const { error: appErr } = await supabase.from("ai_approvals").insert({
        organization_id: orgId,
        agent_id: data.id,
        action_type: "recommendation",
        record_type: "deal",
        record_id: null,
        proposed_payload: { note: "Awaiting human decision." },
        reason_summary: "Requires human approval before taking action.",
        risk_level: i % 2 === 0 ? "Medium" : "Low",
        status: "pending",
        requested_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      });
      if (appErr) return fail(`ai_approval ${a.name}`, appErr);
    }
  }

  console.log("\nSeeded FinloNexa Demo workspace:\n");
  console.log(`  Org:        ${DEMO_ORG}`);
  console.log(`  Users:      ${users.map((u) => `${u.email} (${u.job})`).join(", ")}`);
  console.log(`  Password:   FinloNexaDemo2026!`);
  console.log(`  Companies:  ${companies.length}   Contacts: ${contacts.length}`);
  console.log(`  Leads:      ${leads.length}   Deals: ${deals.length}`);
  console.log(`  Tasks:      ${tasks.length}   AI Agents: 4`);
  console.log(`  Pipeline:   Main Sales Pipeline (${stages.length} stages)`);
  console.log("\nSign in at /login with any of the demo users.");
}

main().catch((err) => fail("top-level", err));