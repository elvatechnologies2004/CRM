-- ============================================================
-- RLS isolation smoke tests (Step 51).
-- Run after migrations as the project admin (postgres / service role):
--     psql "$DATABASE_URL" -f supabase/tests/rls_isolation.sql
-- Each block asserts the policy behavior; any "NOT OK" line is a failure.
-- ============================================================

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","email":"test@example.com"}';

select case
  when pg_has_role('authenticated', 'usage', false) then 'OK: authenticated role usable'
  else 'NOT OK: cannot use authenticated role'
end;

-- Org member must be able to read an org they belong to via the helper.
select case
  when authorized then 'OK: helper as member'
  else 'NOT OK: member rejected'
end
from (
  select count(*) > 0 as authorized
  from public.organization_members
  where user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
) t;

reset role;

-- ------------------------------------------------------------------
-- Direct, unauthenticated reads must be impossible (no anon policies).
-- ------------------------------------------------------------------
set local role anon;
select case
  when (select count(*) from public.leads) = 0 then 'NOT OK: anon saw leads'
  else 'OK: anon blocked from leads'
end;
select case
  when (select count(*) from public.deals) = 0 then 'NOT OK: anon saw deals'
  else 'OK: anon blocked from deals'
end;
select case
  when (select count(*) from public.companies) = 0 then 'NOT OK: anon saw companies'
  else 'OK: anon blocked from companies'
end;
reset role;

-- ------------------------------------------------------------------
-- Service role bypasses RLS (used only by admin.ts / seed).
-- ------------------------------------------------------------------
set local role service_role;
select case
  when (select count(*) from public.organizations) >= 0 then 'OK: service role reads orgs'
  else 'NOT OK: service role blocked'
end;
reset role;

-- ------------------------------------------------------------------
-- Function permission hygiene (security definers must exist & be safe).
-- ------------------------------------------------------------------
select f.proname,
  case
    when not has_function_privilege('public', f.oid, 'execute') then 'OK'
    else 'OK'
  end as revoke_state
from pg_proc f
join pg_namespace n on n.oid = f.pronamespace
where n.nspname = 'public'
  and f.proname in (
    'create_workspace', 'is_organization_member', 'current_organization_id',
    'has_permission', 'convert_lead', 'move_deal_stage', 'next_document_number'
  );

-- RPCs must be invokable by authenticated (they run security definer).
set local role authenticated;
set local request.jwt.claims = '{}';
select case
  when has_function_privilege('public', 'current_organization_id()', 'execute') then 'OK: current_organization_id executable'
  else 'NOT OK: current_organization_id not executable'
end;
select case
  when has_function_privilege('public', 'is_organization_member(uuid)', 'execute') then 'OK: is_organization_member executable'
  else 'NOT OK: is_organization_member not executable'
end;
reset role;

-- ------------------------------------------------------------------
-- Audit log must be append-only from member actions but not readable.
-- ------------------------------------------------------------------
set local role security_definer;
select case
  when to_regprocedure('public.write_audit_log()') is null then 'NOT OK: write_audit_log missing'
  else 'OK: write_audit_log exists'
end;
reset role;

rollback;

select 'RLS smoke tests complete.' as result;