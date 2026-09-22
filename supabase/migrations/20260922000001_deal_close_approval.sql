-- ============================================================
-- FinloNexa CRM — Phase 4: Head-of-Sales Close Approval Requests
--
-- Adds a minimal pending approval table that gates opportunities from
-- being marked Closed Won / Closed Lost until the Head of Sales reviews
-- and approves the requested outcome.
--
-- The application still keeps the actual close transition in the
-- existing deals + pipeline_stages flow; this table only records the
-- approval request state and makes the close path server-side require
-- an approved request before the final closed stage is set.
-- ============================================================

create table if not exists public.deal_close_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  deal_id uuid not null,
  requested_outcome text not null check (requested_outcome in ('won', 'lost')),
  status text not null default 'pending_head_approval' check (status in ('pending_head_approval', 'approved', 'rejected')),
  requested_by uuid,
  requested_at timestamptz not null default now(),
  final_value numeric(14,2),
  close_date timestamptz,
  lost_reason text,
  competitor text,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deal_close_requests_org_fk foreign key (organization_id) references public.organizations(id) on delete cascade,
  constraint deal_close_requests_deal_fk foreign key (deal_id) references public.deals(id) on delete cascade,
  constraint deal_close_requests_requested_by_fk foreign key (requested_by) references auth.users(id) on delete set null,
  constraint deal_close_requests_reviewed_by_fk foreign key (reviewed_by) references auth.users(id) on delete set null
);

create index if not exists deal_close_requests_org_status_idx
  on public.deal_close_requests (organization_id, status, requested_at desc);

create index if not exists deal_close_requests_deal_idx
  on public.deal_close_requests (organization_id, deal_id, status);

alter table public.deal_close_requests enable row level security;

create policy if not exists deal_close_requests_select_org_members
  on public.deal_close_requests
  for select
  using (
    public.is_organization_member(organization_id)
    and (
      public.can_see_sales_record(organization_id, (
        select owner_id from public.deals where id = deal_id and organization_id = organization_id
      ), (
        select created_by from public.deals where id = deal_id and organization_id = organization_id
      ))
      or public.sales_role_is_org_wide(organization_id)
    )
  );

create policy if not exists deal_close_requests_insert_org_members
  on public.deal_close_requests
  for insert
  with check (
    public.is_organization_member(organization_id)
    and requested_by = auth.uid()
  );

create policy if not exists deal_close_requests_update_org_wide_only
  on public.deal_close_requests
  for update
  using (
    public.is_organization_member(organization_id)
    and public.sales_role_is_org_wide(organization_id)
  )
  with check (
    public.is_organization_member(organization_id)
    and public.sales_role_is_org_wide(organization_id)
  );

create policy if not exists deal_close_requests_delete_org_wide_only
  on public.deal_close_requests
  for delete
  using (
    public.is_organization_member(organization_id)
    and public.sales_role_is_org_wide(organization_id)
  );

create or replace function public.set_deal_close_requests_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger if not exists deal_close_requests_updated_at
  before update on public.deal_close_requests
  for each row
  execute function public.set_deal_close_requests_updated_at();
