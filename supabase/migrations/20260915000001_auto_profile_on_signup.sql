-- Auto-create a profile row when a new auth user signs up.
-- Prevents the "users not showing in admin" problem forever.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text := nullif(v_meta->>'first_name', '');
  v_last  text := nullif(v_meta->>'last_name', '');
  v_full  text := nullif(v_meta->>'full_name', '')
                  || nullif(trim(coalesce(v_first,'') || ' ' || coalesce(v_last,'')), '');
begin
  insert into public.profiles (id, email, first_name, last_name, full_name, status)
  values (
    new.id,
    new.email,
    v_first,
    v_last,
    coalesce(nullif(v_full,''), split_part(new.email, '@', 1)),
    'active'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
