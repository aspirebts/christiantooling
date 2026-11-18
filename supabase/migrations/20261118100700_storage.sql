-- =============================================================================
-- Storage buckets and access policies
-- =============================================================================
-- Buckets are public for reading (files are served by URL), while writes are
-- restricted by RLS on storage.objects. SVG is deliberately not allowed for
-- uploads because it can carry scripts.
--
--   avatars        members write only inside their own folder: <user_id>/<file>
--   tool-logos     administrators manage directory logos
--   content-media  administrators manage images for pages and impact reports
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('tool-logos', 'tool-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp']),
  ('content-media', 'content-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- avatars ----------------------------------------------------------------------
-- Upserting a file needs INSERT, SELECT and UPDATE policies together.
create policy "Members can view objects in their avatar folder"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members can upload to their avatar folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.has_min_role('registered_user'))
  );

create policy "Members can replace files in their avatar folder"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members can delete files in their avatar folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- tool-logos and content-media -------------------------------------------------
create policy "Administrators can manage directory and content media"
  on storage.objects for all
  to authenticated
  using (bucket_id in ('tool-logos', 'content-media') and (select private.is_admin()))
  with check (bucket_id in ('tool-logos', 'content-media') and (select private.is_admin()));
