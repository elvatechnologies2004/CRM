-- ============================================================
-- Step 52 — Notification preferences
-- ============================================================

-- ---------------------------- notification_preferences ----------------------------
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  in_app boolean not null default true,
  email boolean not null default false,
  push boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_preferences_organization_id_idx on public.notification_preferences (organization_id);
create index notification_preferences_user_id_idx on public.notification_preferences (user_id);
create index notification_preferences_event_type_idx on public.notification_preferences (event_type);

-- Enable RLS
alter table public.notification_preferences enable row level security;

-- Policies: users can CRUD their own preferences
create policy notification_preferences_select_own on public.notification_preferences
  for select using (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy notification_preferences_insert_own on public.notification_preferences
  for insert with check (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy notification_preferences_update_own on public.notification_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_delete_own on public.notification_preferences
  for delete using (user_id = auth.uid());