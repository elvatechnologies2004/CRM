-- ============================================================
-- Platform Administration (Steps 120+) — FinloNexa SaaS Platform Admin
-- ============================================================
-- Safe, additive migration. No existing CRM tables are dropped,
-- altered, or truncated. RLS is enabled (not broad `USING (true)`).
--
-- 1. platform_admins          — platform operator membership + role
-- 2. platform_permissions     — canonical platform permission catalog
-- 3. platform_role_permissions— role -> permission grants
-- 4. platform_audit_log       — append-only platform audit trail
-- 5. platform_feature_flags   — global / plan / org scoped flags
-- 6. security helpers         — is_platform_admin / platform_admin_role /
--                                 has_platform_permission
-- ============================================================

-- ------------------------------------------------------------------
-- platform_admins
-- ------------------------------------------------------------------
create table if not exists public.platform_admins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'platform_admin'
                check (role in ('super_admin','platform_admin','support_admin','billing_admin','viewer')),
  status        text not null default 'active' check (status in ('active','deactivated')),
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id)
);

create index if not exists platform_admins_status_idx on public.platform_admins (status);
create index if not exists platform_admins_role_idx on public.platform_admins (role);

-- ------------------------------------------------------------------
-- platform_permissions (Phase 24 catalog)
-- ------------------------------------------------------------------
create table if not exists public.platform_permissions (
  key         text primary key,
  description text
);

insert into public.platform_permissions (key, description) values
  ('platform.dashboard.view', 'View the platform admin dashboard'),
  ('organizations.view', 'View all organizations'),
  ('organizations.manage', 'Manage organizations'),
  ('users.view', 'View platform users'),
  ('users.manage', 'Manage platform users'),
  ('subscriptions.view', 'View subscriptions'),
  ('subscriptions.manage', 'Manage subscriptions'),
  ('billing.view', 'View billing and revenue'),
  ('billing.manage', 'Manage billing'),
  ('support.view', 'View platform support tickets'),
  ('support.manage', 'Manage platform support tickets'),
  ('usage.view', 'View usage and limits'),
  ('ai.view', 'View AI operations'),
  ('ai.manage', 'Manage AI operations'),
  ('automations.view', 'View automation operations'),
  ('automations.manage', 'Manage automation operations'),
  ('integrations.view', 'View integration status'),
  ('integrations.manage', 'Manage integrations'),
  ('system.view', 'View system health'),
  ('audit.view', 'View platform audit log'),
  ('feature_flags.view', 'View feature flags'),
  ('feature_flags.manage', 'Manage feature flags'),
  ('platform_settings.manage', 'Manage platform settings and admin users')
on conflict (key) do nothing;

-- ------------------------------------------------------------------
-- platform_role_permissions (initial grants)
-- ------------------------------------------------------------------
create table if not exists public.platform_role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role          text not null check (role in ('super_admin','platform_admin','support_admin','billing_admin','viewer')),
  permission_key text not null references public.platform_permissions(key) on delete cascade,
  unique (role, permission_key)
);

insert into public.platform_role_permissions (role, permission_key)
select 'super_admin', key from public.platform_permissions
on conflict (role, permission_key) do nothing;

insert into public.platform_role_permissions (role, permission_key) values
  ('platform_admin','platform.dashboard.view'),
  ('platform_admin','organizations.view'),
  ('platform_admin','organizations.manage'),
  ('platform_admin','users.view'),
  ('platform_admin','users.manage'),
  ('platform_admin','subscriptions.view'),
  ('platform_admin','subscriptions.manage'),
  ('platform_admin','billing.view'),
  ('platform_admin','usage.view'),
  ('platform_admin','ai.view'),
  ('platform_admin','ai.manage'),
  ('platform_admin','automations.view'),
  ('platform_admin','automations.manage'),
  ('platform_admin','integrations.view'),
  ('platform_admin','system.view'),
  ('platform_admin','audit.view'),
  ('platform_admin','feature_flags.view'),
  ('platform_admin','feature_flags.manage'),
  ('support_admin','platform.dashboard.view'),
  ('support_admin','organizations.view'),
  ('support_admin','users.view'),
  ('support_admin','support.view'),
  ('support_admin','support.manage'),
  ('support_admin','audit.view'),
  ('billing_admin','platform.dashboard.view'),
  ('billing_admin','organizations.view'),
  ('billing_admin','subscriptions.view'),
  ('billing_admin','subscriptions.manage'),
  ('billing_admin','billing.view'),
  ('billing_admin','billing.manage'),
  ('billing_admin','usage.view'),
  ('viewer','platform.dashboard.view'),
  ('viewer','organizations.view'),
  ('viewer','users.view'),
  ('viewer','subscriptions.view'),
  ('viewer','billing.view'),
  ('viewer','usage.view'),
  ('viewer','system.view'),
  ('viewer','audit.view')
on conflict (role, permission_key) do nothing;

create index if not exists platform_role_permissions_role_idx on public.platform_role_permissions (role);
create index if not exists platform_role_permissions_key_idx on public.platform_role_permissions (permission_key);

