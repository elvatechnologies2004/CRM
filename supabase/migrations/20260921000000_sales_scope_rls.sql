-- ============================================================
-- FinloNexa CRM — Phase 2: Role-based Sales Data Visibility (RLS)
--
-- Enforces the sales data scope at the database tier so Leads and
-- Opportunities are only readable/writable by users who are supposed
-- to see them, independent of the application data layer:
--
--   Admin / Head of Sales  → org-wide (every owner, incl. unassigned)
--   RSM                    → own + active members in the same sales
--                            region + members reporting directly to them
--   BDO / other sellers    → their own records only
--
-- Rules:
--   * A user only ever sees data inside their active organization
--     (cross-org access is still impossible).
--   * Unassigned records (owner_id IS NULL) are visible only to
--     org-wide roles, or to the user who created them (created_by).
--   * Member SELECT/UPDATE policies on leads/deals are REPLACED by
--     scoped equivalents (Postgres ORs policies together, so the old
--     org-wide member policies are dropped first).
--   * SECURITY DEFINER helpers resolve the caller's role/team server-side;
--     nothing is trusted from the client.
--   * convert_lead / move_deal_stage are recreated with internal scope
--     checks (they are SECURITY DEFINER and bypass RLS).
--
-- Additive + idempotent. No DROP TABLE, no data reset, no destructive
-- change. Phase-1 migrations are untouched.
-- ============================================================

-- ------------------------------------------------------------------
-- Helper: sales_role_is_org_wide(p_org_id uuid)
-- True when the caller holds an org-wide sales role (Admin / Owner /
-- Head of Sales) in the organization. SECURITY DEFINER so it can read
-- roles/memberships without being blocked by their RLS policies.
-- ------------------------------------------------------------------
create or replace function public.sales_role_is_org_wide(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.roles r on r.id = m.role_id and r.organization_id = p_org_id
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and lower(r.name) in ('admin', 'owner', 'head of sales')
  );
$$;

-- ------------------------------------------------------------------
-- Helper: sales_role_is_rsm(p_org_id uuid)
-- True when the caller's active role in the organization is an RSM.
-- ------------------------------------------------------------------
create or replace function public.sales_role_is_rsm(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.roles r on r.id = m.role_id and r.organization_id = p_org_id
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and lower(r.name) like '%rsm%'
  );
$$;

