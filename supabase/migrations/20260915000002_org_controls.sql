-- ============================================================
-- Organization Controls (Platform Admin) — FinloNexa SaaS
-- ============================================================
-- Lets platform admins restrict or limit what an organization
-- can use: overall status and per-feature blocks, persisted in
-- a dedicated table. Safe, additive migration.
-- ============================================================

create table if not exists public.platform_org_controls (
  organization_id  uuid primary key references public.organizations(id) on delete cascade,
  status           text not null default 'active'
                   check (status in ('active','restricted','suspended')),
  blocked_features text[] not null default '{}',
  reason           text,
  updated_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists platform_org_controls_status_idx
  on public.platform_org_controls (status);

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
alter table public.platform_org_controls enable row level security;

-- Visible to platform admins only.
drop policy if exists platform_org_controls_select on public.platform_org_controls;
create policy platform_org_controls_select on public.platform_org_controls
  for select to authenticated
  using (public.is_platform_admin());

-- Writes via service role (server actions) or platform_settings.manage.
drop policy if exists platform_org_controls_write on public.platform_org_controls;
create policy platform_org_controls_write on public.platform_org_controls
  for all to authenticated
  using (public.has_platform_permission('platform_settings.manage'))
  with check (public.has_platform_permission('platform_settings.manage'));

create trigger platform_org_controls_set_updated_at before update on public.platform_org_controls
  for each row execute function public.set_updated_at();