-- Fase 5.5 — espaços de notas compartilhados, separados do grafo pessoal.

alter type tipo_notificacao add value if not exists 'espaco_notas_convite';
alter type tipo_notificacao add value if not exists 'espaco_notas_aceito';

create type papel_membro_espaco_notas as enum ('dono', 'membro');
create type status_membro_espaco_notas as enum ('pendente', 'aceito');

create table espacos_notas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 1 and 50),
  cor text not null default '#7c72e8',
  created_at timestamptz not null default now()
);

create table espaco_notas_membros (
  espaco_id uuid not null references espacos_notas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel papel_membro_espaco_notas not null default 'membro',
  status status_membro_espaco_notas not null default 'pendente',
  convidado_por uuid references auth.users(id) on delete set null,
  respondido_em timestamptz,
  created_at timestamptz not null default now(),
  primary key (espaco_id, user_id)
);

create index espaco_notas_membros_user_idx on espaco_notas_membros(user_id, status);

create table notas_compartilhadas (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references espacos_notas(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  conteudo text not null default '',
  badges text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint notas_compartilhadas_badges_validas check (badges <@ array['wishlist', 'tarefas', 'criar']::text[])
);

create index notas_compartilhadas_espaco_idx on notas_compartilhadas(espaco_id, created_at);
create index notas_compartilhadas_autor_idx on notas_compartilhadas(autor_id);

create table posicoes_notas_compartilhadas (
  nota_id uuid not null references notas_compartilhadas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pos_x double precision not null,
  pos_y double precision not null,
  updated_at timestamptz not null default now(),
  primary key (nota_id, user_id)
);

create table conexoes_notas_compartilhadas (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references espacos_notas(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade,
  nota_origem_id uuid not null references notas_compartilhadas(id) on delete cascade,
  nota_destino_id uuid not null references notas_compartilhadas(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conexoes_compartilhadas_sem_loop check (nota_origem_id <> nota_destino_id)
);

create unique index conexoes_compartilhadas_par_unico_idx on conexoes_notas_compartilhadas (
  espaco_id, least(nota_origem_id, nota_destino_id), greatest(nota_origem_id, nota_destino_id)
);

create function app_private.participa_espaco_notas(p_espaco_id uuid, p_user_id uuid, p_incluir_pendente boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1 from espaco_notas_membros em
    where em.espaco_id = p_espaco_id and em.user_id = p_user_id
      and (em.status = 'aceito' or p_incluir_pendente)
  );
$$;

create function app_private.eh_dono_espaco_notas(p_espaco_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1 from espacos_notas e where e.id = p_espaco_id and e.owner_id = p_user_id
  );
$$;

revoke all on function app_private.participa_espaco_notas(uuid, uuid, boolean) from public, anon;
revoke all on function app_private.eh_dono_espaco_notas(uuid, uuid) from public, anon;
grant execute on function app_private.participa_espaco_notas(uuid, uuid, boolean) to authenticated;
grant execute on function app_private.eh_dono_espaco_notas(uuid, uuid) to authenticated;

create function public.registrar_dono_espaco_notas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into espaco_notas_membros (espaco_id, user_id, papel, status, convidado_por, respondido_em)
  values (new.id, new.owner_id, 'dono', 'aceito', new.owner_id, now());
  return new;
end;
$$;

create trigger espaco_notas_registra_dono
after insert on espacos_notas
for each row execute function public.registrar_dono_espaco_notas();

alter table espacos_notas enable row level security;
alter table espaco_notas_membros enable row level security;
alter table notas_compartilhadas enable row level security;
alter table posicoes_notas_compartilhadas enable row level security;
alter table conexoes_notas_compartilhadas enable row level security;

create policy "espacos_notas_select_participante" on espacos_notas for select
  using (owner_id = auth.uid() or app_private.participa_espaco_notas(id, auth.uid(), true));
create policy "espacos_notas_insert_owner" on espacos_notas for insert
  with check (owner_id = auth.uid());
create policy "espacos_notas_update_owner" on espacos_notas for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "espaco_membros_select_participante" on espaco_notas_membros for select
  using (user_id = auth.uid() or app_private.participa_espaco_notas(espaco_id, auth.uid(), true));

create policy "notas_compartilhadas_select_membro" on notas_compartilhadas for select
  using (app_private.participa_espaco_notas(espaco_id, auth.uid()));
create policy "notas_compartilhadas_insert_autor" on notas_compartilhadas for insert
  with check (autor_id = auth.uid() and app_private.participa_espaco_notas(espaco_id, auth.uid()));
create policy "notas_compartilhadas_update_autor" on notas_compartilhadas for update
  using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy "notas_compartilhadas_delete_autor" on notas_compartilhadas for delete
  using (autor_id = auth.uid());

create policy "posicoes_compartilhadas_select_propria" on posicoes_notas_compartilhadas for select
  using (user_id = auth.uid());
create policy "posicoes_compartilhadas_insert_propria" on posicoes_notas_compartilhadas for insert
  with check (user_id = auth.uid() and exists (
    select 1 from notas_compartilhadas n
    where n.id = nota_id and app_private.participa_espaco_notas(n.espaco_id, auth.uid())
  ));
create policy "posicoes_compartilhadas_update_propria" on posicoes_notas_compartilhadas for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "posicoes_compartilhadas_delete_propria" on posicoes_notas_compartilhadas for delete
  using (user_id = auth.uid());

create policy "conexoes_compartilhadas_select_membro" on conexoes_notas_compartilhadas for select
  using (app_private.participa_espaco_notas(espaco_id, auth.uid()));
create policy "conexoes_compartilhadas_insert_autor" on conexoes_notas_compartilhadas for insert
  with check (
    autor_id = auth.uid() and app_private.participa_espaco_notas(espaco_id, auth.uid())
    and exists (select 1 from notas_compartilhadas n where n.id = nota_origem_id and n.espaco_id = espaco_id)
    and exists (select 1 from notas_compartilhadas n where n.id = nota_destino_id and n.espaco_id = espaco_id)
  );
create policy "conexoes_compartilhadas_delete_autor" on conexoes_notas_compartilhadas for delete
  using (autor_id = auth.uid());

notify pgrst, 'reload schema';
