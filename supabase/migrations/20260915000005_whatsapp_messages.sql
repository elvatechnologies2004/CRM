-- ============================================================
-- WhatsApp Messages — FinloNexa SaaS
-- Individual messages sent/received via WhatsApp Web.
-- Uses external_message_id for deduplication.
-- Direction: 'inbound' or 'outbound'.
-- ============================================================

create table if not exists public.whatsapp_messages (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  connection_id         uuid not null references public.whatsapp_web_connections(id) on delete cascade,
  conversation_id       uuid not null references public.whatsapp_conversations(id) on delete cascade,
  external_message_id   text not null,                   -- WhatsApp message ID (unique per message)
  direction             text not null check (direction in ('inbound','outbound')),
  sender                text not null,                   -- Phone number in E.164 (who sent)
  recipient             text not null,                   -- Phone number in E.164 (who received)
  message_type          text not null check (message_type in ('text','image','document','audio','video','template')),
  body                  text,                            -- Message text (for text messages)
  media_reference       text,                            -- Reference to stored media (URL/path)
  reply_to_message_id   uuid references public.whatsapp_messages(id) on delete set null,
  sent_at               timestamptz,
  delivered_at          timestamptz,
  read_at               timestamptz,
  status                text not null default 'pending'
                      check (status in ('pending','sent','delivered','read','failed')),
  metadata              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists whatsapp_messages_org_idx
  on public.whatsapp_messages (organization_id);

create index if not exists whatsapp_messages_conn_idx
  on public.whatsapp_messages (connection_id);

create index if not exists whatsapp_messages_conv_idx
  on public.whatsapp_messages (conversation_id);

create index if not exists whatsapp_messages_ext_msg_idx
  on public.whatsapp_messages (external_message_id);

create index if not exists whatsapp_messages_sent_idx
  on public.whatsapp_messages (sent_at desc);

create index if not exists whatsapp_messages_status_idx
  on public.whatsapp_messages (status);

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
alter table public.whatsapp_messages enable row level security;

-- Organizations can only read/write their own messages.
create policy whatsapp_messages_org_select on public.whatsapp_messages
  for select to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_messages_org_insert on public.whatsapp_messages
  for insert to authenticated
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_messages_org_update on public.whatsapp_messages
  for update to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy whatsapp_messages_org_delete on public.whatsapp_messages
  for delete to authenticated
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create trigger whatsapp_messages_set_updated_at before update on public.whatsapp_messages
  for each row execute function public.set_updated_at();