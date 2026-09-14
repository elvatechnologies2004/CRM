-- ============================================================
-- Phase A — Steps 121–123
-- Enterprise organization hierarchy, territory management,
-- advanced lead routing.
--
-- Applies to the existing schema WITHOUT breaking small orgs:
-- every added column is nullable and every new table is
-- organization-scoped with RLS that mirrors the existing
-- is_organization_member / has_permission pattern.
-- ============================================================

-- ------------------------------------------------------------
-- New permission catalog entries (idempotent).
-- ------------------------------------------------------------
insert into public.permissions (key, description) values
  ('automation.manage', 'Manage automation rules'),
  ('org.hierarchy.manage', 'Manage organization hierarchy'),
  ('territory.manage', 'Manage territories and assignment rules'),
  ('routing.manage', 'Manage lead routing rules'),
  ('approval.manage', 'Manage approvals and approval policies'),
  ('workflow.manage', 'Manage advanced workflow rules')
on conflict (key) do nothing;

-- Grant the new permissions to every existing Admin role so
-- enterprise features work for current organizations without
-- manual reconfiguration.
insert into public.role_permissions (organization_id, role_id, permission_id)
select r.organization_id, r.id, p.id
from public.roles r
join public.permissions p
  on p.key in (
    'automation.manage',
    'org.hierarchy.manage',
    'territory.manage',
    'routing.manage',
    'approval.manage',
    'workflow.manage'
  )
where r.name = 'Admin'
on conflict do nothing;

-- ============================================================
-- STEP 121 — ENTERPRISE ORGANIZATION MANAGEMENT
-- Hierarchy: Organization -> Region -> Department -> Team -> User
-- Also organization groups and business units.
-- ============================================================

create table public.org_groups (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  description       text,
  created_at        timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.org_group_members (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  group_id                uuid not null references public.org_groups(id) on delete cascade,
  member_organization_id  uuid not null references public.organizations(id) on delete cascade,
  created_at              timestamptz not null default now(),
  unique (group_id, member_organization_id)
);

create table public.business_units (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  description       text,
  head_user_id      uuid,
  created_at        timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.regions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  code              text,
  parent_region_id  uuid references public.regions(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.departments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  code              text,
  business_unit_id  uuid references public.business_units(id) on delete set null,
  region_id         uuid references public.regions(id) on delete set null,
  manager_user_id   uuid,
  created_at        timestamptz not null default now(),
  unique (organization_id, name)
);

-- Extend the existing teams table with optional hierarchy links
-- (all nullable so simple orgs are untouched).
alter table public.teams add column if not exists parent_team_id uuid;
alter table public.teams add column if not exists department_id uuid;
alter table public.teams add column if not exists business_unit_id uuid;
alter table public.teams add column if not exists region_id uuid;

alter table public.teams
  add constraint teams_parent_team_fkey foreign key (parent_team_id) references public.teams(id) on delete set null;
alter table public.teams
  add constraint teams_department_fkey foreign key (department_id) references public.departments(id) on delete set null;
alter table public.teams
  add constraint teams_business_unit_fkey foreign key (business_unit_id) references public.business_units(id) on delete set null;
alter table public.teams
  add constraint teams_region_fkey foreign key (region_id) references public.regions(id) on delete set null;

-- Optional direct department link on memberships.
alter table public.organization_members add column if not exists department_id uuid;
alter table public.organization_members
  add constraint organization_members_department_fkey foreign key (department_id) references public.departments(id) on delete set null;

create index org_groups_org_idx on public.org_groups (organization_id);
create index org_group_members_org_idx on public.org_group_members (organization_id);
create index org_group_members_group_idx on public.org_group_members (group_id);
create index business_units_org_idx on public.business_units (organization_id);
create index regions_org_idx on public.regions (organization_id);
create index regions_parent_idx on public.regions (parent_region_id);
create index departments_org_idx on public.departments (organization_id);
create index departments_bu_idx on public.departments (business_unit_id);
create index departments_region_idx on public.departments (region_id);
create index teams_parent_idx on public.teams (parent_team_id);
create index organization_members_department_idx on public.organization_members (department_id);

-- RLS — hierarchy tables: read for members, write for org.hierarchy.manage.
alter table public.org_groups enable row level security;
create policy org_groups_select_member on public.org_groups
  for select using (public.is_organization_member(organization_id));
create policy org_groups_insert_manage on public.org_groups
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy org_groups_update_manage on public.org_groups
  for update using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy org_groups_delete_manage on public.org_groups
  for delete using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));

alter table public.org_group_members enable row level security;
create policy org_group_members_select_member on public.org_group_members
  for select using (public.is_organization_member(organization_id));
create policy org_group_members_insert_manage on public.org_group_members
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy org_group_members_delete_manage on public.org_group_members
  for delete using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));

alter table public.business_units enable row level security;
create policy business_units_select_member on public.business_units
  for select using (public.is_organization_member(organization_id));
create policy business_units_insert_manage on public.business_units
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy business_units_update_manage on public.business_units
  for update using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy business_units_delete_manage on public.business_units
  for delete using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));

alter table public.regions enable row level security;
create policy regions_select_member on public.regions
  for select using (public.is_organization_member(organization_id));
