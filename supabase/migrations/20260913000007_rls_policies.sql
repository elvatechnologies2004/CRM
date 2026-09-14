-- ============================================================
-- Step 51 — Row Level Security policies (Steps 45–49)
--
-- Core rule: a user may only touch records in an organization
-- where they are an ACTIVE member. Writes that change a record's
-- organization must match the membership. Deletes require an
-- explicit permission. Audit logs and document_sequences are
-- append/system-only (no user policies).
-- ============================================================

-- Standard member-scoped pattern with optional permission-gated DELETE.
do $$
declare
  t text;
  d text;
begin
  -- Tables: SELECT / INSERT / UPDATE for all active members.
  foreach t in array array[
    'leads','contacts','companies','pipelines','pipeline_stages','deals',
    'deal_contacts','tasks','meetings','calls','products','deal_products',
    'quotes','quote_items','invoices','invoice_items','payments','projects',
    'support_tickets','subscriptions','attachments',
    'activities','notes','tags','record_tags'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %I on public.%I for select using (public.is_organization_member(organization_id));',
      t || '_select_member', t);
    execute format('create policy %I on public.%I for insert with check (public.is_organization_member(organization_id));',
      t || '_insert_member', t);
    execute format('create policy %I on public.%I for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));',
      t || '_update_member', t);
  end loop;

  -- Tables with an explicit DELETE permission.
  for t, d in
    select tt, pp from (values
      ('leads','lead.delete'),
      ('contacts','contact.delete'),
      ('companies','company.delete'),
      ('deals','deal.delete'),
      ('tasks','task.delete')
    ) as v(tt, pp)
  loop
    execute format('create policy %I on public.%I for delete using (public.is_organization_member(organization_id) and public.has_permission(%L, organization_id));',
      t || '_delete_permission', t, d);
  end loop;
end;
$$;

-- ---------------------------------------------------------------
-- profiles
-- User can read own profile and profiles of org members; update own.
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_organization_member(organization_id));

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------
-- organizations
-- Members can read/update their organization. No insert/delete policy:
-- workspaces are provisioned via create_workspace() (security definer).
-- ---------------------------------------------------------------
alter table public.organizations enable row level security;

create policy organizations_select_member on public.organizations
  for select using (public.is_organization_member(id) or created_by = auth.uid());

create policy organizations_update_member on public.organizations
  for update using (public.has_permission('settings.manage', id))
  with check (public.has_permission('settings.manage', id));

-- ---------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------
alter table public.organization_members enable row level security;

create policy members_select_member on public.organization_members
  for select using (public.is_organization_member(organization_id) or user_id = auth.uid());

create policy members_insert_admin on public.organization_members
  for insert with check (public.has_permission('users.manage', organization_id));

create policy members_update_admin on public.organization_members
  for update using (
    public.has_permission('users.manage', organization_id) or user_id = auth.uid()
  ) with check (
    public.has_permission('users.manage', organization_id) or (user_id = auth.uid() and status = 'deactivated')
  );

create policy members_delete_admin on public.organization_members
  for delete using (public.has_permission('users.manage', organization_id));

-- ---------------------------------------------------------------
-- roles / role_permissions / teams
-- ---------------------------------------------------------------
alter table public.roles enable row level security;
create policy roles_select_member on public.roles for select using (public.is_organization_member(organization_id));
create policy roles_insert_admin on public.roles for insert with check (public.has_permission('users.manage', organization_id));
create policy roles_update_admin on public.roles for update using (public.has_permission('users.manage', organization_id)) with check (public.has_permission('users.manage', organization_id));
create policy roles_delete_admin on public.roles for delete using (public.has_permission('users.manage', organization_id));

alter table public.role_permissions enable row level security;
create policy rp_select_member on public.role_permissions for select using (public.is_organization_member(organization_id));
create policy rp_insert_admin on public.role_permissions for insert with check (public.has_permission('users.manage', organization_id));
create policy rp_update_admin on public.role_permissions for update using (public.has_permission('users.manage', organization_id)) with check (public.has_permission('users.manage', organization_id));
create policy rp_delete_admin on public.role_permissions for delete using (public.has_permission('users.manage', organization_id));

alter table public.teams enable row level security;
create policy teams_select_member on public.teams for select using (public.is_organization_member(organization_id));
create policy teams_insert_member on public.teams for insert with check (public.is_organization_member(organization_id) and public.has_permission('teams.manage', organization_id));
create policy teams_update_member on public.teams for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy teams_delete_member on public.teams for delete using (public.has_permission('teams.manage', organization_id));

-- ---------------------------------------------------------------
-- permissions (global catalog — readable, not writable by humans)
-- ---------------------------------------------------------------
alter table public.permissions enable row level security;
create policy permissions_select_public on public.permissions for select using (true);

