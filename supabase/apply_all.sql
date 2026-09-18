-- ============================================================
-- STEP 51 - Full schema, single paste for Supabase SQL Editor
--
-- RESET PREAMBLE (SAFE TO RE-RUN FREELY):
-- Drops public schema and recreates it empty with the default
-- Supabase grants. Required because a partial earlier attempt
-- left organizations/profiles already created.
-- ============================================================
drop schema if exists public cascade;
drop extension if exists pgcrypto;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all routines in schema public to postgres, anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
grant execute on all routines in schema public to anon, authenticated, service_role;

-- ============================================================
-- MIGRATION BODY (01-08)
-- ============================================================
--
-- >>> source: 20260913000001_extensions.sql
--
-- ============================================================
-- Step 51 â€” Extensions & base infrastructure
-- ============================================================

create extension if not exists pgcrypto;

-- Reusable updated_at trigger function (Step 73)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at is not distinct from old.updated_at then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- Reusable created_by / updated_by guard is intentionally left to the data
-- layer so hidden business logic stays out of the database where possible.

-- Default privileges: any object created later in the public schema
-- (by the migration-run role) is immediately accessible to the standard
-- Supabase client roles (anon, authenticated, service_role).
-- This survives `drop schema public cascade` + recreate.
alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;

--
-- >>> source: 20260913000002_organizations_rbac.sql
--
-- ============================================================
-- Step 51 â€” Organizations, Profiles, Membership, Roles, Permissions
-- ============================================================

-- ------------------------- organizations -------------------------
create table public.organizations (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text unique,
  logo_url             text,
  country              text,
  timezone             text default 'UTC',
  default_currency     text default 'USD',
  language             text default 'en',
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index organizations_slug_idx on public.organizations (slug);
create index organizations_created_by_idx on public.organizations (created_by);

-- -------------------------- profiles ---------------------------
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  organization_id   uuid references public.organizations(id) on delete set null,
  first_name        text,
  last_name         text,
  full_name         text,
  email             text,
  avatar_url        text,
  job_title         text,
  phone             text,
  status            text not null default 'active' check (status in ('active','invited','deactivated')),
  role_id           uuid, -- resolved via organization_members.role_id; kept for convenience
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);

-- ----------------------- organization_members -------------------
create table public.organization_members (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  role_id           uuid,
  team_id           uuid,
  status            text not null default 'active' check (status in ('active','invited','deactivated')),
  joined_at         timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_org_id_idx on public.organization_members (organization_id);
create index organization_members_status_idx on public.organization_members (status);

-- --------------------------- teams -----------------------------
create table public.teams (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  description       text,
  manager_user_id   uuid,
  created_at        timestamptz not null default now()
);

create index teams_organization_id_idx on public.teams (organization_id);
alter table public.organization_members
  add constraint organization_members_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete set null;

-- ---------------------------- roles ----------------------------
create table public.roles (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  description       text,
  is_system         boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (organization_id, name)
);

alter table public.organization_members
  add constraint organization_members_role_id_fkey
  foreign key (role_id) references public.roles(id) on delete set null;

-- -------------------------- permissions ------------------------
-- Global permission catalog (shared across organizations).
-- Role -> permission assignments live in role_permissions.
create table public.permissions (
  id                uuid primary key default gen_random_uuid(),
  key               text not null unique,
  description       text,
  created_at        timestamptz not null default now()
);

create table public.role_permissions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  role_id           uuid not null references public.roles(id) on delete cascade,
  permission_id     uuid not null references public.permissions(id) on delete cascade,
  unique (organization_id, role_id, permission_id)
);

create index role_permissions_permission_id_idx on public.role_permissions (permission_id);

-- ------------------- organization invitations ------------------
create table public.organization_invites (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  email             text not null,
  role_id           uuid references public.roles(id) on delete set null,
  team_id           uuid references public.teams(id) on delete set null,
  token             text not null unique default encode(gen_random_bytes(24),'hex'),
  status            text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  expires_at        timestamptz not null default (now() + interval '7 days'),
  invited_by        uuid,
  created_at        timestamptz not null default now()
);

create index organization_invites_org_idx on public.organization_invites (organization_id);
create index organization_invites_email_idx on public.organization_invites (email);
create index organization_invites_status_idx on public.organization_invites (status);

-- -------------------- default permission catalog ---------------
-- Inserted once as the canonical list. Organizations copy these into their
-- role_permissions at onboarding time.
insert into public.permissions (key, description) values
  ('lead.view', 'View leads'),
  ('lead.create', 'Create leads'),
  ('lead.edit', 'Edit leads'),
  ('lead.delete', 'Delete leads'),
  ('lead.export', 'Export leads'),
  ('lead.convert', 'Convert leads to deals'),
  ('contact.view', 'View contacts'),
  ('contact.create', 'Create contacts'),
  ('contact.edit', 'Edit contacts'),
  ('contact.delete', 'Delete contacts'),
  ('company.view', 'View companies'),
  ('company.create', 'Create companies'),
  ('company.edit', 'Edit companies'),
  ('company.delete', 'Delete companies'),
  ('deal.view', 'View deals'),
  ('deal.create', 'Create deals'),
  ('deal.edit', 'Edit deals'),
  ('deal.delete', 'Delete deals'),
  ('pipeline.edit', 'Edit pipeline configuration'),
  ('task.view', 'View tasks'),
  ('task.create', 'Create tasks'),
  ('task.edit', 'Edit tasks'),
  ('task.delete', 'Delete tasks'),
  ('task.complete', 'Complete tasks'),
  ('meeting.view', 'View meetings'),
  ('meeting.create', 'Create meetings'),
  ('meeting.edit', 'Edit meetings'),
  ('call.log', 'Log calls'),
  ('quote.view', 'View quotes'),
  ('quote.create', 'Create quotes'),
  ('quote.edit', 'Edit quotes'),
  ('proposal.view', 'View proposals'),
  ('proposal.create', 'Create proposals'),
  ('invoice.view', 'View invoices'),
  ('invoice.create', 'Create invoices'),
  ('invoice.edit', 'Edit invoices'),
  ('product.view', 'View products'),
  ('product.edit', 'Manage products'),
  ('project.view', 'View projects'),
  ('project.edit', 'Manage projects'),
  ('ticket.view', 'View support tickets'),
  ('ticket.edit', 'Manage support tickets'),
  ('report.view', 'View reports'),
  ('settings.manage', 'Manage organization settings'),
  ('users.manage', 'Manage users, memberships and roles'),
  ('teams.manage', 'Manage teams'),
  ('notification.manage', 'Manage notifications'),
  ('audit.view', 'View audit logs'),
  ('ai.manage', 'Manage AI agents and approvals'),
  ('data.import', 'Import data'),
  ('data.export', 'Export data')
