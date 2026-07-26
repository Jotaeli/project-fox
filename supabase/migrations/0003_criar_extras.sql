-- Fase 4 — Desenvolver/Criar: colunas que faltavam + integração com tarefas + storage

alter table planetas
  add column tem_recursos boolean not null default false,
  add column tem_fotos boolean not null default false;

alter table eventos
  add column concluido_em timestamptz,
  add column falhou_em timestamptz;

alter table tarefas
  add column concluida_at timestamptz;

-- Bucket de recursos (arquivos) dos planetas
-- Path convencionado: {user_id}/{planeta_id}/{filename}

insert into storage.buckets (id, name, public)
values ('planeta-recursos', 'planeta-recursos', true)
on conflict (id) do nothing;

create policy "planeta_recursos_public_read"
  on storage.objects for select
  using (bucket_id = 'planeta-recursos');

create policy "planeta_recursos_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'planeta-recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "planeta_recursos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'planeta-recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "planeta_recursos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'planeta-recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Bucket de fotos dos planetas
-- Path convencionado: {user_id}/{planeta_id}/{filename}

insert into storage.buckets (id, name, public)
values ('planeta-fotos', 'planeta-fotos', true)
on conflict (id) do nothing;

create policy "planeta_fotos_public_read"
  on storage.objects for select
  using (bucket_id = 'planeta-fotos');

create policy "planeta_fotos_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'planeta-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "planeta_fotos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'planeta-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "planeta_fotos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'planeta-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
