-- ============================================================
-- Steps 97/99/100/104 — Public site + analytics + email + beta
-- ------------------------------------------------------------
-- * contact_submissions        — public contact form (Step 97.7)
-- * product_events             — privacy-conscious analytics (Step 99)
-- * transactional_email_logs   — email delivery log (Step 100)
-- * beta_signups               — beta access requests (Step 104)
-- ============================================================

-- ------------------------------------------------------------------
-- contact_submissions
-- Public forms get their own table. No org scoping (marketing form),
-- RLS: insert for anyone, select read-only for internal staff admin.
-- ------------------------------------------------------------------
create table public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  company    text,
  team_size  text,
  subject    text,
  message    text not null,
  status     text not null default 'new' check (status in ('new','replied','archived')),
  ip_hash    text,
  created_at timestamptz not null default now()
);

create index contact_submissions_status_idx on public.contact_submissions (status, created_at desc);
create index contact_submissions_email_idx on public.contact_submissions (email);

alter table public.contact_submissions enable row level security;
-- Anyone can submit (email/passwordless is not required to send a form).
create policy contact_submissions_insert_public on public.contact_submissions
  for insert with check (true);
-- Read limited to org admin users in the platform through audit.view-equivalent
-- is not applicable here; staff access is via service role only, so no select policy.

-- ------------------------------------------------------------------
-- product_events
-- Privacy-conscious product analytics (Step 99). Stores event names and
-- minimal properties. NEVER store CRM message bodies or PII payloads.
-- ------------------------------------------------------------------
create table public.product_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  event_name      text not null,
  properties      jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index product_events_org_created_idx on public.product_events (organization_id, created_at desc);
create index product_events_name_idx on public.product_events (event_name, created_at desc);

alter table public.product_events enable row level security;
-- No direct client policies: analytics writes go through the server
-- (activity recorded server-side). Prevents arbitrary client event spam.

-- ------------------------------------------------------------------
-- transactional_email_logs
-- Delivery log for the email abstraction (Step 100). Never stores the
-- email body content — only recipient + template + provider id.
-- ------------------------------------------------------------------
create table public.transactional_email_logs (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid references public.organizations(id) on delete cascade,
  recipient           text not null,
  template            text not null,
  provider            text not null default 'resend',
  provider_message_id text,
  status              text not null default 'queued'
      check (status in ('queued','sent','delivered','opened','failed','skipped')),
  error_message       text,
  created_at          timestamptz not null default now()
);

create index tx_email_logs_org_created_idx on public.transactional_email_logs (organization_id, created_at desc);
create index tx_email_logs_status_idx on public.transactional_email_logs (status, created_at desc);

alter table public.transactional_email_logs enable row level security;
create policy tx_email_logs_select_member on public.transactional_email_logs
  for select using (public.is_organization_member(organization_id) and public.has_permission('audit.view', organization_id));
-- inserts/server-side only.

-- ------------------------------------------------------------------
-- beta_signups
-- Optional beta access (Step 104). A submitted email requests access;
-- org-level beta flags are recorded on organizations later if needed.
-- ------------------------------------------------------------------
create table public.beta_signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  company    text,
  reason     text,
  status     text not null default 'pending' check (status in ('pending','approved','declined')),
  created_at timestamptz not null default now()
);

alter table public.beta_signups enable row level security;
create policy beta_signups_insert_public on public.beta_signups
  for insert with check (true);

-- ------------------------------------------------------------------
-- feedback
-- Beta feedback + bug reports (Step 104 / Phase 5). Org-scoped.
-- ------------------------------------------------------------------
create table public.feedback (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  category        text not null check (category in ('bug','feedback','enhancement')),
  title           text not null,
  body            text not null,
  page            text,
  status          text not null default 'open' check (status in ('open','triaged','done','wontfix')),
  created_at      timestamptz not null default now()
);

create index feedback_org_status_idx on public.feedback (organization_id, status, created_at desc);

alter table public.feedback enable row level security;
create policy feedback_select_member on public.feedback
  for select using (public.is_organization_member(organization_id));
create policy feedback_insert_member on public.feedback
  for insert with check (public.is_organization_member(organization_id));