-- ============================================================
-- Step 51 — Organizations, Profiles, Membership, Roles, Permissions
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