-- ------------------------------------------------------------------
-- Helper: sales_can_see_owner(p_org_id uuid, p_owner_id uuid)
-- True when the caller may see records owned by p_owner_id:
--   * the caller themselves, or
--   * (RSM only) any active member in the caller's sales region or
--     reporting directly to the caller.
-- ------------------------------------------------------------------
create or replace function public.sales_can_see_owner(p_org_id uuid, p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_owner_id = auth.uid()
    or (
      public.sales_role_is_rsm(p_org_id)
      and exists (
        select 1
        from public.organization_members caller_m
        join public.organization_members target_m
          on target_m.organization_id = caller_m.organization_id
         and target_m.status = 'active'
        where caller_m.organization_id = p_org_id
          and caller_m.user_id = auth.uid()
          and caller_m.status = 'active'
          and target_m.user_id = p_owner_id
          and (
            (caller_m.sales_region_id is not null and target_m.sales_region_id = caller_m.sales_region_id)
            or target_m.reports_to_user_id = caller_m.user_id
          )
      )
    );
$$;

-- ------------------------------------------------------------------
-- Helper: can_see_sales_record(p_org_id uuid, p_owner_id uuid,
--                              p_created_by uuid default null)
-- Core Phase-2 visibility predicate used by the leads/deals policies
-- AND by the security definer RPCs (convert_lead / move_deal_stage).
--   * org-wide roles → always true
--   * owner assigned  → sales_can_see_owner
--   * unassigned      → only the creator may see it
-- ------------------------------------------------------------------
create or replace function public.can_see_sales_record(
  p_org_id uuid,
  p_owner_id uuid,
  p_created_by uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_organization_member(p_org_id)
    and case
      when public.sales_role_is_org_wide(p_org_id) then true
      when p_owner_id is not null then public.sales_can_see_owner(p_org_id, p_owner_id)
      else p_created_by is not null and p_created_by = auth.uid()
    end;
$$;

-- ------------------------------------------------------------------
-- Leads — replace org-wide member SELECT/UPDATE with scoped policies.
-- INSERT (member) and DELETE (permission) policies are kept unchanged.
-- Notably, WITH CHECK remains org-membership-only so legitimate owner
-- reassignment keeps working while only in-scope rows can be touched.
-- ------------------------------------------------------------------
drop policy if exists leads_select_member on public.leads;
create policy leads_select_member on public.leads
  for select using (
    public.is_organization_member(organization_id)
    and public.can_see_sales_record(organization_id, owner_id, created_by)
  );

drop policy if exists leads_update_member on public.leads;
create policy leads_update_member on public.leads
  for update using (
    public.is_organization_member(organization_id)
    and public.can_see_sales_record(organization_id, owner_id, created_by)
  ) with check (
    public.is_organization_member(organization_id)
  );

-- ------------------------------------------------------------------
-- Deals — same treatment.
-- ------------------------------------------------------------------
drop policy if exists deals_select_member on public.deals;
create policy deals_select_member on public.deals
  for select using (
    public.is_organization_member(organization_id)
    and public.can_see_sales_record(organization_id, owner_id, created_by)
  );

drop policy if exists deals_update_member on public.deals;
create policy deals_update_member on public.deals
  for update using (
    public.is_organization_member(organization_id)
    and public.can_see_sales_record(organization_id, owner_id, created_by)
  ) with check (
    public.is_organization_member(organization_id)
  );

-- ------------------------------------------------------------------
-- crm_dashboard_summary — the org-wide KPI read-model must only be
-- readable by org-wide roles. BDO/RSM get live owner-scoped aggregates
-- from the application layer instead of this table.
-- ------------------------------------------------------------------
drop policy if exists dashboard_summary_select_member on public.crm_dashboard_summary;
create policy dashboard_summary_select_org_wide on public.crm_dashboard_summary
  for select using (
    public.is_organization_member(organization_id)
    and public.sales_role_is_org_wide(organization_id)
  );

-- ------------------------------------------------------------------
-- convert_lead — recreated with an internal scope check. The function
-- is SECURITY DEFINER (bypasses RLS) so the caller's visibility must be
-- validated explicitly before the lead may be converted.
-- ------------------------------------------------------------------
create or replace function public.convert_lead(p_lead_id uuid, p_pipeline_id uuid default null)
returns uuid -- the created deal id
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id     uuid;
  v_lead       public.leads%rowtype;
  v_company_id uuid;
  v_contact_id uuid;
  v_pipeline   uuid;
  v_stage_id   uuid;
  v_deal_id    uuid;
  v_deal_name  text;
  v_user_id    uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_org_id := public.current_organization_id();
  if v_org_id is null then
    raise exception 'No active organization';
  end if;

  select * into v_lead from public.leads where id = p_lead_id;
  if v_lead is null or v_lead.organization_id <> v_org_id then
    raise exception 'Lead not found in workspace';
  end if;

  -- Phase 2 — scope gate: only leads inside the caller's sales scope
  -- may be converted.
  if not public.can_see_sales_record(v_org_id, v_lead.owner_id, v_lead.created_by) then
    raise exception 'Lead not found in workspace';
  end if;

  -- Idempotent
  if v_lead.converted_deal_id is not null then
    return v_lead.converted_deal_id;
  end if;

  -- Find existing company by exact name or create one.
  select id into v_company_id
  from public.companies
  where organization_id = v_org_id and lower(coalesce(name,'')) = lower(coalesce(v_lead.company_name,''))
  limit 1;

  if v_company_id is null and coalesce(v_lead.company_name,'') <> '' then
    insert into public.companies
      (organization_id, name, domain, email, phone, country, city, source, description, created_by)
    values
      (v_org_id, v_lead.company_name,
       lower(regexp_replace(coalesce(v_lead.company_name,''), '[^a-z0-9]+', '', 'g')),
       v_lead.email, v_lead.phone, v_lead.country, v_lead.city, v_lead.source, nullif(v_lead.description,''), v_user_id)
    returning id into v_company_id;
  end if;

  -- Create contact
  insert into public.contacts
    (organization_id, first_name, last_name, full_name, email, phone, whatsapp,
     company_id, job_title, owner_id, source, country, city, lifecycle_stage, created_by)
  values
    (v_org_id, v_lead.first_name, v_lead.last_name, v_lead.full_name, v_lead.email, v_lead.phone, v_lead.whatsapp,
     v_company_id, v_lead.job_title, v_lead.owner_id, v_lead.source, v_lead.country, v_lead.city, 'Opportunity', v_user_id)
  returning id into v_contact_id;

  -- Resolve pipeline/stage
  v_pipeline := coalesce(p_pipeline_id,
    (select id from public.pipelines where organization_id = v_org_id and is_default limit 1));
  select id into v_stage_id
  from public.pipeline_stages
  where pipeline_id = v_pipeline and stage_type = 'open'
  order by position asc
  limit 1;

  v_deal_name := coalesce(NULLIF(trim(coalesce(v_lead.full_name,'') || ' — ' || coalesce(v_lead.company_name,'')),' — '), 'New Deal');

  insert into public.deals
    (organization_id, name, company_id, primary_contact_id, pipeline_id, stage_id,
     value, currency, expected_revenue, probability, owner_id, source, created_by, last_activity_at)
  values
    (v_org_id, v_deal_name, v_company_id, v_contact_id, v_pipeline, v_stage_id,
     coalesce(v_lead.expected_value, 0), coalesce(v_lead.currency,'USD'), coalesce(v_lead.expected_value, 0),
     (select coalesce(default_probability, 0) from public.pipeline_stages where id = v_stage_id),
     v_lead.owner_id, v_lead.source, v_user_id, now())
  returning id into v_deal_id;

  if v_company_id is not null then
    insert into public.deal_contacts (organization_id, deal_id, contact_id, relationship_role, is_primary)
    values (v_org_id, v_deal_id, v_contact_id, 'Decision Maker', true);
    update public.companies set last_activity_at = now() where id = v_company_id;
  else
    insert into public.deal_contacts (organization_id, deal_id, contact_id, relationship_role, is_primary)
    values (v_org_id, v_deal_id, v_contact_id, 'Decision Maker', true);
  end if;

  -- Update lead as converted
  update public.leads
  set converted_contact_id = v_contact_id,
      converted_company_id = v_company_id,
      converted_deal_id = v_deal_id,
      converted_at = now(),
      status = 'Qualified',
      last_activity_at = now()
  where id = p_lead_id;

  -- Activities
  insert into public.activities (organization_id, activity_type, related_type, related_id, actor_user_id,
    contact_id, company_id, deal_id, lead_id, title, occurred_at)
  values
    (v_org_id, 'lead_converted', 'lead', p_lead_id, v_user_id, v_contact_id, v_company_id, v_deal_id, p_lead_id,
     'Lead converted to Opportunity', now()),
    (v_org_id, 'deal_created', 'deal', v_deal_id, v_user_id, v_contact_id, v_company_id, v_deal_id, p_lead_id,
     'Opportunity created from Lead', now());

  return v_deal_id;
end;
$$;

-- ------------------------------------------------------------------
-- move_deal_stage — recreated with an internal scope check so a scoped
-- seller cannot stage-move a deal outside their visibility.
-- ------------------------------------------------------------------
create or replace function public.move_deal_stage(
  p_deal_id uuid,
  p_stage_id uuid,
  p_apply_probability boolean default true
)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id   uuid := public.current_organization_id();
  v_stage    public.pipeline_stages%rowtype;
  v_deal     public.deals;
  v_owner    uuid;
  v_created  uuid;
  v_user_id  uuid := auth.uid();
begin
  if v_org_id is null then raise exception 'No active organization'; end if;
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_stage from public.pipeline_stages where id = p_stage_id;
  if v_stage is null or v_stage.organization_id <> v_org_id then
    raise exception 'Stage not found in workspace';
  end if;

  -- Phase 2 — scope gate: only deals inside the caller's sales scope
  -- may be stage-moved (resolve ownership first).
  select owner_id, created_by into v_owner, v_created
  from public.deals
  where id = p_deal_id and organization_id = v_org_id;
  if not public.can_see_sales_record(v_org_id, v_owner, v_created) then
    raise exception 'Deal not found in workspace';
  end if;

  update public.deals
  set stage_id = p_stage_id,
      probability = case when p_apply_probability then v_stage.default_probability else probability end,
      expected_revenue = round(value * probability / 100 * 100) / 100.0,
      won_at = case when v_stage.stage_type = 'won' then now() else null end,
      lost_at = case when v_stage.stage_type = 'lost' then now() else null end,
      health_status = case when v_stage.stage_type = 'won' then 'Healthy'
                           when v_stage.stage_type = 'lost' then 'At Risk' else health_status end,
      last_activity_at = now(),
      updated_at = now()
  where id = p_deal_id and organization_id = v_org_id
  returning * into v_deal;

  if v_deal.id is null then
    raise exception 'Deal not found in workspace';
  end if;

  insert into public.activities (organization_id, activity_type, related_type, related_id, actor_user_id,
    deal_id, title, metadata, occurred_at)
  values (v_org_id, 'deal_stage_changed', 'deal', v_deal.id, v_user_id, v_deal.id,
    'Deal moved to ' || v_stage.name,
    jsonb_build_object('from_stage', null, 'to_stage', v_stage.name), now());

  -- Win / loss reasons get set by the data layer with user input.
  return v_deal;
end;
$$;

-- ------------------------------------------------------------------
-- Supporting indexes for the scoped lookups (idempotent).
-- leads_owner_id_idx and deals_owner_id_idx already exist from
-- 20260913000003_core_crm.sql; quotes has none yet.
-- ------------------------------------------------------------------
create index if not exists leads_owner_id_idx on public.leads (owner_id);
create index if not exists deals_owner_id_idx on public.deals (owner_id);
create index if not exists quotes_created_by_idx on public.quotes (created_by);