on conflict (key) do nothing;

--
-- >>> source: 20260913000003_core_crm.sql
--
-- ============================================================
-- Step 51 Ã¢â‚¬â€ Core CRM tables (mirror frontend type shapes)
-- ============================================================

-- ---------------------------- leads --------------------------
create table public.leads (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  first_name            text,
  last_name             text,
  full_name             text,
  email                 text,
  phone                 text,
  whatsapp              text,
  company_id            uuid, -- resolved company, if any
  company_name          text,
  job_title             text,
  country               text,
  city                  text,
  source                text,
  status                text default 'New' check (status in ('New','Contacted','Qualified','Proposal','Unqualified')),
  score                 integer check (score between 0 and 100),
  owner_id              uuid,
  expected_value        numeric check (expected_value >= 0),
  currency              text default 'USD',
  budget                text,
  interested_product    text,
  description           text,
  tags                  text[] default '{}',
  converted_contact_id  uuid,
  converted_company_id  uuid,
  converted_deal_id     uuid,
  converted_at          timestamptz,
  unqualified_reason    text,
  unqualified_notes     text,
  unqualified_at        timestamptz,
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  last_activity_at      timestamptz,
  next_follow_up_at     timestamptz,
  archived_at           timestamptz,
  archived_by           uuid
);

create index leads_organization_id_idx on public.leads (organization_id);
create index leads_owner_id_idx on public.leads (owner_id);
create index leads_status_idx on public.leads (status);
create index leads_source_idx on public.leads (source);
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_email_idx on public.leads (email);
create index leads_company_id_idx on public.leads (company_id);
create index leads_converted_deal_id_idx on public.leads (converted_deal_id);
create index leads_archived_idx on public.leads (archived_at) where archived_at is null;

-- ---------------------------- companies -----------------------
create table public.companies (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  name                  text not null,
  domain                text,
  website               text,
  industry              text,
  company_size          text,
  employee_count        integer check (employee_count >= 0),
  annual_revenue        numeric check (annual_revenue >= 0),
  currency              text default 'USD',
  phone                 text,
  email                 text,
  country               text,
  city                  text,
  address               text,
  account_status        text default 'Prospect',
  owner_id              uuid,
  source                text,
  tags                  text[] default '{}',
  description           text,
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  last_activity_at      timestamptz,
  archived_at           timestamptz,
  archived_by           uuid
);

create index companies_organization_id_idx on public.companies (organization_id);
create index companies_name_idx on public.companies (name);
create index companies_domain_idx on public.companies (domain);
create index companies_owner_id_idx on public.companies (owner_id);
create index companies_account_status_idx on public.companies (account_status);
create index companies_archived_idx on public.companies (archived_at) where archived_at is null;

-- --------------------------- contacts -------------------------
create table public.contacts (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  first_name            text,
  last_name             text,
  full_name             text,
  email                 text,
  phone                 text,
  whatsapp              text,
  company_id            uuid references public.companies(id) on delete set null,
  job_title             text,
  lifecycle_stage       text default 'Lead',
  owner_id              uuid,
  source                text,
  country               text,
  city                  text,
  address               text,
  preferred_channel     text default 'Email',
  preferred_language    text,
  birthday              date,
  tags                  text[] default '{}',
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  last_activity_at      timestamptz,
  next_activity_at      timestamptz,
  archived_at           timestamptz,
  archived_by           uuid
);

create index contacts_organization_id_idx on public.contacts (organization_id);
create index contacts_company_id_idx on public.contacts (company_id);
create index contacts_owner_id_idx on public.contacts (owner_id);
create index contacts_email_idx on public.contacts (email);
create index contacts_lifecycle_stage_idx on public.contacts (lifecycle_stage);
create index contacts_archived_idx on public.contacts (archived_at) where archived_at is null;

