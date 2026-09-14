-- ============================================================
-- Step 52 — Automation Engine (tables)
-- ============================================================

-- ---------------------------- automations ---------------------------
create table public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  name text not null,
  description text,

  status text not null check (status in ('draft', 'active', 'paused', 'archived')),

  trigger_type text not null,

  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  last_run_at timestamptz,
  run_count bigint default 0
);

create index automations_organization_id_idx on public.automations (organization_id);
create index automations_status_idx on public.automations (status);
create index automations_trigger_type_idx on public.automations (trigger_type);

-- ---------------------------- automation_triggers ---------------------------
-- Stores individual trigger configurations per automation (for complex multi-trigger setups)
create table public.automation_triggers (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,

  trigger_type text not null,

  -- Generic event payload stored as JSON for flexibility
  event_config jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index automation_triggers_automation_id_idx on public.automation_triggers (automation_id);
create index automation_triggers_trigger_type_idx on public.automation_triggers (trigger_type);

-- ---------------------------- automation_conditions ---------------------------
create table public.automation_conditions (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,

  field text not null,
  operator text not null check (operator in ('=', '!=', '>', '<', '>=', '<=', 'contains', 'not contains')),

  value jsonb default '{}'::jsonb,

  logic string default 'and' check (logic in ('and', 'or')),

  created_at timestamptz not null default now()
);

create index automation_conditions_automation_id_idx on public.automation_conditions (automation_id);
create index automation_conditions_field_idx on public.automation_conditions (field, operator);

-- ---------------------------- automation_actions ---------------------------
create table public.automation_actions (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,

  action_type text not null check (action_type in (
    'create_task',
    'assign_owner',
    'change_status',
    'move_deal_stage',
    'add_tag',
    'remove_tag',
    'create_notification',
    'create_activity',
    'update_field'
  )),

  config jsonb not null default '{}'::jsonb,

  -- For reference only; actual record looked up at runtime
  target_type text not null default 'record',

  created_at timestamptz not null default now()
);

create index automation_actions_automation_id_idx on public.automation_actions (automation_id);
create index automation_actions_type_idx on public.automation_actions (action_type);

-- ---------------------------- automation_runs ---------------------------
create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  automation_id uuid not null references public.automations(id) on delete cascade,

  trigger_event text,
  trigger_record_type text not null,
  trigger_record_id uuid not null,

  status text not null check (status in ('running', 'success', 'partial', 'failed', 'skipped')),

  started_at timestamptz not null default now(),
  completed_at timestamptz,

  error_message text,

  run_id_text text generated always as (
    case
      when trigger_record_type = 'lead' then 'lead_' || trigger_record_id
      when trigger_record_type = 'deal' then 'deal_' || trigger_record_id
      when trigger_record_type = 'contact' then 'contact_' || trigger_record_id
      when trigger_record_type = 'task' then 'task_' || trigger_record_id
      when trigger_record_type = 'invoice' then 'invoice_' || trigger_record_id
      else 'event_' || trigger_record_type || '_' || trigger_record_id
    end
  ) stored,

  unique(automation_id, trigger_record_type, trigger_record_id, organization_id)
);

create index automation_runs_organization_id_idx on public.automation_runs (organization_id);
create index automation_runs_automation_id_idx on public.automation_runs (automation_id);
create index automation_runs_status_idx on public.automation_runs (status);
create index automation_runs_started_at_idx on public.automation_runs (started_at desc);

-- ---------------------------- automation_run_steps ---------------------------
create table public.automation_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.automation_runs(id) on delete cascade,

  action_type text not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed', 'skipped')),

  input_payload jsonb default '{}'::jsonb,
  output_payload jsonb,

  error_message text,

  created_at timestamptz not null default now()
);

create index automation_run_steps_run_id_idx on public.automation_run_steps (run_id);
create index automation_run_steps_status_idx on public.automation_run_steps (status);

-- ---------------------------- automation_jobs ---------------------------
-- Delayed / scheduled job queue for time-based actions (e.g., "wait 2 days then create task")
create table public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  automation_id uuid not null references public.automations(id) on delete cascade,

  run_id uuid references public.automation_runs(id) on delete set null,

  action_id uuid references public.automation_actions(id) on delete set null,

  execute_at timestamptz not null,

  status text not null check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  attempt_count integer default 0,
  max_attempts integer default 3,

  last_error text,

  payload jsonb default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index automation_jobs_organization_id_idx on public.automation_jobs (organization_id);
create index automation_jobs_execute_at_idx on public.automation_jobs (execute_at);
create index automation_jobs_status_idx on public.automation_jobs (status);