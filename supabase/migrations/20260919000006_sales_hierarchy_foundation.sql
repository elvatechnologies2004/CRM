-- ============================================================
-- FinloNexa CRM — Phase 1: Sales Hierarchy Foundation
--
--  Head of Sales
--    └── Region (South / Central / North)
--          └── RSM  (Regional Sales Manager, owns a Region)
--                └── BDO / BDO team
--
-- Additive-only. Creates new tables/columns/roles/permissions and
-- grants them to existing orgs. Touches NO existing CRM data, does
-- not drop or rework any table, schema, role, membership, lead,
-- opportunity, meeting, proposal, task, dashboard or admin surface.
--
-- Conventions mirrored from this repo's existing migrations:
--   * roles / role_permissions / permissions  (20260913000002)
--   * region-style RLS via is_organization_member() + has_permission()
--   * idempotent per-organization seeding with on conflict do nothing
-- ============================================================

-- ------------------------------------------------------------
-- 1. Permission catalog (idempotent)
-- ------------------------------------------------------------
insert into public.permissions (key, description) values
  ('sales.hierarchy.manage', 'Manage the sales hierarchy: regions, RSM and BDO assignments'),
  ('region.manage', 'Manage sales regions')
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- 2. Roles - sales roles seeded per organization (idempotent)
-- ------------------------------------------------------------
insert into public.roles (organization_id, name, description, is_system)
select
  o.id,
  role_name.name,
  case role_name.name
    when 'Head of Sales' then 'Highest sales authority for the organization'
    when 'RSM' then 'Regional Sales Manager - leads a sales region and its BDO team'
    else 'Business Development Officer - field sales role reporting to an RSM'
  end,
  true
from public.organizations o
cross join (values ('Head of Sales'), ('RSM'), ('BDO')) as role_name(name)
on conflict (organization_id, name) do nothing;

-- Grant sales permissions to the 'Head of Sales' role in every organization.
insert into public.role_permissions (organization_id, role_id, permission_id)
select
  r.organization_id,
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'Head of Sales'
  and p.key in ('sales.hierarchy.manage', 'region.manage')
on conflict do nothing;

-- Grant region management to the 'RSM' role in every organization.
insert into public.role_permissions (organization_id, role_id, permission_id)
select
  r.organization_id,
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.name = 'RSM'
  and p.key in ('region.manage')
on conflict do nothing;

-- ------------------------------------------------------------
-- 3. Sales regions (org-scoped, configurable later from Admin)
-- ------------------------------------------------------------
create table if not exists public.sales_regions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  code            text,
  description     text,
  status          text not null default 'active' check (status in ('active', 'archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create index if not exists sales_regions_organization_idx on public.sales_regions (organization_id);
create index if not exists sales_regions_code_idx on public.sales_regions (organization_id, code);

alter table public.sales_regions enable row level security;

create policy sales_regions_select on public.sales_regions
  for select using (public.is_organization_member(organization_id));

create policy sales_regions_insert on public.sales_regions
  for insert with check (
    public.is_organization_member(organization_id)
    and public.has_permission('region.manage', organization_id)
  );

create policy sales_regions_update on public.sales_regions
  for update using (
    public.is_organization_member(organization_id)
    and public.has_permission('region.manage', organization_id)
  ) with check (
    public.is_organization_member(organization_id)
    and public.has_permission('region.manage', organization_id)
  );

create policy sales_regions_delete on public.sales_regions
  for delete using (
    public.is_organization_member(organization_id)
    and public.has_permission('region.manage', organization_id)
  );

-- ------------------------------------------------------------
-- 4. Hierarchy on memberships (RSM -> Region, BDO -> Region + RSM)
-- ------------------------------------------------------------
alter table public.organization_members
  add column if not exists sales_region_id uuid;

alter table public.organization_members
  add column if not exists reports_to_user_id uuid;

alter table public.organization_members
  drop constraint if exists organization_members_sales_region_fkey;

alter table public.organization_members
  add constraint organization_members_sales_region_fkey
  foreign key (sales_region_id) references public.sales_regions(id) on delete set null;

alter table public.organization_members
  drop constraint if exists organization_members_reports_to_fkey;

alter table public.organization_members
  add constraint organization_members_reports_to_fkey
  foreign key (reports_to_user_id) references public.profiles(id) on delete set null;

create index if not exists organization_members_sales_region_idx on public.organization_members (sales_region_id);
create index if not exists organization_members_reports_to_idx on public.organization_members (reports_to_user_id);

-- ------------------------------------------------------------
-- 5. Integrity guard - same-organization hierarchy (server-side
--    enforcement in addition to RLS; prevents cross-org assignment)
-- ------------------------------------------------------------
create or replace function public.members_same_organization(p_org_id uuid, p_user_id uuid, p_manager_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members u
    join public.organization_members m
      on m.organization_id = u.organization_id
      and m.user_id = p_manager_user_id
    where u.organization_id = p_org_id
      and u.user_id = p_user_id
      and u.status = 'active'
      and m.status = 'active'
  ) or p_manager_user_id is null;
$$;

-- Validate hierarchy assignment invariants on insert/update:
--   * region must belong to the same organization
--   * manager (reports_to) must be an active member of the same organization
create or replace function public.validate_sales_hierarchy_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sales_region_id is not null
     and not exists (
       select 1 from public.sales_regions r
       where r.id = new.sales_region_id
         and r.organization_id = new.organization_id
     ) then
    raise exception 'Sales region does not belong to this organization';
  end if;

  if new.reports_to_user_id is not null
     and not public.members_same_organization(new.organization_id, new.user_id, new.reports_to_user_id) then
    raise exception 'RSM must be an active member of the same organization';
  end if;

  return new;
end;
$$;

drop trigger if exists organization_members_hierarchy_check on public.organization_members;
create trigger organization_members_hierarchy_check
  before insert or update of sales_region_id, reports_to_user_id, user_id, organization_id
  on public.organization_members
  for each row
  execute function public.validate_sales_hierarchy_assignment();

-- RLS so membership hierarchy updates require the users.manage permission
-- (consistent with the existing Manager-only pattern for organization_members).
drop policy if exists org_members_hierarchy_update on public.organization_members;
create policy org_members_hierarchy_update on public.organization_members
  for update using (
    public.is_organization_member(organization_id)
    and public.has_permission('users.manage', organization_id)
  ) with check (
    public.is_organization_member(organization_id)
    and public.has_permission('users.manage', organization_id)
  );

-- ------------------------------------------------------------
-- 6. Seed the three default regions (South / Central / North)
--    for every organization, idempotently.
-- ------------------------------------------------------------
insert into public.sales_regions (organization_id, name, code)
select o.id, region.name, upper(replace(region.name, ' ', '_'))
from public.organizations o
cross join (values ('South'), ('Central'), ('North')) as region(name)
on conflict (organization_id, name) do nothing;

-- ------------------------------------------------------------
-- 7. Head of Sales at organization level - the existing
--    organization_members.role_id (roles table) already supports it:
--    assign the org-level 'Head of Sales' system role to a member.
--    No further schema required; RLS for selects remains unchanged.
-- ------------------------------------------------------------
