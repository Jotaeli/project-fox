-- Fase 5.4 — planetas compartilhados: membros, autoria, RLS e storage por planeta.

alter type tipo_notificacao add value if not exists 'planeta_convite';
alter type tipo_notificacao add value if not exists 'planeta_aceito';

create type papel_membro_planeta as enum ('dono', 'membro');
create type status_membro_planeta as enum ('pendente', 'aceito');

create table planeta_membros (
  planeta_id uuid not null references planetas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel papel_membro_planeta not null default 'membro',
  status status_membro_planeta not null default 'pendente',
  meta_semanal smallint not null default 3 check (meta_semanal between 1 and 7),
  convidado_por uuid references auth.users(id) on delete set null,
  respondido_em timestamptz,
  created_at timestamptz not null default now(),
  primary key (planeta_id, user_id)
);

create index planeta_membros_user_idx on planeta_membros(user_id, status);

insert into planeta_membros (planeta_id, user_id, papel, status, meta_semanal, convidado_por, respondido_em, created_at)
select id, user_id, 'dono', 'aceito', meta_semanal, user_id, created_at, created_at
from planetas
on conflict do nothing;

alter table relatorios add column autor_id uuid references auth.users(id) on delete restrict;
alter table recursos add column autor_id uuid references auth.users(id) on delete restrict;
alter table fotos add column autor_id uuid references auth.users(id) on delete restrict;
alter table eventos add column autor_id uuid references auth.users(id) on delete restrict;
alter table checklist_itens_evento add column autor_id uuid references auth.users(id) on delete restrict;

update relatorios r set autor_id = p.user_id from planetas p where p.id = r.planeta_id;
update recursos r set autor_id = p.user_id from planetas p where p.id = r.planeta_id;
update fotos f set autor_id = p.user_id from planetas p where p.id = f.planeta_id;
update eventos e set autor_id = p.user_id from planetas p where p.id = e.planeta_id;
update checklist_itens_evento c set autor_id = e.autor_id from eventos e where e.id = c.evento_id;

alter table relatorios alter column autor_id set not null;
alter table recursos alter column autor_id set not null;
alter table fotos alter column autor_id set not null;
alter table eventos alter column autor_id set not null;
alter table checklist_itens_evento alter column autor_id set not null;

create index relatorios_autor_idx on relatorios(planeta_id, autor_id, created_at desc);
create index recursos_autor_idx on recursos(planeta_id, autor_id);
create index fotos_autor_idx on fotos(planeta_id, autor_id);
create index eventos_autor_idx on eventos(planeta_id, autor_id);

create function app_private.participa_planeta(p_planeta_id uuid, p_user_id uuid, p_incluir_pendente boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1 from planeta_membros pm
    where pm.planeta_id = p_planeta_id and pm.user_id = p_user_id
      and (pm.status = 'aceito' or p_incluir_pendente)
  );
$$;

create function app_private.eh_dono_planeta(p_planeta_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1 from planeta_membros pm
    where pm.planeta_id = p_planeta_id and pm.user_id = p_user_id
      and pm.papel = 'dono' and pm.status = 'aceito'
  );
$$;

revoke all on function app_private.participa_planeta(uuid, uuid, boolean) from public, anon;
revoke all on function app_private.eh_dono_planeta(uuid, uuid) from public, anon;
grant execute on function app_private.participa_planeta(uuid, uuid, boolean) to authenticated;
grant execute on function app_private.eh_dono_planeta(uuid, uuid) to authenticated;

create function public.registrar_dono_planeta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into planeta_membros (planeta_id, user_id, papel, status, meta_semanal, convidado_por, respondido_em)
  values (new.id, new.user_id, 'dono', 'aceito', new.meta_semanal, new.user_id, now());
  return new;
end;
$$;

create trigger planeta_registra_dono
after insert on planetas
for each row execute function public.registrar_dono_planeta();

alter table planeta_membros enable row level security;

drop policy if exists "planetas_owner" on planetas;
create policy "planetas_membro_select" on planetas for select
  using (app_private.participa_planeta(id, auth.uid(), true));
create policy "planetas_dono_insert" on planetas for insert
  with check (user_id = auth.uid());
create policy "planetas_dono_update" on planetas for update
  using (app_private.eh_dono_planeta(id, auth.uid()))
  with check (user_id = auth.uid());
create policy "planetas_dono_delete" on planetas for delete
  using (app_private.eh_dono_planeta(id, auth.uid()));

create policy "planeta_membros_select_participante" on planeta_membros for select
  using (user_id = auth.uid() or app_private.participa_planeta(planeta_id, auth.uid(), true));

drop policy if exists "relatorios_owner" on relatorios;
create policy "relatorios_membros_select" on relatorios for select
  using (app_private.participa_planeta(planeta_id, auth.uid()));
create policy "relatorios_autor_insert" on relatorios for insert
  with check (autor_id = auth.uid() and app_private.participa_planeta(planeta_id, auth.uid()));