-- ------------------------------------------------------------------
-- platform_audit_log (append-only — no UPDATE/DELETE policies)
-- ------------------------------------------------------------------
create table if not exists public.platform_audit_log (
  id              uuid primary key default gen_random_uuid(),
  admin_user_id   uuid,
  organization_id uuid references public.organizations(id) on delete set null,
  action          text not null,
  target_type     text,
  target_id       text,
  target_label    text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists platform_audit_log_admin_idx on public.platform_audit_log (admin_user_id);
create index if not exists platform_audit_log_org_idx on public.platform_audit_log (organization_id);
create index if not exists platform_audit_log_created_at_idx on public.platform_audit_log (created_at desc);

-- ------------------------------------------------------------------
-- platform_feature_flags
-- ------------------------------------------------------------------
create table if not exists public.platform_feature_flags (
  id              uuid primary key default gen_random_uuid(),
  key             text not null unique,
  label           text,
  description     text,
  scope           text not null default 'global' check (scope in ('global','plan','organization')),
  plan_code       text,
  organization_id uuid references public.organizations(id) on delete cascade,
  enabled         boolean not null default false,
  metadata        jsonb default '{}'::jsonb,
  updated_by      uuid,
  updated_at      timestamptz not null default now()
);

-- Initial informational flags (features that exist in the product).
insert into public.platform_feature_flags (key, label, description, scope, enabled) values
  ('ai_agents', 'AI Agents', 'AI agents, recommendations and approvals', 'global', true),
  ('advanced_automation', 'Advanced Automation', 'Automation engine, runs and jobs', 'global', true),
  ('customer_portal', 'Customer Portal', 'Customer-facing self-service portal', 'global', true),
  ('whatsapp', 'WhatsApp Channel', 'WhatsApp messaging channel', 'global', false),
  ('advanced_reports', 'Advanced Reports', 'Reports, forecast and win/loss analytics', 'global', true)
on conflict (key) do update
  set label = excluded.label, description = excluded.description, scope = excluded.scope;

-- ------------------------------------------------------------------
-- Security helpers
-- ------------------------------------------------------------------
-- is_platform_admin(): true when auth.uid() is an active platform admin.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid() and status = 'active'
  );
$$;

-- platform_admin_role(): the caller's platform role (null when not admin).
create or replace function public.platform_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.platform_admins p
  where p.user_id = auth.uid() and p.status = 'active'
  limit 1;
$$;

-- has_platform_permission(): role-granted platform permission check.
create or replace function public.has_platform_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins a
    join public.platform_role_permissions rp on rp.role = a.role
    where a.user_id = auth.uid()
      and a.status = 'active'
      and rp.permission_key = p_permission
  );
$$;

-- ------------------------------------------------------------------
-- RLS (enabled everywhere; no USING (true) policies)
-- ------------------------------------------------------------------
alter table public.platform_admins enable row level security;
alter table public.platform_permissions enable row level security;
alter table public.platform_role_permissions enable row level security;
alter table public.platform_audit_log enable row level security;
alter table public.platform_feature_flags enable row level security;

-- platform_admins: visible to platform admins only; write managed by super_admin.
drop policy if exists platform_admins_select on public.platform_admins;
create policy platform_admins_select on public.platform_admins
  for select to authenticated
  using (public.is_platform_admin());

drop policy if exists platform_admins_write on public.platform_admins;
create policy platform_admins_write on public.platform_admins
  for all to authenticated
  using (public.platform_admin_role() = 'super_admin')
  with check (public.platform_admin_role() = 'super_admin');

-- platform_permissions / platform_role_permissions: read-only catalog.
drop policy if exists platform_permissions_select on public.platform_permissions;
create policy platform_permissions_select on public.platform_permissions
  for select to authenticated
  using (public.is_platform_admin());

drop policy if exists platform_role_permissions_select on public.platform_role_permissions;
create policy platform_role_permissions_select on public.platform_role_permissions
  for select to authenticated
  using (public.is_platform_admin());

-- platform_audit_log: platform admins may read; writes are server-only
-- (service role / security-definer helpers), so no public write policy.
drop policy if exists platform_audit_log_select on public.platform_audit_log;
create policy platform_audit_log_select on public.platform_audit_log
  for select to authenticated
  using (public.is_platform_admin());

-- platform_feature_flags: admins may read; feature_flags.manage may write.
drop policy if exists platform_feature_flags_select on public.platform_feature_flags;
create policy platform_feature_flags_select on public.platform_feature_flags
  for select to authenticated
  using (public.is_platform_admin());

drop policy if exists platform_feature_flags_write on public.platform_feature_flags;
create policy platform_feature_flags_write on public.platform_feature_flags
  for all to authenticated
  using (public.has_platform_permission('feature_flags.manage'))
  with check (public.has_platform_permission('feature_flags.manage'));

-- ------------------------------------------------------------------
-- Audit helper (append-only) and updated_at trigger
-- ------------------------------------------------------------------
create or replace function public.write_platform_audit(
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_target_label text default null,
  p_organization_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.platform_audit_log
    (admin_user_id, organization_id, action, target_type, target_id, target_label, metadata)
  values
    (auth.uid(), p_organization_id, p_action, p_target_type, p_target_id, p_target_label, p_metadata);
$$;

create trigger platform_admins_set_updated_at before update on public.platform_admins
  for each row execute function public.set_updated_at();
create trigger platform_feature_flags_set_updated_at before update on public.platform_feature_flags
  for each row execute function public.set_updated_at();