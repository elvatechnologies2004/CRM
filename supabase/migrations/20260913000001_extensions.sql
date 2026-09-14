-- ============================================================
-- Step 51 — Extensions & base infrastructure
-- ============================================================

create extension if not exists pgcrypto;

-- Reusable updated_at trigger function (Step 73)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at is not distinct from old.updated_at then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- Reusable created_by / updated_by guard is intentionally left to the data
-- layer so hidden business logic stays out of the database where possible.

-- Default privileges: any object created later in the public schema
-- (by the migration-run role) is immediately accessible to the standard
-- Supabase client roles (anon, authenticated, service_role).
-- This survives `drop schema public cascade` + recreate.
alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;