create policy "relatorios_autor_update" on relatorios for update
  using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy "relatorios_autor_delete" on relatorios for delete
  using (autor_id = auth.uid());

drop policy if exists "recursos_owner" on recursos;
create policy "recursos_membros_select" on recursos for select
  using (app_private.participa_planeta(planeta_id, auth.uid()));
create policy "recursos_autor_insert" on recursos for insert
  with check (autor_id = auth.uid() and app_private.participa_planeta(planeta_id, auth.uid()));
create policy "recursos_autor_update" on recursos for update
  using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy "recursos_autor_delete" on recursos for delete
  using (autor_id = auth.uid());

drop policy if exists "fotos_owner" on fotos;
create policy "fotos_membros_select" on fotos for select
  using (app_private.participa_planeta(planeta_id, auth.uid()));
create policy "fotos_autor_insert" on fotos for insert
  with check (autor_id = auth.uid() and app_private.participa_planeta(planeta_id, auth.uid()));
create policy "fotos_autor_update" on fotos for update
  using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy "fotos_autor_delete" on fotos for delete
  using (autor_id = auth.uid());

drop policy if exists "eventos_owner" on eventos;
create policy "eventos_membros_select" on eventos for select
  using (app_private.participa_planeta(planeta_id, auth.uid()));
create policy "eventos_autor_insert" on eventos for insert
  with check (autor_id = auth.uid() and app_private.participa_planeta(planeta_id, auth.uid()));
create policy "eventos_autor_update" on eventos for update
  using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy "eventos_autor_delete" on eventos for delete
  using (autor_id = auth.uid());

drop policy if exists "checklist_itens_evento_owner" on checklist_itens_evento;
create policy "checklist_evento_membros_select" on checklist_itens_evento for select
  using (exists (
    select 1 from eventos e
    where e.id = evento_id and app_private.participa_planeta(e.planeta_id, auth.uid())
  ));
create policy "checklist_evento_autor_insert" on checklist_itens_evento for insert
  with check (autor_id = auth.uid() and exists (
    select 1 from eventos e where e.id = evento_id and e.autor_id = auth.uid()
  ));
create policy "checklist_evento_autor_update" on checklist_itens_evento for update
  using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy "checklist_evento_autor_delete" on checklist_itens_evento for delete
  using (autor_id = auth.uid());

-- Novos arquivos usam {planeta_id}/{autor_id}/{arquivo}; caminhos antigos continuam legíveis pelo dono.
update storage.buckets set public = false where id in ('planeta-recursos', 'planeta-fotos');
update recursos set arquivo_url = regexp_replace(arquivo_url, '^.*/object/public/planeta-recursos/', '')
  where arquivo_url like '%/object/public/planeta-recursos/%';
update fotos set url = regexp_replace(url, '^.*/object/public/planeta-fotos/', '')
  where url like '%/object/public/planeta-fotos/%';

drop policy if exists "planeta_recursos_public_read" on storage.objects;
drop policy if exists "planeta_recursos_owner_insert" on storage.objects;
drop policy if exists "planeta_recursos_owner_update" on storage.objects;
drop policy if exists "planeta_recursos_owner_delete" on storage.objects;
drop policy if exists "planeta_fotos_public_read" on storage.objects;
drop policy if exists "planeta_fotos_owner_insert" on storage.objects;
drop policy if exists "planeta_fotos_owner_update" on storage.objects;
drop policy if exists "planeta_fotos_owner_delete" on storage.objects;

create policy "planeta_storage_membros_select" on storage.objects for select
  using (
    bucket_id in ('planeta-recursos', 'planeta-fotos') and (
      case
        when (storage.foldername(name))[1] = auth.uid()::text
          then app_private.participa_planeta(((storage.foldername(name))[2])::uuid, auth.uid())
        else app_private.participa_planeta(((storage.foldername(name))[1])::uuid, auth.uid())
      end
    )
  );

create policy "planeta_storage_autor_insert" on storage.objects for insert
  with check (
    bucket_id in ('planeta-recursos', 'planeta-fotos')
    and (storage.foldername(name))[2] = auth.uid()::text
    and app_private.participa_planeta(((storage.foldername(name))[1])::uuid, auth.uid())
  );
create policy "planeta_storage_autor_update" on storage.objects for update
  using (
    bucket_id in ('planeta-recursos', 'planeta-fotos')
    and (storage.foldername(name))[2] = auth.uid()::text
    and app_private.participa_planeta(((storage.foldername(name))[1])::uuid, auth.uid())
  );
create policy "planeta_storage_autor_delete" on storage.objects for delete
  using (
    bucket_id in ('planeta-recursos', 'planeta-fotos')
    and (storage.foldername(name))[2] = auth.uid()::text
    and app_private.participa_planeta(((storage.foldername(name))[1])::uuid, auth.uid())
  );

notify pgrst, 'reload schema';
