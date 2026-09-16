-- ============================================================
-- WhatsApp Conversations — FinloNexa SaaS
-- One conversation per external WhatsApp chat.
-- Ties to organization, connection, and optionally a CRM record.
-- ============================================================

create table if not exists public.whatsapp_conversations (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  connection_id         uuid not null references public.whatsapp_web_connections(id) on delete cascade,
  external_chat_id      text not null,                   -- WhatsApp sender phone number or chat ID
  contact_id            uuid references public.profiles(id) on delete set null,
  lead_id               uuid references public.leads(id) on delete set null,
  deal_id               uuid references public.deals(id) on delete set null,
  display_name          text,                            -- Customer display name
  phone_number          text not null,                   -- E.164 formatted
  unread_count          integer not null default 0,
  last_message_at       timestamptz not null default now(),
  metadata              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists whatsapp_conversations_org_idx
  on public.whatsapp_conversations (organization_id);

create index if not exists whatsapp_conversations_conn_idx
  on public.whatsapp_conversations (connection_id);

create index if not exists whatsapp_conversations_ext_idx
  on public.whatsapp_conversations (external_chat_id);

create index if not exists whatsapp_conversations_last_msg_idx
  on public.whatsapp_conversations (last_message_at desc);

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
alter table public.whatsapp_conversations enable row level security;

-- Organizations can only read/write their own conversations.
create policy whatsapp_conversations_org_select on public.whatsapp_conversations
  for select to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_conversations_org_insert on public.whatsapp_conversations
  for insert to authenticated
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_conversations_org_update on public.whatsapp_conversations
  for update to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_conversations_org_delete on public.whatsapp_conversations
  for delete to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create trigger whatsapp_conversations_set_updated_at before update on public.whatsapp_conversations
  for each row execute function public.set_updated_at();