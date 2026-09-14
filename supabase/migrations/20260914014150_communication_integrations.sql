-- ============================================================
-- Step 54 — Communication integrations (email, calendar, WhatsApp)
-- ============================================================

-- ---------------------------- connected_accounts ----------------------------
-- OAuth-connected accounts (Gmail, Outlook, etc.)
-- Tokens are NEVER stored unencrypted.
create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null check (provider in ('gmail', 'outlook', 'google_calendar', 'outlook_calendar', 'whatsapp')),
  provider_account_id text not null,

  -- Encrypted tokens (stored as base64 of AES-256-GCM ciphertext)
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,

  -- OAuth scopes granted
  scopes text[],

  -- Status: connected, disconnected, error, expired
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'error', 'expired')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index connected_accounts_organization_id_idx on public.connected_accounts (organization_id);
create index connected_accounts_user_id_idx on public.connected_accounts (user_id);
create index connected_accounts_provider_idx on public.connected_accounts (provider);
create unique index connected_accounts_provider_account_idx on public.connected_accounts (provider, provider_account_id);

-- ---------------------------- emails ----------------------------
-- Email messages linked to CRM records
create table public.emails (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  provider text,
  external_message_id text,
  thread_id text,

  from_address text not null,
  to_addresses text[] default '{}',
  cc_addresses text[] default '{}',
  bcc_addresses text[] default '{}',

  subject text,
  body_preview text,

  -- inbound | outbound
  direction text not null check (direction in ('inbound', 'outbound')),

  -- sent | delivered | read | failed | bounced
  status text default 'sent' check (status in ('sent', 'delivered', 'read', 'failed', 'bounced')),

  -- CRM record linkage
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,

  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index emails_organization_id_idx on public.emails (organization_id);
create index emails_external_message_id_idx on public.emails (external_message_id);
create index emails_thread_id_idx on public.emails (thread_id);
create index emails_contact_id_idx on public.emails (contact_id);
create index emails_deal_id_idx on public.emails (deal_id);
create index emails_sent_at_idx on public.emails (sent_at desc);

-- ---------------------------- calendar_events ----------------------------
-- Synced calendar events from connected calendars
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  provider text,
  external_event_id text not null,

  title text not null,
  description text,
  location text,

  start_at timestamptz not null,
  end_at timestamptz not null,

  -- CRM record linkage
  meeting_id uuid references public.meetings(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_organization_id_idx on public.calendar_events (organization_id);
create index calendar_events_external_event_id_idx on public.calendar_events (external_event_id);
create index calendar_events_start_at_idx on public.calendar_events (start_at);

-- ---------------------------- whatsapp_messages ----------------------------
-- WhatsApp Business messages (via official provider API only)
create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  provider text default 'whatsapp',
  external_message_id text,

  -- phone number in E.164 format
  from_phone text not null,
  to_phone text not null,

  body text,

  -- inbound | outbound
  direction text not null check (direction in ('inbound', 'outbound')),

  -- sent | delivered | read | failed
  status text default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),

  -- CRM record linkage
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,

  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,

  created_at timestamptz not null default now()
);

create index whatsapp_messages_organization_id_idx on public.whatsapp_messages (organization_id);
create index whatsapp_messages_external_message_id_idx on public.whatsapp_messages (external_message_id);
create index whatsapp_messages_contact_id_idx on public.whatsapp_messages (contact_id);

-- ============================================================
-- RLS policies
-- ============================================================
alter table public.connected_accounts enable row level security;
create policy connected_accounts_select_org on public.connected_accounts
  for select using (public.is_organization_member(organization_id));
create policy connected_accounts_insert_org on public.connected_accounts
  for insert with check (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy connected_accounts_update_org on public.connected_accounts
  for update using (user_id = auth.uid() and public.is_organization_member(organization_id))
  with check (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy connected_accounts_delete_org on public.connected_accounts
  for delete using (user_id = auth.uid() and public.is_organization_member(organization_id));

alter table public.emails enable row level security;
create policy emails_select_org on public.emails
  for select using (public.is_organization_member(organization_id));
create policy emails_insert_org on public.emails
  for insert with check (public.is_organization_member(organization_id));
create policy emails_update_org on public.emails
  for update using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

alter table public.calendar_events enable row level security;
create policy calendar_events_select_org on public.calendar_events
  for select using (public.is_organization_member(organization_id));
create policy calendar_events_insert_org on public.calendar_events
  for insert with check (public.is_organization_member(organization_id));
create policy calendar_events_update_org on public.calendar_events
  for update using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

alter table public.whatsapp_messages enable row level security;
create policy whatsapp_messages_select_org on public.whatsapp_messages
  for select using (public.is_organization_member(organization_id));
create policy whatsapp_messages_insert_org on public.whatsapp_messages
  for insert with check (public.is_organization_member(organization_id));
create policy whatsapp_messages_update_org on public.whatsapp_messages
  for update using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));