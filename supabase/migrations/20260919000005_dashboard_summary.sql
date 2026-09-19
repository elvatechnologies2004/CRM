-- Dashboard aggregate read model. Leads and deals remain the source of truth.
create table public.crm_dashboard_summary (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  total_leads integer not null default 0,
  active_opportunities integer not null default 0,
  won_opportunities integer not null default 0,
  closed_won_this_month integer not null default 0,
  expected_revenue numeric not null default 0,
  pipeline_value numeric not null default 0,
  deals_by_stage jsonb not null default '{}'::jsonb,
  revenue_by_month jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index crm_dashboard_summary_updated_idx
  on public.crm_dashboard_summary (updated_at);

create index leads_dashboard_active_idx
  on public.leads (organization_id, archived_at);
create index deals_dashboard_state_idx
  on public.deals (organization_id, archived_at, won_at, lost_at);
create index tasks_dashboard_queue_idx
  on public.tasks (organization_id, status, due_at);
create index meetings_dashboard_today_idx
  on public.meetings (organization_id, status, start_at);

alter table public.crm_dashboard_summary enable row level security;
create policy dashboard_summary_select_member
  on public.crm_dashboard_summary for select
  using (public.is_organization_member(organization_id));

create or replace function public.refresh_crm_dashboard_summary(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org_id is null then
    return;
  end if;

  insert into public.crm_dashboard_summary (
    organization_id,
    total_leads,
    active_opportunities,
    won_opportunities,
    closed_won_this_month,
    expected_revenue,
    pipeline_value,
    deals_by_stage,
    revenue_by_month,
    updated_at
  )
  select
    p_org_id,
    (select count(*)::integer from public.leads l
      where l.organization_id = p_org_id and l.archived_at is null),
    (select count(*)::integer from public.deals d
      where d.organization_id = p_org_id and d.archived_at is null
        and d.won_at is null and d.lost_at is null),
    (select count(*)::integer from public.deals d
      where d.organization_id = p_org_id and d.archived_at is null and d.won_at is not null),
    (select count(*)::integer from public.deals d
      where d.organization_id = p_org_id and d.archived_at is null
        and d.won_at >= date_trunc('month', now())
        and d.won_at < date_trunc('month', now()) + interval '1 month'),
    coalesce((select sum(coalesce(d.value, 0) * coalesce(d.probability, 0) / 100.0)
      from public.deals d where d.organization_id = p_org_id and d.archived_at is null
        and d.won_at is null and d.lost_at is null), 0),
    coalesce((select sum(coalesce(d.value, 0))
      from public.deals d where d.organization_id = p_org_id and d.archived_at is null
        and d.won_at is null and d.lost_at is null), 0),
    coalesce((select jsonb_object_agg(coalesce(ps.name, 'Open'), stage_counts.count)
      from (
        select d.stage_id, count(*)::integer as count
        from public.deals d
        where d.organization_id = p_org_id and d.archived_at is null
          and d.won_at is null and d.lost_at is null
        group by d.stage_id
      ) stage_counts
      left join public.pipeline_stages ps on ps.id = stage_counts.stage_id), '{}'::jsonb),
    coalesce((select jsonb_object_agg(to_char(date_trunc('month', d.won_at), 'YYYY-MM'), wins.count)
      from (
        select date_trunc('month', d.won_at) as month, count(*)::integer as count
        from public.deals d
        where d.organization_id = p_org_id and d.archived_at is null and d.won_at is not null
        group by date_trunc('month', d.won_at)
      ) wins), '{}'::jsonb),
    now()
  on conflict (organization_id) do update set
    total_leads = excluded.total_leads,
    active_opportunities = excluded.active_opportunities,
    won_opportunities = excluded.won_opportunities,
    closed_won_this_month = excluded.closed_won_this_month,
    expected_revenue = excluded.expected_revenue,
    pipeline_value = excluded.pipeline_value,
    deals_by_stage = excluded.deals_by_stage,
    revenue_by_month = excluded.revenue_by_month,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.refresh_crm_dashboard_summary_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.organization_id is distinct from new.organization_id then
    perform public.refresh_crm_dashboard_summary(old.organization_id);
  end if;
  perform public.refresh_crm_dashboard_summary(coalesce(new.organization_id, old.organization_id));
  return coalesce(new, old);
end;
$$;

create trigger leads_dashboard_summary_refresh
after insert or update or delete on public.leads
for each row execute function public.refresh_crm_dashboard_summary_trigger();

create trigger deals_dashboard_summary_refresh
after insert or update or delete on public.deals
for each row execute function public.refresh_crm_dashboard_summary_trigger();

-- Build rows for organizations that already have CRM data.
insert into public.crm_dashboard_summary (organization_id)
select id from public.organizations
on conflict (organization_id) do nothing;

do $$
declare
  org record;
begin
  for org in select id from public.organizations loop
    perform public.refresh_crm_dashboard_summary(org.id);
  end loop;
end;
$$;

revoke all on function public.refresh_crm_dashboard_summary(uuid) from public, anon, authenticated;
revoke all on function public.refresh_crm_dashboard_summary_trigger() from public, anon, authenticated;
grant execute on function public.refresh_crm_dashboard_summary(uuid) to service_role;
grant select on public.crm_dashboard_summary to authenticated;