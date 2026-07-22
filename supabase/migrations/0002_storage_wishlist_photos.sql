-- Bucket de fotos dos itens da Wishlist
-- Path convencionado: {user_id}/{filename} — políticas usam o primeiro segmento do path como dono.

insert into storage.buckets (id, name, public)
values ('wishlist-photos', 'wishlist-photos', true)
on conflict (id) do nothing;

create policy "wishlist_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'wishlist-photos');

create policy "wishlist_photos_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'wishlist-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "wishlist_photos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'wishlist-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "wishlist_photos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'wishlist-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
