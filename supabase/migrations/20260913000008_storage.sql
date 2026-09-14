-- ============================================================
-- Step 51 — Storage buckets & policies (Steps 65–67)
-- Private buckets: avatars, crm-files, support-attachments.
-- Object path convention: {organizationId}/{...} so policies can
-- scope access to the uploader's organization.
--
-- BEST-EFFORT: on newer Supabase projects the SQL Editor role
-- (postgres) is not a superuser and may lack DDL rights on the
-- storage schema (owned by supabase_storage_admin). If denied,
-- this block raises a NOTICE and SKIPS storage setup instead of
-- failing the whole migration — the rest of the schema is
-- unaffected. Buckets + policies can be configured later from the
-- Dashboard (Storage) or by a role with storage ownership.
-- ============================================================

do $mig$
begin
  if not exists (select 1 from pg_catalog.pg_namespace where nspname = 'storage') then
    raise notice 'SKIP storage setup: storage schema does not exist';
    return;
  end if;

  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', false),
         ('crm-files', 'crm-files', false),
         ('support-attachments', 'support-attachments', false)
  on conflict (id) do nothing;

  -- Helper: is the object path inside an org the user is a member of?
  create or replace function storage.can_access_org_path(bucket text, path text)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select public.is_organization_member(
      nullif(split_part(path, '/', 1), '')::uuid
    );
  $$;

  -- avatars: users manage their own folder {orgId}/{userId}/...
  create policy avatars_select on storage.objects
    for select using (
      bucket_id = 'avatars' and storage.can_access_org_path(bucket_id, name)
    );

  create policy avatars_insert on storage.objects
    for insert with check (
      bucket_id = 'avatars'
      and storage.can_access_org_path(bucket_id, name)
      and split_part(name, '/', 2) = auth.uid()::text
    );

  create policy avatars_update on storage.objects
    for update using (
      bucket_id = 'avatars'
      and storage.can_access_org_path(bucket_id, name)
      and split_part(name, '/', 2) = auth.uid()::text
    );

  create policy avatars_delete on storage.objects
    for delete using (
      bucket_id = 'avatars'
      and storage.can_access_org_path(bucket_id, name)
      and split_part(name, '/', 2) = auth.uid()::text
    );

  -- crm-files + support-attachments: org member scoped
  create policy crm_files_select on storage.objects
    for select using (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy crm_files_insert on storage.objects
    for insert with check (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy crm_files_update on storage.objects
    for update using (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy crm_files_delete on storage.objects
    for delete using (bucket_id = 'crm-files' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_select on storage.objects
    for select using (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_insert on storage.objects
    for insert with check (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_update on storage.objects
    for update using (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  create policy support_attachments_delete on storage.objects
    for delete using (bucket_id = 'support-attachments' and storage.can_access_org_path(bucket_id, name));

  raise notice 'Storage setup applied (buckets + policies)';
exception
  when insufficient_privilege then
    raise notice 'SKIP storage setup: session role lacks privileges on schema storage (configure from Dashboard -> Storage). %', sqlerrm;
  when others then
    raise notice 'SKIP storage setup: %', sqlerrm;
end
$mig$;