-- ============================================================
-- Step 51 â€” Core CRM tables (mirror frontend type shapes)
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