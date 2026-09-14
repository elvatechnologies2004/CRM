-- ============================================================
-- Phase A — Steps 124–125
-- Advanced approval engine and advanced workflow engine.
-- ============================================================

-- ============================================================
-- STEP 124 — ADVANCED APPROVAL ENGINE
--
-- Approval policies define WHEN an approval is required and how.
-- Approval requests materialize steps for each approver.
-- Approval actions log every decision (audit trail).
-- ============================================================

create table public.approval_policies (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  name                text not null,
  description         text,
  subject             text not null default 'generic' check (subject in (
    'deal','lead','quote','invoice','refund','contract','ai_action','record_delete','generic'
  )),
  criteria            jsonb not null default '{}'::jsonb,
  approval_type       text not null default 'single' check (approval_type in (
    'single','multiple','sequential','any_one','all_required'
  )),
  required_approvers  integer not null default 1,
  approver_config     jsonb not null default '{}'::jsonb,
  timeout_hours       integer not null default 48,
  is_active           boolean not null default true,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.approval_requests (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  policy_id           uuid references public.approval_policies(id) on delete set null,
  subject             text not null default 'generic',
  subject_id          uuid,
  subject_summary     text,
  payload             jsonb not null default '{}'::jsonb,
  requested_by        uuid not null,
  status              text not null default 'pending' check (status in (
    'pending','approved','rejected','cancelled','expired'
  )),
  current_step        integer not null default 1,
  priority            integer not null default 50 check (priority between 1 and 100),
  expires_at          timestamptz,
  decided_by          uuid,
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.approval_steps (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  request_id          uuid not null references public.approval_requests(id) on delete cascade,
  step_number         integer not null,
  approver_type       text not null default 'user' check (approver_type in ('user','role')),
  approver_user_id    uuid,
  approver_role_key   text,
  status              text not null default 'waiting' check (status in (
    'waiting','pending','approved','rejected','skipped'
  )),
  decided_by          uuid,
  decided_at          timestamptz,
  comment             text,
  created_at          timestamptz not null default now(),
  unique (request_id, step_number, approver_user_id, approver_role_key)
);

create table public.approval_actions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  request_id          uuid not null references public.approval_requests(id) on delete cascade,
  user_id             uuid not null,
  action              text not null check (action in ('requested','approved','rejected','cancelled','expired','commented')),
  comment             text,
  created_at          timestamptz not null default now()
);

create index approval_policies_org_idx on public.approval_policies (organization_id);
create index approval_policies_active_idx on public.approval_policies (organization_id, is_active);
create index approval_requests_org_idx on public.approval_requests (organization_id);
create index approval_requests_status_idx on public.approval_requests (organization_id, status);
create index approval_requests_subject_idx on public.approval_requests (subject, subject_id);
create index approval_steps_request_idx on public.approval_steps (request_id);
create index approval_steps_approver_idx on public.approval_steps (approver_user_id, status);
create index approval_actions_request_idx on public.approval_actions (request_id);

-- RLS — approvals:
-- read for members; any member may create a request; updates are
-- limited to the approval.manage permission OR a user who is an
-- assigned approver on a step of the request.
alter table public.approval_policies enable row level security;
create policy approval_policies_select_member on public.approval_policies
  for select using (public.is_organization_member(organization_id));
create policy approval_policies_insert_manage on public.approval_policies
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('approval.manage', organization_id));
create policy approval_policies_update_manage on public.approval_policies
  for update using (public.is_organization_member(organization_id) and public.has_permission('approval.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('approval.manage', organization_id));
create policy approval_policies_delete_manage on public.approval_policies
  for delete using (public.is_organization_member(organization_id) and public.has_permission('approval.manage', organization_id));

alter table public.approval_requests enable row level security;
create policy approval_requests_select_member on public.approval_requests
  for select using (public.is_organization_member(organization_id));
create policy approval_requests_insert_member on public.approval_requests
  for insert with check (public.is_organization_member(organization_id));
create policy approval_requests_update_approver on public.approval_requests
  for update using (
    public.is_organization_member(organization_id)
    and (
      public.has_permission('approval.manage', organization_id)
      or exists (
        select 1 from public.approval_steps s
        where s.request_id = id and s.organization_id = organization_id
          and s.approver_user_id = auth.uid()
          and s.status in ('pending','waiting')
      )
    )
  );
create policy approval_requests_delete_manage on public.approval_requests
  for delete using (public.is_organization_member(organization_id) and public.has_permission('approval.manage', organization_id));

alter table public.approval_steps enable row level security;
create policy approval_steps_select_member on public.approval_steps
  for select using (public.is_organization_member(organization_id));
create policy approval_steps_insert_manage on public.approval_steps
  for insert with check (
    public.is_organization_member(organization_id)
    and (public.has_permission('approval.manage', organization_id) or exists (
      select 1 from public.approval_requests r where r.id = request_id and r.requested_by = auth.uid()
    ))
  );
create policy approval_steps_update_approver on public.approval_steps
  for update using (
    public.is_organization_member(organization_id)
    and (public.has_permission('approval.manage', organization_id) or approver_user_id = auth.uid())
  );

alter table public.approval_actions enable row level security;
create policy approval_actions_select_member on public.approval_actions
  for select using (public.is_organization_member(organization_id));
create policy approval_actions_insert_member on public.approval_actions
  for insert with check (public.is_organization_member(organization_id));

-- ============================================================
-- STEP 125 — ADVANCED WORKFLOW ENGINE
-- Runs over a node-graph definition stored on the rule row.
-- Jobs schedule delayed / wait-until / resumed nodes.
-- ============================================================

create table public.workflows (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  description       text,
  trigger_type      text not null,
  definition        jsonb not null default '{}'::jsonb,
  status            text not null default 'draft' check (status in ('draft','active','paused','archived')),
  allow_loops       boolean not null default false,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.workflow_runs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  workflow_id       uuid not null references public.workflows(id) on delete cascade,
  trigger_event     text,
  subject_type      text,
  subject_id        uuid,
  status            text not null default 'running' check (status in (
    'running','waiting','awaiting_approval','success','partial','failed','cancelled'
  )),
  node_path         jsonb not null default '[]'::jsonb,
  payload           jsonb not null default '{}'::jsonb,
  error_message     text,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create table public.workflow_run_steps (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  run_id            uuid not null references public.workflow_runs(id) on delete cascade,
  node_id           text not null,
  node_type         text not null,
  status            text not null default 'pending' check (status in (
    'pending','running','waiting','completed','failed','skipped'
  )),
  input_payload     jsonb not null default '{}'::jsonb,
  output_payload    jsonb,
  error_message     text,
  created_at        timestamptz not null default now()
);

create table public.workflow_jobs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  workflow_id       uuid not null references public.workflows(id) on delete cascade,
  run_id            uuid not null references public.workflow_runs(id) on delete cascade,
  node_id           text not null,
  execute_at        timestamptz not null default now(),
  status            text not null default 'pending' check (status in (
    'pending','processing','completed','failed','cancelled'
  )),
  attempt_count     integer not null default 0,
  max_attempts      integer not null default 3,
  last_error        text,
  payload           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- One active run per (workflow, subject) prevents duplicates / loops.
create unique index workflow_runs_active_unique on public.workflow_runs
  (workflow_id, subject_type, subject_id)
  where status in ('running','waiting','awaiting_approval','partial');

create index workflows_org_idx on public.workflows (organization_id);
create index workflows_trigger_idx on public.workflows (trigger_type, status);
create index workflow_runs_org_idx on public.workflow_runs (organization_id);
create index workflow_runs_workflow_idx on public.workflow_runs (workflow_id, status);
create index workflow_run_steps_run_idx on public.workflow_run_steps (run_id);
create index workflow_run_steps_node_idx on public.workflow_run_steps (node_id);
create index workflow_jobs_due_idx on public.workflow_jobs (status, execute_at);
create index workflow_jobs_org_idx on public.workflow_jobs (organization_id);

-- Link an approval request back to a waiting workflow run so the
-- engine can resume the run when a decision is made.
alter table public.approval_requests add column if not exists workflow_run_id uuid;
alter table public.approval_requests add column if not exists workflow_node_id text;
alter table public.approval_requests
  add constraint approval_requests_workflow_run_fkey foreign key (workflow_run_id) references public.workflow_runs(id) on delete set null;

-- RLS — workflows: read for members, write for workflow.manage.
-- Runtime tables (runs/steps/jobs) are read for members; the engine
-- writes them through the caller's RLS-enforced client.
alter table public.workflows enable row level security;
create policy workflows_select_member on public.workflows
  for select using (public.is_organization_member(organization_id));
create policy workflows_insert_manage on public.workflows
  for insert with check (public.is_organization_member(organization_id) and public.has_permission('workflow.manage', organization_id));
create policy workflows_update_manage on public.workflows
  for update using (public.is_organization_member(organization_id) and public.has_permission('workflow.manage', organization_id))
  with check (public.is_organization_member(organization_id) and public.has_permission('workflow.manage', organization_id));
create policy workflows_delete_manage on public.workflows
  for delete using (public.is_organization_member(organization_id) and public.has_permission('workflow.manage', organization_id));

alter table public.workflow_runs enable row level security;
create policy workflow_runs_select_member on public.workflow_runs
  for select using (public.is_organization_member(organization_id));
create policy workflow_runs_insert_member on public.workflow_runs
  for insert with check (public.is_organization_member(organization_id));
create policy workflow_runs_update_member on public.workflow_runs
  for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));

alter table public.workflow_run_steps enable row level security;
create policy workflow_run_steps_select_member on public.workflow_run_steps
  for select using (public.is_organization_member(organization_id));
create policy workflow_run_steps_insert_member on public.workflow_run_steps
  for insert with check (public.is_organization_member(organization_id));
create policy workflow_run_steps_update_member on public.workflow_run_steps
  for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));

alter table public.workflow_jobs enable row level security;
create policy workflow_jobs_select_member on public.workflow_jobs
  for select using (public.is_organization_member(organization_id));
create policy workflow_jobs_insert_member on public.workflow_jobs
  for insert with check (public.is_organization_member(organization_id));
create policy workflow_jobs_update_member on public.workflow_jobs
  for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));