-- ============================================================
-- Step 51 — AI agent foundation tables & audit logs
-- ============================================================

-- -------------------------- ai_agents -------------------------
create table public.ai_agents (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  agent_type        text,
  purpose           text,
  status            text default 'Active' check (status in ('Active','Paused','Archived','Error')),
  approval_mode     text default 'Ask Before Action',
  permissions       jsonb default '[]'::jsonb,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_activity_at  timestamptz
);

create index ai_agents_organization_id_idx on public.ai_agents (organization_id);

-- ---------------------- ai_agent_permissions -------------------
create table public.ai_agent_permissions (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  agent_id                uuid not null references public.ai_agents(id) on delete cascade,
  permission              text not null,
  requires_human_approval boolean not null default true,
  unique (agent_id, permission)
);

create index ai_agent_permissions_org_idx on public.ai_agent_permissions (organization_id);

-- ----------------------- ai_recommendations --------------------
create table public.ai_recommendations (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  agent_id              uuid references public.ai_agents(id) on delete set null,
  record_type           text,
  record_id             uuid,
  recommendation_type   text,
  title                 text not null,
  summary               text,
  confidence            numeric check (confidence between 0 and 100),
  status                text default 'pending' check (status in ('pending','applied','dismissed','archived')),
  created_at            timestamptz not null default now(),
  reviewed_at           timestamptz
);

create index ai_recommendations_org_idx on public.ai_recommendations (organization_id);
create index ai_recommendations_status_idx on public.ai_recommendations (status);

-- -------------------------- ai_approvals -----------------------
create table public.ai_approvals (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  agent_id          uuid references public.ai_agents(id) on delete set null,
  action_type       text,
  record_type       text,
  record_id         uuid,
  proposed_payload  jsonb default '{}'::jsonb,
  reason_summary    text,
  risk_level        text default 'Medium' check (risk_level in ('Low','Medium','High')),
  status            text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_at      timestamptz not null default now(),
  reviewed_by       uuid,
  reviewed_at       timestamptz
);

create index ai_approvals_org_idx on public.ai_approvals (organization_id);
create index ai_approvals_status_idx on public.ai_approvals (status);

-- --------------------------- audit_logs ------------------------
-- Append-only by design: no UPDATE/DELETE policy below.
create table public.audit_logs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid,
  action            text not null,
  record_type       text,
  record_id         uuid,
  old_values        jsonb,
  new_values        jsonb,
  ip_address        text,
  created_at        timestamptz not null default now()
);

create index audit_logs_org_idx on public.audit_logs (organization_id);
create index audit_logs_record_idx on public.audit_logs (record_type, record_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- --------------------- audit write helper ----------------------
create or replace function public.write_audit_log(
  p_organization_id uuid,
  p_action text,
  p_record_type text,
  p_record_id uuid,
  p_old_values jsonb default null,
  p_new_values jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (organization_id, user_id, action, record_type, record_id, old_values, new_values)
  values (p_organization_id, auth.uid(), p_action, p_record_type, p_record_id, p_old_values, p_new_values);
end;
$$;

-- ----------------------- updated_at triggers ---------------------
create trigger ai_agents_set_updated_at before update on public.ai_agents
  for each row execute function public.set_updated_at();
create trigger document_sequences_set_updated_at before update on public.document_sequences
  for each row execute function public.set_updated_at();