-- -------------------------- pipelines -------------------------
create table public.pipelines (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  description       text,
  is_default        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index pipelines_organization_id_idx on public.pipelines (organization_id);

-- ----------------------- pipeline_stages ----------------------
create table public.pipeline_stages (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  pipeline_id           uuid not null references public.pipelines(id) on delete cascade,
  name                  text not null,
  position              integer not null default 0,
  default_probability   integer not null default 0 check (default_probability between 0 and 100),
  color                 text default '#6366f1',
  stage_type            text not null default 'open' check (stage_type in ('open','won','lost')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (pipeline_id, position)
);

create index pipeline_stages_organization_id_idx on public.pipeline_stages (organization_id);
create index pipeline_stages_pipeline_id_idx on public.pipeline_stages (pipeline_id);

-- ---------------------------- deals ---------------------------
create table public.deals (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  name                  text not null,
  company_id            uuid references public.companies(id) on delete set null,
  primary_contact_id    uuid references public.contacts(id) on delete set null,
  pipeline_id           uuid references public.pipelines(id) on delete set null,
  stage_id              uuid references public.pipeline_stages(id) on delete set null,
  value                 numeric not null default 0 check (value >= 0),
  currency              text default 'USD',
  probability           integer not null default 0 check (probability between 0 and 100),
  expected_revenue      numeric check (expected_revenue >= 0),
  expected_close_date   date,
  owner_id              uuid,
  health_score          integer check (health_score between 0 and 100),
  health_status         text,
  source                text,
  tags                  text[] default '{}',
  description           text,
  won_at                timestamptz,
  lost_at               timestamptz,
  win_reason            text,
  lost_reason           text,
  competitor            text,
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  last_activity_at      timestamptz,
  archived_at           timestamptz,
  archived_by           uuid,
  constraint deals_no_won_and_lost check (won_at is null or lost_at is null)
);

create index deals_organization_id_idx on public.deals (organization_id);
create index deals_company_id_idx on public.deals (company_id);
create index deals_primary_contact_id_idx on public.deals (primary_contact_id);
create index deals_pipeline_id_idx on public.deals (pipeline_id);
create index deals_stage_id_idx on public.deals (stage_id);
create index deals_owner_id_idx on public.deals (owner_id);
create index deals_expected_close_date_idx on public.deals (expected_close_date);
create index deals_health_status_idx on public.deals (health_status);
create index deals_archived_idx on public.deals (archived_at) where archived_at is null;

-- ------------------------ deal_contacts ------------------------
create table public.deal_contacts (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  deal_id           uuid not null references public.deals(id) on delete cascade,
  contact_id        uuid not null references public.contacts(id) on delete cascade,
  relationship_role text default 'Decision Maker',
  is_primary        boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (deal_id, contact_id)
);

create index deal_contacts_organization_id_idx on public.deal_contacts (organization_id);
create index deal_contacts_contact_id_idx on public.deal_contacts (contact_id);

-- ---------------------------- tasks ---------------------------
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  title             text not null,
  description       text,
  type              text default 'Other',
  priority          text default 'Medium',
  status            text not null default 'Open' check (status in ('Open','In Progress','Completed','Cancelled')),
  owner_id          uuid,
  due_at            timestamptz,
  related_type      text,
  related_id        uuid,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index tasks_organization_id_idx on public.tasks (organization_id);
create index tasks_owner_id_idx on public.tasks (owner_id);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_at_idx on public.tasks (due_at);
create index tasks_related_idx on public.tasks (related_type, related_id);

-- -------------------------- activities ------------------------
create table public.activities (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  activity_type     text not null,
  related_type      text,
  related_id        uuid,
  actor_user_id     uuid,
  contact_id        uuid,
  company_id        uuid,
  deal_id           uuid,
  lead_id           uuid,
  title             text,
  description       text,
  metadata          jsonb default '{}'::jsonb,
  occurred_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index activities_organization_id_idx on public.activities (organization_id);
create index activities_related_idx on public.activities (related_type, related_id);
create index activities_occurred_at_idx on public.activities (occurred_at desc);
create index activities_actor_idx on public.activities (actor_user_id);

-- ---------------------------- notes ---------------------------
create table public.notes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  related_type      text not null,
  related_id        uuid not null,
  body              text not null,
  is_pinned         boolean not null default false,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index notes_organization_id_idx on public.notes (organization_id);
create index notes_related_idx on public.notes (related_type, related_id);

-- ---------------------------- tags ----------------------------
create table public.tags (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  color             text default '#6366f1',
  created_at        timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.record_tags (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  tag_id            uuid not null references public.tags(id) on delete cascade,
  record_type       text not null,
  record_id         uuid not null,
  created_at        timestamptz not null default now(),
  unique (tag_id, record_type, record_id)
);

create index record_tags_org_idx on public.record_tags (organization_id);
create index record_tags_record_idx on public.record_tags (record_type, record_id);

-- ------------------- updated_at triggers (Step 73) -------------
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger pipelines_set_updated_at before update on public.pipelines
  for each row execute function public.set_updated_at();
create trigger pipeline_stages_set_updated_at before update on public.pipeline_stages
  for each row execute function public.set_updated_at();
create trigger deals_set_updated_at before update on public.deals
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

--
-- >>> source: 20260913000004_commercial.sql
--
-- ============================================================
-- Step 51 â€” Commercial & operational tables
-- ============================================================

-- --------------------------- meetings -------------------------
create table public.meetings (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  title             text not null,
  meeting_type      text,
  start_at          timestamptz not null,
  end_at            timestamptz,
  owner_id          uuid,
  location          text,
  meeting_url       text,
  related_type      text,
  related_id        uuid,
  status            text default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled','no_show','rescheduled')),
  notes             text,
  outcome           text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index meetings_organization_id_idx on public.meetings (organization_id);
create index meetings_owner_id_idx on public.meetings (owner_id);
create index meetings_start_at_idx on public.meetings (start_at);

-- ----------------------------- calls --------------------------
create table public.calls (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  contact_id        uuid,
  company_id        uuid,
  deal_id           uuid,
  owner_id          uuid,
  direction         text default 'Outbound' check (direction in ('Inbound','Outbound')),
  outcome           text,
  started_at        timestamptz not null default now(),
  duration_seconds  integer check (duration_seconds >= 0),
  notes             text,
  created_at        timestamptz not null default now()
);

create index calls_organization_id_idx on public.calls (organization_id);
create index calls_owner_id_idx on public.calls (owner_id);
create index calls_started_at_idx on public.calls (started_at desc);

-- --------------------------- products -------------------------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  sku               text,
  type              text default 'Product' check (type in ('Product','Service','Subscription')),
  category          text,
  description       text,
  unit_price        numeric not null default 0 check (unit_price >= 0),
  currency          text default 'USD',
  tax_rate          numeric default 0 check (tax_rate >= 0),
  status            text default 'Active' check (status in ('Active','Inactive')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_organization_id_idx on public.products (organization_id);

-- ------------------------ deal_products ------------------------
-- Snapshots: product changes do not alter historical deal value.
create table public.deal_products (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  deal_id           uuid not null references public.deals(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  name_snapshot     text,
  quantity          numeric not null default 1 check (quantity > 0),
  unit_price        numeric not null default 0 check (unit_price >= 0),
  discount_amount   numeric not null default 0 check (discount_amount >= 0),
  tax_amount        numeric not null default 0 check (tax_amount >= 0),
  subtotal          numeric not null default 0 check (subtotal >= 0),
  created_at        timestamptz not null default now()
);

create index deal_products_organization_id_idx on public.deal_products (organization_id);
create index deal_products_deal_id_idx on public.deal_products (deal_id);

-- ---------------------------- quotes --------------------------
create table public.quotes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  quote_number      text,
  company_id        uuid,
  contact_id        uuid,
  deal_id           uuid,
  status            text default 'Draft' check (status in ('Draft','Sent','Viewed','Accepted','Rejected','Expired')),
  issue_date        date default current_date,
  expiry_date       date,
  currency          text default 'USD',
  subtotal          numeric not null default 0 check (subtotal >= 0),
  discount_total    numeric not null default 0 check (discount_total >= 0),
  tax_total         numeric not null default 0 check (tax_total >= 0),
  total             numeric not null default 0 check (total >= 0),
  terms             text,
  notes             text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index quotes_organization_id_idx on public.quotes (organization_id);
create index quotes_company_id_idx on public.quotes (company_id);
create index quotes_deal_id_idx on public.quotes (deal_id);
create unique index quotes_number_org_idx on public.quotes (organization_id, quote_number) where quote_number is not null;

-- ------------------------- quote_items ------------------------
create table public.quote_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  quote_id          uuid not null references public.quotes(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  description       text,
  quantity          numeric not null default 1 check (quantity > 0),
  unit_price        numeric not null default 0 check (unit_price >= 0),
  discount_amount   numeric not null default 0 check (discount_amount >= 0),
  tax_amount        numeric not null default 0 check (tax_amount >= 0),
  line_total        numeric not null default 0 check (line_total >= 0),
  position          integer not null default 0
);

create index quote_items_organization_id_idx on public.quote_items (organization_id);
create index quote_items_quote_id_idx on public.quote_items (quote_id);

-- --------------------------- invoices -------------------------
create table public.invoices (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_number    text,
  company_id        uuid,
  contact_id        uuid,
  deal_id           uuid references public.deals(id) on delete set null,
  quote_id          uuid references public.quotes(id) on delete set null,
  status            text default 'Draft' check (status in ('Draft','Sent','Partial','Paid','Overdue','Cancelled')),
  issue_date        date default current_date,
  due_date          date,
  currency          text default 'USD',
  subtotal          numeric not null default 0 check (subtotal >= 0),
  discount_total    numeric not null default 0 check (discount_total >= 0),
  tax_total         numeric not null default 0 check (tax_total >= 0),
  total             numeric not null default 0 check (total >= 0),
  paid_amount       numeric not null default 0 check (paid_amount >= 0),
  balance           numeric not null default 0 check (balance >= 0),
  notes             text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index invoices_organization_id_idx on public.invoices (organization_id);
create index invoices_company_id_idx on public.invoices (company_id);
create index invoices_deal_id_idx on public.invoices (deal_id);
create unique index invoices_number_org_idx on public.invoices (organization_id, invoice_number) where invoice_number is not null;

-- ------------------------ invoice_items -----------------------
create table public.invoice_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_id        uuid not null references public.invoices(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  description       text,
  quantity          numeric not null default 1 check (quantity > 0),
  unit_price        numeric not null default 0 check (unit_price >= 0),
  discount_amount   numeric not null default 0 check (discount_amount >= 0),
  tax_amount        numeric not null default 0 check (tax_amount >= 0),
  line_total        numeric not null default 0 check (line_total >= 0),
  position          integer not null default 0
);

create index invoice_items_organization_id_idx on public.invoice_items (organization_id);
create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- --------------------------- payments -------------------------
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_id        uuid references public.invoices(id) on delete set null,
  amount            numeric not null check (amount >= 0),
  currency          text default 'USD',
  method            text,
  status            text default 'Completed' check (status in ('Completed','Pending','Failed','Refunded')),
  reference         text,
  paid_at           timestamptz not null default now(),
  recorded_by       uuid,
  created_at        timestamptz not null default now()
);

create index payments_organization_id_idx on public.payments (organization_id);
create index payments_invoice_id_idx on public.payments (invoice_id);

-- --------------------------- projects -------------------------
create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  company_id        uuid,
  contact_id        uuid,
  source_deal_id    uuid references public.deals(id) on delete set null,
  owner_id          uuid,
  status            text default 'Not Started',
  start_date        date,
  target_date       date,
  budget            numeric check (budget >= 0),
  currency          text default 'USD',
  progress          numeric default 0 check (progress between 0 and 100),
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index projects_organization_id_idx on public.projects (organization_id);
create index projects_company_id_idx on public.projects (company_id);
create index projects_owner_id_idx on public.projects (owner_id);

-- ------------------------ support_tickets ---------------------
create table public.support_tickets (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  ticket_number     text,
  subject           text not null,
  description       text,
  contact_id        uuid,
  company_id        uuid,
  deal_id           uuid,
  project_id        uuid references public.projects(id) on delete set null,
  priority          text default 'Medium',
  status            text default 'New',
  category          text,
  owner_id          uuid,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  closed_at         timestamptz
);

create index support_tickets_organization_id_idx on public.support_tickets (organization_id);
create index support_tickets_company_id_idx on public.support_tickets (company_id);
create index support_tickets_owner_id_idx on public.support_tickets (owner_id);
create unique index support_tickets_number_org_idx on public.support_tickets (organization_id, ticket_number) where ticket_number is not null;

-- ------------------------ subscriptions -----------------------
create table public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  company_id        uuid,
  contact_id        uuid,
  plan_name         text,
  amount            numeric check (amount >= 0),
  currency          text default 'USD',
  billing_cycle     text default 'Monthly',
  start_date        date,
  renewal_date      date,
  status            text default 'Active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index subscriptions_organization_id_idx on public.subscriptions (organization_id);
create index subscriptions_company_id_idx on public.subscriptions (company_id);

-- ------------------------ notifications -----------------------
create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              text,
  title             text not null,
  message           text,
  related_type      text,
  related_id        uuid,
  is_read           boolean not null default false,
  created_at        timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (organization_id, user_id, is_read);
create index notifications_created_at_idx on public.notifications (created_at desc);

-- ------------------------- attachments ------------------------
create table public.attachments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  record_type       text,
  record_id         uuid,
  file_name         text not null,
  file_path         text not null,
  mime_type         text,
  size_bytes        bigint check (size_bytes >= 0),
  uploaded_by       uuid,
  created_at        timestamptz not null default now()
);

create index attachments_org_idx on public.attachments (organization_id);
create index attachments_record_idx on public.attachments (record_type, record_id);

-- ---------------------- document_sequences --------------------
-- Used by next_document_number() to generate QUO-/INV-/SUP- numbers
-- without collisions (Step 75).
create table public.document_sequences (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  kind              text not null, -- 'quote' | 'invoice' | 'ticket'
  last_value        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, kind)
);

-- ------------------- updated_at triggers -----------------------
create trigger meetings_set_updated_at before update on public.meetings
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

--
-- >>> source: 20260913000005_ai_audit.sql
--
-- ============================================================
-- Step 51 â€” AI agent foundation tables & audit logs
-- ============================================================

-- -------------------------- ai_agents -------------------------
create table public.ai_agents (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  agent_type        text,
  purpose           text,
  status            text default 'Active' check (status in ('Active','Paused','Archived','Error')),
  approval_mode     text default 'Ask Before Action',
  permissions       jsonb default '[]'::jsonb,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_activity_at  timestamptz
);

create index ai_agents_organization_id_idx on public.ai_agents (organization_id);

-- ---------------------- ai_agent_permissions -------------------
create table public.ai_agent_permissions (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  agent_id                uuid not null references public.ai_agents(id) on delete cascade,
  permission              text not null,
  requires_human_approval boolean not null default true,
  unique (agent_id, permission)
);

create index ai_agent_permissions_org_idx on public.ai_agent_permissions (organization_id);

-- ----------------------- ai_recommendations --------------------
create table public.ai_recommendations (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  agent_id              uuid references public.ai_agents(id) on delete set null,
  record_type           text,
  record_id             uuid,
  recommendation_type   text,
  title                 text not null,
  summary               text,
  confidence            numeric check (confidence between 0 and 100),
  status                text default 'pending' check (status in ('pending','applied','dismissed','archived')),
  created_at            timestamptz not null default now(),
  reviewed_at           timestamptz
);

create index ai_recommendations_org_idx on public.ai_recommendations (organization_id);
create index ai_recommendations_status_idx on public.ai_recommendations (status);

-- -------------------------- ai_approvals -----------------------
create table public.ai_approvals (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  agent_id          uuid references public.ai_agents(id) on delete set null,
  action_type       text,
  record_type       text,
  record_id         uuid,
  proposed_payload  jsonb default '{}'::jsonb,
  reason_summary    text,
  risk_level        text default 'Medium' check (risk_level in ('Low','Medium','High')),
  status            text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_at      timestamptz not null default now(),
  reviewed_by       uuid,
  reviewed_at       timestamptz
);

create index ai_approvals_org_idx on public.ai_approvals (organization_id);
create index ai_approvals_status_idx on public.ai_approvals (status);

-- --------------------------- audit_logs ------------------------
-- Append-only by design: no UPDATE/DELETE policy below.
create table public.audit_logs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid,
  action            text not null,
  record_type       text,
  record_id         uuid,
  old_values        jsonb,
  new_values        jsonb,
  ip_address        text,
  created_at        timestamptz not null default now()
);

create index audit_logs_org_idx on public.audit_logs (organization_id);
create index audit_logs_record_idx on public.audit_logs (record_type, record_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- --------------------- audit write helper ----------------------
create or replace function public.write_audit_log(
  p_organization_id uuid,
  p_action text,
  p_record_type text,
  p_record_id uuid,
  p_old_values jsonb default null,
  p_new_values jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (organization_id, user_id, action, record_type, record_id, old_values, new_values)
  values (p_organization_id, auth.uid(), p_action, p_record_type, p_record_id, p_old_values, p_new_values);
end;
$$;

-- ----------------------- updated_at triggers ---------------------
create trigger ai_agents_set_updated_at before update on public.ai_agents
  for each row execute function public.set_updated_at();
create trigger document_sequences_set_updated_at before update on public.document_sequences
  for each row execute function public.set_updated_at();

--
-- >>> source: 20260913000006_security_functions.sql
--
-- ============================================================
-- Step 51 â€” Security helpers, onboarding, conversions, numbering
-- ============================================================

-- ------------------------------------------------------------------
-- is_organization_member(org_id uuid)
-- Returns true if auth.uid() has an ACTIVE membership in org.
-- SECURITY DEFINER so the check itself cannot be blocked by RLS on
-- organization_members (prevents recursive RLS problems).
-- ------------------------------------------------------------------
create or replace function public.is_organization_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- ------------------------------------------------------------------
-- current_organization_id()
-- First active membership of auth.uid(). Used by data layer defaults.
-- ------------------------------------------------------------------
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.organization_id
  from public.organization_members m
  where m.user_id = auth.uid()
    and m.status = 'active'
  order by m.joined_at asc
  limit 1;
$$;

-- ------------------------------------------------------------------
-- has_permission(p_permission text, p_org_id uuid)
-- True if auth.uid() has an active membership in p_org_id whose role
-- grants p_permission. SECURITY DEFINER (postgres-owner) bypasses RLS.
-- Used inside RLS policies AND by the application data layer.
-- ------------------------------------------------------------------
create or replace function public.has_permission(p_permission text, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.roles r on r.id = m.role_id and r.organization_id = p_org_id
    join public.role_permissions rp on rp.role_id = r.id and rp.organization_id = p_org_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.key = p_permission
  );
$$;

-- ------------------------------------------------------------------
-- create_workspace(p_org_name, p_first_name, p_last_name, p_email)
-- Idempotent, transactional onboarding (Step 44 / 49):
--   1. organization    2. profile    3. membership
--   4. Admin role + all permissions    5. default pipeline + stages
-- SECURITY DEFINER so a fresh auth user can provision their workspace.
-- ------------------------------------------------------------------
create or replace function public.create_workspace(
  p_org_name    text,
  p_first_name  text,
  p_last_name   text,
  p_email       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid := auth.uid();
  v_org_id      uuid;
  v_admin_role  uuid;
  v_slug        text;
  v_pipeline    uuid;
  v_stages      text[] := array['New','Discovery','Qualified','Proposal','Negotiation','Won','Lost'];
  v_probs       int[]  := array[10,25,50,70,85,100,0];
  v_types       text[] := array['open','open','open','open','open','won','lost'];
  v_colors      text[] := array['#94a3b8','#6366f1','#22c55e','#f59e0b','#3b82f6','#10b981','#ef4444'];
  v_idx         int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Idempotent: never half-create a workspace.
  select organization_id into v_org_id
  from public.organization_members
  where user_id = v_user_id and status = 'active'
  order by joined_at asc
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  v_slug := lower(regexp_replace(coalesce(nullif(p_org_name,''), 'workspace'), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(v_slug, 40);

  insert into public.organizations (name, slug, created_by)
  values (coalesce(nullif(p_org_name,''), 'My Workspace'), v_slug, v_user_id)
  returning id into v_org_id;

  insert into public.profiles (id, organization_id, first_name, last_name, full_name, email, status)
  values (
    v_user_id,
    v_org_id,
    nullif(p_first_name,''),
    nullif(p_last_name,''),
    nullif(trim(coalesce(p_first_name,'') || ' ' || coalesce(p_last_name,'')), ''),
    p_email,
    'active'
  )
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    first_name      = coalesce(excluded.first_name, public.profiles.first_name),
    last_name       = coalesce(excluded.last_name, public.profiles.last_name),
    full_name       = coalesce(excluded.full_name, public.profiles.full_name),
    email           = coalesce(excluded.email, public.profiles.email),
    status          = 'active',
    updated_at      = now();

  insert into public.roles (organization_id, name, description, is_system)
  values (v_org_id, 'Admin', 'Full access to the organization', true)
  returning id into v_admin_role;

  insert into public.role_permissions (organization_id, role_id, permission_id)
  select v_org_id, v_admin_role, id from public.permissions;

  insert into public.organization_members (organization_id, user_id, role_id, status)
  values (v_org_id, v_user_id, v_admin_role, 'active');

  insert into public.pipelines (organization_id, name, description, is_default)
  values (v_org_id, 'Main Sales Pipeline', 'Default sales pipeline', true)
  returning id into v_pipeline;

  for v_idx in 1..array_length(v_stages, 1) loop
    insert into public.pipeline_stages
      (organization_id, pipeline_id, name, position, default_probability, color, stage_type)
    values
      (v_org_id, v_pipeline, v_stages[v_idx], v_idx - 1, v_probs[v_idx], v_colors[v_idx], v_types[v_idx]);
  end loop;

  return v_org_id;
end;
$$;

-- ------------------------------------------------------------------
-- next_document_number(p_org_id, p_kind)
-- Atomically increments a per-org sequence and formats a number.
-- Prevents QUO-/INV-/SUP- collisions under concurrency.
-- ------------------------------------------------------------------
create or replace function public.next_document_number(p_org_id uuid, p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last  integer;
  v_prefix text := case p_kind when 'quote' then 'QUO-' when 'invoice' then 'INV-' when 'ticket' then 'SUP-' else p_kind || '-' end;
begin
  insert into public.document_sequences (organization_id, kind, last_value)
  values (p_org_id, p_kind, 1)
  on conflict (organization_id, kind)
  do update set last_value = public.document_sequences.last_value + 1
  returning public.document_sequences.last_value into v_last;

  if v_last is null then
    select last_value into v_last from public.document_sequences
    where organization_id = p_org_id and kind = p_kind;
  end if;

  return v_prefix || lpad(v_last::text, 6, '0');
end;
$$;

-- BEFORE INSERT triggers assign numbers automatically when omitted.
create or replace function public.set_quote_number()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.quote_number is null then
    new.quote_number := public.next_document_number(new.organization_id, 'quote');
  end if;
  return new;
end;
$$;

create or replace function public.set_invoice_number()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.invoice_number is null then
    new.invoice_number := public.next_document_number(new.organization_id, 'invoice');
  end if;
  return new;
end;
$$;

create or replace function public.set_ticket_number()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.ticket_number is null then
    new.ticket_number := public.next_document_number(new.organization_id, 'ticket');
  end if;
  return new;
end;
$$;

create trigger quotes_set_number before insert on public.quotes
  for each row execute function public.set_quote_number();
create trigger invoices_set_number before insert on public.invoices
  for each row execute function public.set_invoice_number();
create trigger support_tickets_set_number before insert on public.support_tickets
  for each row execute function public.set_ticket_number();

-- ------------------------------------------------------------------
-- convert_lead(p_lead_id uuid, p_pipeline_id uuid default null)
-- Transactional lead -> Contact + Company + Deal conversion (Steps 52/57).
-- ------------------------------------------------------------------
create or replace function public.convert_lead(p_lead_id uuid, p_pipeline_id uuid default null)
returns uuid -- the created deal id
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id     uuid;
  v_lead       public.leads%rowtype;
  v_company_id uuid;
  v_contact_id uuid;
  v_pipeline   uuid;
  v_stage_id   uuid;
  v_deal_id    uuid;
  v_deal_name  text;
  v_user_id    uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_org_id := public.current_organization_id();
  if v_org_id is null then
    raise exception 'No active organization';
  end if;

  select * into v_lead from public.leads where id = p_lead_id;
  if v_lead is null or v_lead.organization_id <> v_org_id then
    raise exception 'Lead not found in workspace';
  end if;

  -- Idempotent
  if v_lead.converted_deal_id is not null then
    return v_lead.converted_deal_id;
  end if;

  -- Find existing company by exact name or create one.
  select id into v_company_id
  from public.companies
  where organization_id = v_org_id and lower(coalesce(name,'')) = lower(coalesce(v_lead.company_name,''))
  limit 1;

  if v_company_id is null and coalesce(v_lead.company_name,'') <> '' then
    insert into public.companies
      (organization_id, name, domain, email, phone, country, city, source, description, created_by)
    values
      (v_org_id, v_lead.company_name,
       lower(regexp_replace(coalesce(v_lead.company_name,''), '[^a-z0-9]+', '', 'g')),
       v_lead.email, v_lead.phone, v_lead.country, v_lead.city, v_lead.source, nullif(v_lead.description,''), v_user_id)
    returning id into v_company_id;
  end if;

  -- Create contact
  insert into public.contacts
    (organization_id, first_name, last_name, full_name, email, phone, whatsapp,
     company_id, job_title, owner_id, source, country, city, lifecycle_stage, created_by)
  values
    (v_org_id, v_lead.first_name, v_lead.last_name, v_lead.full_name, v_lead.email, v_lead.phone, v_lead.whatsapp,
     v_company_id, v_lead.job_title, v_lead.owner_id, v_lead.source, v_lead.country, v_lead.city, 'Opportunity', v_user_id)
  returning id into v_contact_id;

  -- Resolve pipeline/stage
  v_pipeline := coalesce(p_pipeline_id,
    (select id from public.pipelines where organization_id = v_org_id and is_default limit 1));
  select id into v_stage_id
  from public.pipeline_stages
  where pipeline_id = v_pipeline and stage_type = 'open'
  order by position asc
  limit 1;

  v_deal_name := coalesce(NULLIF(trim(coalesce(v_lead.full_name,'') || ' â€” ' || coalesce(v_lead.company_name,'')),' â€” '), 'New Deal');

  insert into public.deals
    (organization_id, name, company_id, primary_contact_id, pipeline_id, stage_id,
     value, currency, expected_revenue, probability, owner_id, source, created_by, last_activity_at)
  values
    (v_org_id, v_deal_name, v_company_id, v_contact_id, v_pipeline, v_stage_id,
     coalesce(v_lead.expected_value, 0), coalesce(v_lead.currency,'USD'), coalesce(v_lead.expected_value, 0),
     (select coalesce(default_probability, 0) from public.pipeline_stages where id = v_stage_id),
     v_lead.owner_id, v_lead.source, v_user_id, now())
  returning id into v_deal_id;

  if v_company_id is not null then
    insert into public.deal_contacts (organization_id, deal_id, contact_id, relationship_role, is_primary)
    values (v_org_id, v_deal_id, v_contact_id, 'Decision Maker', true);
    update public.companies set last_activity_at = now() where id = v_company_id;
  else
    insert into public.deal_contacts (organization_id, deal_id, contact_id, relationship_role, is_primary)
    values (v_org_id, v_deal_id, v_contact_id, 'Decision Maker', true);
  end if;

  -- Update lead as converted
  update public.leads
  set converted_contact_id = v_contact_id,
      converted_company_id = v_company_id,
      converted_deal_id = v_deal_id,
      converted_at = now(),
      status = 'Qualified',
      last_activity_at = now()
  where id = p_lead_id;

  -- Activities
  insert into public.activities (organization_id, activity_type, related_type, related_id, actor_user_id,
    contact_id, company_id, deal_id, lead_id, title, occurred_at)
  values
    (v_org_id, 'lead_converted', 'lead', p_lead_id, v_user_id, v_contact_id, v_company_id, v_deal_id, p_lead_id,
     'Lead converted to Opportunity', now()),
    (v_org_id, 'deal_created', 'deal', v_deal_id, v_user_id, v_contact_id, v_company_id, v_deal_id, p_lead_id,
     'Opportunity created from Lead', now());

  return v_deal_id;
end;
$$;

-- ------------------------------------------------------------------
-- move_deal_stage(p_deal_id, p_stage_id, p_apply_probability bool)
-- Atomic stage move + probability + won/lost bookkeeping + activity.
-- ------------------------------------------------------------------
create or replace function public.move_deal_stage(
  p_deal_id uuid,
  p_stage_id uuid,
  p_apply_probability boolean default true
)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id   uuid := public.current_organization_id();
  v_stage    public.pipeline_stages%rowtype;
  v_deal     public.deals;
  v_user_id  uuid := auth.uid();
begin
  if v_org_id is null then raise exception 'No active organization'; end if;
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_stage from public.pipeline_stages where id = p_stage_id;
  if v_stage is null or v_stage.organization_id <> v_org_id then
    raise exception 'Stage not found in workspace';
  end if;

  update public.deals
  set stage_id = p_stage_id,
      probability = case when p_apply_probability then v_stage.default_probability else probability end,
      expected_revenue = round(value * probability / 100 * 100) / 100.0,
      won_at = case when v_stage.stage_type = 'won' then now() else null end,
      lost_at = case when v_stage.stage_type = 'lost' then now() else null end,
      health_status = case when v_stage.stage_type = 'won' then 'Healthy'
                           when v_stage.stage_type = 'lost' then 'At Risk' else health_status end,
      last_activity_at = now(),
      updated_at = now()
  where id = p_deal_id and organization_id = v_org_id
  returning * into v_deal;

  if v_deal.id is null then
    raise exception 'Deal not found in workspace';
  end if;

  insert into public.activities (organization_id, activity_type, related_type, related_id, actor_user_id,
    deal_id, title, metadata, occurred_at)
  values (v_org_id, 'deal_stage_changed', 'deal', v_deal.id, v_user_id, v_deal.id,
    'Deal moved to ' || v_stage.name,
    jsonb_build_object('from_stage', null, 'to_stage', v_stage.name), now());

  -- Win / loss reasons get set by the data layer with user input.
  return v_deal;
end;
$$;

--
-- >>> source: 20260913000007_rls_policies.sql
--
-- ============================================================
-- Step 51 â€” Row Level Security policies (Steps 45â€“49)
--
-- Core rule: a user may only touch records in an organization
-- where they are an ACTIVE member. Writes that change a record's
-- organization must match the membership. Deletes require an
-- explicit permission. Audit logs and document_sequences are
-- append/system-only (no user policies).
-- ============================================================

-- Standard member-scoped pattern with optional permission-gated DELETE.
do $$
declare
  t text;
  d text;
begin
  -- Tables: SELECT / INSERT / UPDATE for all active members.
  foreach t in array array[
    'leads','contacts','companies','pipelines','pipeline_stages','deals',
    'deal_contacts','tasks','meetings','calls','products','deal_products',
    'quotes','quote_items','invoices','invoice_items','payments','projects',
    'support_tickets','subscriptions','attachments',
    'activities','notes','tags','record_tags'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %I on public.%I for select using (public.is_organization_member(organization_id));',
      t || '_select_member', t);
    execute format('create policy %I on public.%I for insert with check (public.is_organization_member(organization_id));',
      t || '_insert_member', t);
    execute format('create policy %I on public.%I for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));',
      t || '_update_member', t);
  end loop;

  -- Tables with an explicit DELETE permission.
  for t, d in
    select tt, pp from (values
      ('leads','lead.delete'),
      ('contacts','contact.delete'),
      ('companies','company.delete'),
      ('deals','deal.delete'),
      ('tasks','task.delete')
    ) as v(tt, pp)
  loop
    execute format('create policy %I on public.%I for delete using (public.is_organization_member(organization_id) and public.has_permission(%L, organization_id));',
      t || '_delete_permission', t, d);
  end loop;
end;
$$;

-- ---------------------------------------------------------------
-- profiles
-- User can read own profile and profiles of org members; update own.
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_organization_member(organization_id));

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------
-- organizations
-- Members can read/update their organization. No insert/delete policy:
-- workspaces are provisioned via create_workspace() (security definer).
-- ---------------------------------------------------------------
alter table public.organizations enable row level security;

create policy organizations_select_member on public.organizations
  for select using (public.is_organization_member(id) or created_by = auth.uid());

create policy organizations_update_member on public.organizations
  for update using (public.has_permission('settings.manage', id))
  with check (public.has_permission('settings.manage', id));

-- ---------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------
alter table public.organization_members enable row level security;

create policy members_select_member on public.organization_members
  for select using (public.is_organization_member(organization_id) or user_id = auth.uid());

create policy members_insert_admin on public.organization_members
  for insert with check (public.has_permission('users.manage', organization_id));

create policy members_update_admin on public.organization_members
  for update using (
    public.has_permission('users.manage', organization_id) or user_id = auth.uid()
  ) with check (
    public.has_permission('users.manage', organization_id) or (user_id = auth.uid() and status = 'deactivated')
  );

create policy members_delete_admin on public.organization_members
  for delete using (public.has_permission('users.manage', organization_id));

-- ---------------------------------------------------------------
-- roles / role_permissions / teams
-- ---------------------------------------------------------------
alter table public.roles enable row level security;
create policy roles_select_member on public.roles for select using (public.is_organization_member(organization_id));
create policy roles_insert_admin on public.roles for insert with check (public.has_permission('users.manage', organization_id));
create policy roles_update_admin on public.roles for update using (public.has_permission('users.manage', organization_id)) with check (public.has_permission('users.manage', organization_id));
create policy roles_delete_admin on public.roles for delete using (public.has_permission('users.manage', organization_id));

alter table public.role_permissions enable row level security;
create policy rp_select_member on public.role_permissions for select using (public.is_organization_member(organization_id));
create policy rp_insert_admin on public.role_permissions for insert with check (public.has_permission('users.manage', organization_id));
create policy rp_update_admin on public.role_permissions for update using (public.has_permission('users.manage', organization_id)) with check (public.has_permission('users.manage', organization_id));
create policy rp_delete_admin on public.role_permissions for delete using (public.has_permission('users.manage', organization_id));

alter table public.teams enable row level security;
create policy teams_select_member on public.teams for select using (public.is_organization_member(organization_id));
create policy teams_insert_member on public.teams for insert with check (public.is_organization_member(organization_id) and public.has_permission('teams.manage', organization_id));
create policy teams_update_member on public.teams for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy teams_delete_member on public.teams for delete using (public.has_permission('teams.manage', organization_id));

-- ---------------------------------------------------------------
-- permissions (global catalog â€” readable, not writable by humans)
-- ---------------------------------------------------------------
alter table public.permissions enable row level security;
create policy permissions_select_public on public.permissions for select using (true);

-- ---------------------------------------------------------------
-- organization_invites
-- ---------------------------------------------------------------
alter table public.organization_invites enable row level security;
create policy invites_select_member on public.organization_invites for select using (public.is_organization_member(organization_id));
create policy invites_insert_admin on public.organization_invites for insert with check (public.has_permission('users.manage', organization_id));
create policy invites_update_admin on public.organization_invites for update using (public.has_permission('users.manage', organization_id)) with check (public.has_permission('users.manage', organization_id));
create policy invites_delete_admin on public.organization_invites for delete using (public.has_permission('users.manage', organization_id));

-- ---------------------------------------------------------------
-- notifications (personal)
-- ---------------------------------------------------------------
alter table public.notifications enable row level security;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------
-- audit_logs (append-only; SELECT gated by audit.view)
-- ---------------------------------------------------------------
alter table public.audit_logs enable row level security;
create policy audit_select_viewer on public.audit_logs
  for select using (public.is_organization_member(organization_id) and public.has_permission('audit.view', organization_id));

-- ---------------------------------------------------------------
-- ai tables
-- ---------------------------------------------------------------
alter table public.ai_agents enable row level security;
create policy agents_select_member on public.ai_agents for select using (public.is_organization_member(organization_id));
create policy agents_insert_admin on public.ai_agents for insert with check (public.is_organization_member(organization_id));
create policy agents_update_admin on public.ai_agents for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy agents_delete_admin on public.ai_agents for delete using (public.is_organization_member(organization_id));

alter table public.ai_agent_permissions enable row level security;
create policy aap_select_member on public.ai_agent_permissions for select using (public.is_organization_member(organization_id));
create policy aap_insert_member on public.ai_agent_permissions for insert with check (public.is_organization_member(organization_id));
create policy aap_update_member on public.ai_agent_permissions for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy aap_delete_member on public.ai_agent_permissions for delete using (public.is_organization_member(organization_id));

alter table public.ai_recommendations enable row level security;
create policy recs_select_member on public.ai_recommendations for select using (public.is_organization_member(organization_id));
create policy recs_insert_member on public.ai_recommendations for insert with check (public.is_organization_member(organization_id));
create policy recs_update_member on public.ai_recommendations for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy recs_delete_member on public.ai_recommendations for delete using (public.is_organization_member(organization_id));

alter table public.ai_approvals enable row level security;
create policy approvals_select_member on public.ai_approvals for select using (public.is_organization_member(organization_id));
create policy approvals_insert_member on public.ai_approvals for insert with check (public.is_organization_member(organization_id));
create policy approvals_update_member on public.ai_approvals for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy approvals_delete_member on public.ai_approvals for delete using (public.is_organization_member(organization_id));

-- ---------------------------------------------------------------
-- document_sequences (system-managed only â€” no user policies)
-- ---------------------------------------------------------------
alter table public.document_sequences enable row level security;

--
-- >>> source: 20260913000008_storage.sql
--
-- ============================================================
-- Step 51 â€” Storage buckets & policies (Steps 65â€“67)
-- Private buckets: avatars, crm-files, support-attachments.
-- Object path convention: {organizationId}/{...} so policies can
-- scope access to the uploader's organization.
--
-- BEST-EFFORT: on newer Supabase projects the SQL Editor role
-- (postgres) is not a superuser and may lack DDL rights on the
-- storage schema (owned by supabase_storage_admin). If denied,
-- this block raises a NOTICE and SKIPS storage setup instead of
-- failing the whole migration â€” the rest of the schema is
-- unaffected. Buckets + policies can be configured later from the
-- Dashboard (Storage) or by a role with storage ownership.
-- ============================================================

do $mig$
begin
  if not exists (select 1 from pg_catalog.pg_namespace where nspname = 'storage') then
    raise notice 'SKIP storage setup: storage schema does not exist';
    return;
  end if;

  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', false),
         ('crm-files', 'crm-files', false),
         ('support-attachments', 'support-attachments', false)
  on conflict (id) do nothing;

  -- Helper: is the object path inside an org the user is a member of?
  create or replace function storage.can_access_org_path(bucket text, path text)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select public.is_organization_member(
      nullif(split_part(path, '/', 1), '')::uuid
    );
  $$;

  -- avatars: users manage their own folder {orgId}/{userId}/...
  create policy avatars_select on storage.objects
    for select using (
      bucket_id = 'avatars' and storage.can_access_org_path(bucket_id, name)
    );

  create policy avatars_insert on storage.objects
    for insert with check (
      bucket_id = 'avatars'
      and storage.can_access_org_path(bucket_id, name)
      and split_part(name, '/', 2) = auth.uid()::text
    );

  create policy avatars_update on storage.objects
    for update using (
      bucket_id = 'avatars'
      and storage.can_access_org_path(bucket_id, name)
      and split_part(name, '/', 2) = auth.uid()::text
    );

  create policy avatars_delete on storage.objects
    for delete using (
      bucket_id = 'avatars'
      and storage.can_access_org_path(bucket_id, name)
      and split_part(name, '/', 2) = auth.uid()::text
    );

  -- crm-files + support-attachments: org member scoped
  create policy crm_files_select on storage.objects
    for select using (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy crm_files_insert on storage.objects
    for insert with check (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy crm_files_update on storage.objects
    for update using (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy crm_files_delete on storage.objects
    for delete using (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_select on storage.objects
    for select using (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_insert on storage.objects
    for insert with check (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_update on storage.objects
    for update using (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_delete on storage.objects
    for delete using (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  raise notice 'Storage setup applied (buckets + policies)';
exception
  when insufficient_privilege then
    raise notice 'SKIP storage setup: session role lacks privileges on schema storage (configure from Dashboard -> Storage). %', sqlerrm;
  when others then
    raise notice 'SKIP storage setup: %', sqlerrm;
end
$mig$;

