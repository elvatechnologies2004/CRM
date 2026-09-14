-- ============================================================
-- Step 51 — Security helpers, onboarding, conversions, numbering
-- ============================================================

-- ------------------------------------------------------------------
-- is_organization_member(org_id uuid)
-- Returns true if auth.uid() has an ACTIVE membership in org.
-- SECURITY DEFINER so the check itself cannot be blocked by RLS on
-- organization_members (prevents recursive RLS problems).
-- ------------------------------------------------------------------
create or replace function public.is_organization_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- ------------------------------------------------------------------
-- current_organization_id()
-- First active membership of auth.uid(). Used by data layer defaults.
-- ------------------------------------------------------------------
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.organization_id
  from public.organization_members m
  where m.user_id = auth.uid()
    and m.status = 'active'
  order by m.joined_at asc
  limit 1;
$$;

-- ------------------------------------------------------------------
-- has_permission(p_permission text, p_org_id uuid)
-- True if auth.uid() has an active membership in p_org_id whose role
-- grants p_permission. SECURITY DEFINER (postgres-owner) bypasses RLS.
-- Used inside RLS policies AND by the application data layer.
-- ------------------------------------------------------------------
create or replace function public.has_permission(p_permission text, p_org_id uuid)
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
    join public.role_permissions rp on rp.role_id = r.id and rp.organization_id = p_org_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.key = p_permission
  );
$$;

-- ------------------------------------------------------------------
-- create_workspace(p_org_name, p_first_name, p_last_name, p_email)
-- Idempotent, transactional onboarding (Step 44 / 49):
--   1. organization    2. profile    3. membership
--   4. Admin role + all permissions    5. default pipeline + stages
-- SECURITY DEFINER so a fresh auth user can provision their workspace.
-- ------------------------------------------------------------------
create or replace function public.create_workspace(
  p_org_name    text,
  p_first_name  text,
  p_last_name   text,
  p_email       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid := auth.uid();
  v_org_id      uuid;
  v_admin_role  uuid;
  v_slug        text;
  v_pipeline    uuid;
  v_stages      text[] := array['New','Discovery','Qualified','Proposal','Negotiation','Won','Lost'];
  v_probs       int[]  := array[10,25,50,70,85,100,0];
  v_types       text[] := array['open','open','open','open','open','won','lost'];
  v_colors      text[] := array['#94a3b8','#6366f1','#22c55e','#f59e0b','#3b82f6','#10b981','#ef4444'];
  v_idx         int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Idempotent: never half-create a workspace.
  select organization_id into v_org_id
  from public.organization_members
  where user_id = v_user_id and status = 'active'
  order by joined_at asc
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  v_slug := lower(regexp_replace(coalesce(nullif(p_org_name,''), 'workspace'), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(v_slug, 40);

  insert into public.organizations (name, slug, created_by)
  values (coalesce(nullif(p_org_name,''), 'My Workspace'), v_slug, v_user_id)
  returning id into v_org_id;

  insert into public.profiles (id, organization_id, first_name, last_name, full_name, email, status)
  values (
    v_user_id,
    v_org_id,
    nullif(p_first_name,''),
    nullif(p_last_name,''),
    nullif(trim(coalesce(p_first_name,'') || ' ' || coalesce(p_last_name,'')), ''),
    p_email,
    'active'
  );

  insert into public.roles (organization_id, name, description, is_system)
  values (v_org_id, 'Admin', 'Full access to the organization', true)
  returning id into v_admin_role;

  insert into public.role_permissions (organization_id, role_id, permission_id)
  select v_org_id, v_admin_role, id from public.permissions;

  insert into public.organization_members (organization_id, user_id, role_id, status)
  values (v_org_id, v_user_id, v_admin_role, 'active');

  insert into public.pipelines (organization_id, name, description, is_default)
  values (v_org_id, 'Main Sales Pipeline', 'Default sales pipeline', true)
  returning id into v_pipeline;

  for v_idx in 1..array_length(v_stages, 1) loop
    insert into public.pipeline_stages
      (organization_id, pipeline_id, name, position, default_probability, color, stage_type)
    values
      (v_org_id, v_pipeline, v_stages[v_idx], v_idx - 1, v_probs[v_idx], v_colors[v_idx], v_types[v_idx]);
  end loop;

  return v_org_id;
end;
$$;

-- ------------------------------------------------------------------
-- next_document_number(p_org_id, p_kind)
-- Atomically increments a per-org sequence and formats a number.
-- Prevents QUO-/INV-/SUP- collisions under concurrency.
-- ------------------------------------------------------------------
create or replace function public.next_document_number(p_org_id uuid, p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last  integer;
  v_prefix text := case p_kind when 'quote' then 'QUO-' when 'invoice' then 'INV-' when 'ticket' then 'SUP-' else p_kind || '-' end;
begin
  insert into public.document_sequences (organization_id, kind, last_value)
  values (p_org_id, p_kind, 1)
  on conflict (organization_id, kind)
  do update set last_value = public.document_sequences.last_value + 1
  returning public.document_sequences.last_value into v_last;

  if v_last is null then
    select last_value into v_last from public.document_sequences
    where organization_id = p_org_id and kind = p_kind;
  end if;

  return v_prefix || lpad(v_last::text, 6, '0');
end;
$$;

-- BEFORE INSERT triggers assign numbers automatically when omitted.
create or replace function public.set_quote_number()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.quote_number is null then
    new.quote_number := public.next_document_number(new.organization_id, 'quote');
  end if;
  return new;
end;
$$;

create or replace function public.set_invoice_number()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.invoice_number is null then
    new.invoice_number := public.next_document_number(new.organization_id, 'invoice');
  end if;
  return new;
end;
$$;

create or replace function public.set_ticket_number()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.ticket_number is null then
    new.ticket_number := public.next_document_number(new.organization_id, 'ticket');
  end if;
  return new;
end;
$$;

create trigger quotes_set_number before insert on public.quotes
  for each row execute function public.set_quote_number();
create trigger invoices_set_number before insert on public.invoices
  for each row execute function public.set_invoice_number();
create trigger support_tickets_set_number before insert on public.support_tickets
  for each row execute function public.set_ticket_number();

-- ------------------------------------------------------------------
-- convert_lead(p_lead_id uuid, p_pipeline_id uuid default null)
-- Transactional lead -> Contact + Company + Deal conversion (Steps 52/57).
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
     'Lead converted to a deal', now()),
    (v_org_id, 'deal_created', 'deal', v_deal_id, v_user_id, v_contact_id, v_company_id, v_deal_id, p_lead_id,
     'Deal created from lead', now());

  return v_deal_id;
end;
$$;

-- ------------------------------------------------------------------
-- move_deal_stage(p_deal_id, p_stage_id, p_apply_probability bool)
-- Atomic stage move + probability + won/lost bookkeeping + activity.
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
  v_user_id  uuid := auth.uid();
begin
  if v_org_id is null then raise exception 'No active organization'; end if;
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_stage from public.pipeline_stages where id = p_stage_id;
  if v_stage is null or v_stage.organization_id <> v_org_id then
    raise exception 'Stage not found in workspace';
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