create policy regions_insert_manage on public.regions
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy regions_update_manage on public.regions
  for update using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy regions_delete_manage on public.regions
  for delete using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));

alter table public.departments enable row level security;
create policy departments_select_member on public.departments
  for select using (public.is_organization_member(organization_id));
create policy departments_insert_manage on public.departments
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy departments_update_manage on public.departments
  for update using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));
create policy departments_delete_manage on public.departments
  for delete using (public.is_organization_member(organization_id) and public.has_permission('org.hierarchy.manage', organization_id));

-- ============================================================
-- STEP 122 — TERRITORY MANAGEMENT
-- ============================================================

create table public.territories (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  description       text,
  countries         text[] not null default '{}',
  regions           text[] not null default '{}',
  cities            text[] not null default '{}',
  industries        text[] not null default '{}',
  lead_sources      text[] not null default '{}',
  account_types     text[] not null default '{}',
  company_size_min  integer,
  company_size_max  integer,
  priority          integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.territory_members (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  territory_id      uuid not null references public.territories(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  is_lead           boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (territory_id, user_id)
);

create table public.territory_rules (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  territory_id      uuid not null references public.territories(id) on delete cascade,
  field             text not null check (field in ('country','region','city','industry','company_size','source','account_type','score')),
  operator          text not null check (operator in ('=','!=','in','not in','>','<','>=','<=')),
  value             jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index territories_org_idx on public.territories (organization_id);
create index territories_active_idx on public.territories (organization_id, is_active);
create index territory_members_org_idx on public.territory_members (organization_id);
create index territory_members_territory_idx on public.territory_members (territory_id);
create index territory_members_user_idx on public.territory_members (user_id);
create index territory_rules_org_idx on public.territory_rules (organization_id);
create index territory_rules_territory_idx on public.territory_rules (territory_id);

-- Leads gain territory + enterprise attributes (all nullable).
alter table public.leads add column if not exists industry text;
alter table public.leads add column if not exists company_size text;
alter table public.leads add column if not exists account_type text;
alter table public.leads add column if not exists territory_id uuid;
alter table public.leads add column if not exists previous_owner_id uuid;
alter table public.leads add column if not exists assigned_at timestamptz;
alter table public.leads add column if not exists assignment_reason text;
alter table public.leads add column if not exists routing_rule_id uuid;

alter table public.leads
  add constraint leads_territory_fkey foreign key (territory_id) references public.territories(id) on delete set null;
create index leads_territory_idx on public.leads (territory_id);
create index leads_assigned_at_idx on public.leads (assigned_at);

-- RLS — territories: read for members, write for territory.manage.
alter table public.territories enable row level security;
create policy territories_select_member on public.territories
  for select using (public.is_organization_member(organization_id));
create policy territories_insert_manage on public.territories
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id));
create policy territories_update_manage on public.territories
  for update using (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id));
create policy territories_delete_manage on public.territories
  for delete using (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id));

alter table public.territory_members enable row level security;
create policy territory_members_select_member on public.territory_members
  for select using (public.is_organization_member(organization_id));
create policy territory_members_insert_manage on public.territory_members
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id));
create policy territory_members_delete_manage on public.territory_members
  for delete using (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id));

alter table public.territory_rules enable row level security;
create policy territory_rules_select_member on public.territory_rules
  for select using (public.is_organization_member(organization_id));
create policy territory_rules_insert_manage on public.territory_rules
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id));
create policy territory_rules_delete_manage on public.territory_rules
  for delete using (public.is_organization_member(organization_id) and public.has_permission('territory.manage', organization_id));

-- ============================================================
-- STEP 123 — ADVANCED LEAD ROUTING
-- ============================================================

create table public.routing_rules (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  strategy          text not null check (strategy in (
    'round_robin',
    'least_loaded',
    'territory',
    'source_based',
    'product_based',
    'enterprise_account',
    'weighted',
    'vip'
  )),
  description       text,
  priority          integer not null default 0,
  is_active         boolean not null default true,
  conditions        jsonb not null default '{}'::jsonb,
  target_type       text not null default 'all' check (target_type in ('team','user','territory','all')),
  target_id         uuid,
  weight            integer not null default 1 check (weight >= 1),
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index routing_rules_org_idx on public.routing_rules (organization_id);
create index routing_rules_active_idx on public.routing_rules (organization_id, is_active);

alter table public.leads
  add constraint leads_routing_rule_fkey foreign key (routing_rule_id) references public.routing_rules(id) on delete set null;

-- RLS — routing rules: read for members, write for routing.manage.
alter table public.routing_rules enable row level security;
create policy routing_rules_select_member on public.routing_rules
  for select using (public.is_organization_member(organization_id));
create policy routing_rules_insert_manage on public.routing_rules
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('routing.manage', organization_id));
create policy routing_rules_update_manage on public.routing_rules
  for update using (public.is_organization_member(organization_id) and public.has_permission('routing.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('routing.manage', organization_id));
create policy routing_rules_delete_manage on public.routing_rules
  for delete using (public.is_organization_member(organization_id) and public.has_permission('routing.manage', organization_id));