-- ---------------------------------------------------------------
-- organization_invites
-- ---------------------------------------------------------------
alter table public.organization_invites enable row level security;
create policy invites_select_member on public.organization_invites for select using (public.is_organization_member(organization_id));
create policy invites_insert_admin on public.organization_invites for insert with check (public.has_permission('users.manage', organization_id));
create policy invites_update_admin on public.organization_invites for update using (public.has_permission('users.manage', organization_id)) with check (public.has_permission('users.manage', organization_id));
create policy invites_delete_admin on public.organization_invites for delete using (public.has_permission('users.manage', organization_id));

-- ---------------------------------------------------------------
-- notifications (personal)
-- ---------------------------------------------------------------
alter table public.notifications enable row level security;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------
-- audit_logs (append-only; SELECT gated by audit.view)
-- ---------------------------------------------------------------
alter table public.audit_logs enable row level security;
create policy audit_select_viewer on public.audit_logs
  for select using (public.is_organization_member(organization_id) and public.has_permission('audit.view', organization_id));

-- ---------------------------------------------------------------
-- notification_preferences (Step 52)
-- ---------------------------------------------------------------
alter table public.notification_preferences enable row level security;
create policy notification_preferences_select_own on public.notification_preferences
  for select using (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy notification_preferences_insert_own on public.notification_preferences
  for insert with check (user_id = auth.uid() and public.is_organization_member(organization_id));
create policy notification_preferences_update_own on public.notification_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_delete_own on public.notification_preferences
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------
-- automation tables (Step 52)
-- ---------------------------------------------------------------
alter table public.automations enable row level security;
create policy automations_select_org on public.automations for select using (public.is_organization_member(organization_id));
create policy automations_insert_org on public.automations for insert with check (public.is_organization_member(organization_id) and (created_by = auth.uid() or public.has_permission('automation.manage', organization_id)));
create policy automations_update_org on public.automations for update using (public.is_organization_member(organization_id) and (created_by = auth.uid() or public.has_permission('automation.manage', organization_id))) with check (public.is_organization_member(organization_id) and (created_by = auth.uid() or public.has_permission('automation.manage', organization_id)));

alter table public.automation_triggers enable row level security;
create policy automation_triggers_select_org on public.automation_triggers for select using (public.is_organization_member(organization_id));
create policy automation_triggers_insert_org on public.automation_triggers for insert with check (public.is_organization_member(organization_id));

alter table public.automation_conditions enable row level security;
create policy automation_conditions_select_org on public.automation_conditions for select using (public.is_organization_member(organization_id));
create policy automation_conditions_insert_org on public.automation_conditions for insert with check (public.is_organization_member(organization_id));

alter table public.automation_actions enable row level security;
create policy automation_actions_select_org on public.automation_actions for select using (public.is_organization_member(organization_id));
create policy automation_actions_insert_org on public.automation_actions for insert with check (public.is_organization_member(organization_id));

alter table public.automation_runs enable row level security;
create policy automation_runs_select_org on public.automation_runs for select using (public.is_organization_member(organization_id));

alter table public.automation_run_steps enable row level security;
create policy automation_run_steps_select_org on public.automation_run_steps for select using (public.is_organization_member(organization_id));

alter table public.automation_jobs enable row level security;
create policy automation_jobs_select_org on public.automation_jobs for select using (public.is_organization_member(organization_id));
create policy automation_jobs_insert_org on public.automation_jobs for insert with check (public.is_organization_member(organization_id));

-- ---------------------------------------------------------------
-- ai tables
-- ---------------------------------------------------------------
alter table public.ai_agents enable row level security;
create policy agents_select_member on public.ai_agents for select using (public.is_organization_member(organization_id));
create policy agents_insert_admin on public.ai_agents for insert with check (public.is_organization_member(organization_id));
create policy agents_update_admin on public.ai_agents for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy agents_delete_admin on public.ai_agents for delete using (public.is_organization_member(organization_id));

alter table public.ai_agent_permissions enable row level security;
create policy aap_select_member on public.ai_agent_permissions for select using (public.is_organization_member(organization_id));
create policy aap_insert_member on public.ai_agent_permissions for insert with check (public.is_organization_member(organization_id));
create policy aap_update_member on public.ai_agent_permissions for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy aap_delete_member on public.ai_agent_permissions for delete using (public.is_organization_member(organization_id));

alter table public.ai_recommendations enable row level security;
create policy recs_select_member on public.ai_recommendations for select using (public.is_organization_member(organization_id));
create policy recs_insert_member on public.ai_recommendations for insert with check (public.is_organization_member(organization_id));
create policy recs_update_member on public.ai_recommendations for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy recs_delete_member on public.ai_recommendations for delete using (public.is_organization_member(organization_id));

alter table public.ai_approvals enable row level security;
create policy approvals_select_member on public.ai_approvals for select using (public.is_organization_member(organization_id));
create policy approvals_insert_member on public.ai_approvals for insert with check (public.is_organization_member(organization_id));
create policy approvals_update_member on public.ai_approvals for update using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy approvals_delete_member on public.ai_approvals for delete using (public.is_organization_member(organization_id));

-- ---------------------------------------------------------------
-- document_sequences (system-managed only — no user policies)
-- ---------------------------------------------------------------
alter table public.document_sequences enable row level security;