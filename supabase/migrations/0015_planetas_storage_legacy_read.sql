-- Membros podem ler tanto o caminho novo {planeta}/{autor}/arquivo quanto o legado {autor}/{planeta}/arquivo.

drop policy if exists "planeta_storage_membros_select" on storage.objects;
create policy "planeta_storage_membros_select" on storage.objects for select
  using (
    bucket_id in ('planeta-recursos', 'planeta-fotos')
    and (
      app_private.participa_planeta(((storage.foldername(name))[1])::uuid, auth.uid())
      or app_private.participa_planeta(((storage.foldername(name))[2])::uuid, auth.uid())
    )
  );

notify pgrst, 'reload schema';
