-- ============================================================
-- Whats Web Connections — FinloNexa SaaS
-- Stores per-organization WhatsApp Web connection state.
-- One active connection per organization.
-- ============================================================

create table if not exists public.whatsapp_web_connections (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  connected_by_user_id  uuid not null references public.profiles(id) on delete set null,
  phone_number          text not null,
  display_name          text not null,
  status                text not null default 'disconnected'
                      check (status in ('connecting','connected','disconnected','error','logged_out')),
  connection_type       text not null default 'WHATSAPP_WEB'
                      check (connection_type = 'WHATSAPP_WEB'),
  session_reference     text not null,
  last_connected_at     timestamptz,
  last_disconnected_at  timestamptz,
  last_sync_at          timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists whatsapp_web_connections_org_idx
  on public.whatsapp_web_connections (organization_id);

create index if not exists whatsapp_web_connections_status_idx
  on public.whatsapp_web_connections (status);

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
alter table public.whatsapp_web_connections enable row level security;

-- Organizations can only read/write their own connection.
create policy whatsapp_web_connections_org_select on public.whatsapp_web_connections
  for select to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_web_connections_org_insert on public.whatsapp_web_connections
  for insert to authenticated
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_web_connections_org_update on public.whatsapp_web_connections
  for update to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_web_connections_org_delete on public.whatsapp_web_connections
  for delete to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create trigger whatsapp_web_connections_set_updated_at before update on public.whatsapp_web_connections
  for each row execute function public.set_updated_at();