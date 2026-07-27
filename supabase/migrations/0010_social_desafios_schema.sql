-- Fase 5.3 — schema de desafios compartilhados.

alter type tipo_notificacao add value if not exists 'desafio_convite';
alter type tipo_notificacao add value if not exists 'desafio_aceito';
alter type tipo_notificacao add value if not exists 'desafio_concluido';

create type status_desafio as enum ('ativo', 'concluido', 'falha', 'cancelado');
create type status_participante_desafio as enum ('pendente', 'aceito', 'recusado');

create table desafios (
  id uuid primary key default gen_random_uuid(),
  criador_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 60),
  descricao text,
  icone text not null default 'alvo',
  cor text not null default '#7c72e8',
  prazo date not null,
  status status_desafio not null default 'ativo',
  concluido_em timestamptz,
  falhou_em timestamptz,
  created_at timestamptz not null default now(),
  constraint desafios_prazo_valido check (
    prazo between (created_at at time zone 'America/Fortaleza')::date + 7
              and (created_at at time zone 'America/Fortaleza')::date + 93
  )
);

create index desafios_criador_idx on desafios (criador_id, created_at desc);
create index desafios_status_prazo_idx on desafios (status, prazo);

create table desafio_participantes (
  desafio_id uuid not null references desafios (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status status_participante_desafio not null default 'pendente',
  convidado_por uuid not null references auth.users (id) on delete cascade,
  respondido_em timestamptz,
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  primary key (desafio_id, user_id)
);

create index desafio_participantes_user_idx
  on desafio_participantes (user_id, status, created_at desc);

create table desafio_objetivos (
  id uuid primary key default gen_random_uuid(),
  desafio_id uuid not null references desafios (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 100),
  ordem smallint not null default 0,
  unique (desafio_id, ordem)
);

create index desafio_objetivos_desafio_idx
  on desafio_objetivos (desafio_id, ordem);

create table desafio_progresso (
  objetivo_id uuid not null references desafio_objetivos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  relatorio_id uuid references relatorios (id) on delete set null,
  comprovado_em timestamptz not null default now(),
  primary key (objetivo_id, user_id)
);

create index desafio_progresso_user_idx on desafio_progresso (user_id, comprovado_em desc);

create function app_private.participa_desafio(p_desafio_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from desafio_participantes
    where desafio_id = p_desafio_id and user_id = p_user_id and status <> 'recusado'
  );
$$;

revoke all on function app_private.participa_desafio(uuid, uuid) from public, anon;
grant execute on function app_private.participa_desafio(uuid, uuid) to authenticated;

alter table desafios enable row level security;
alter table desafio_participantes enable row level security;
alter table desafio_objetivos enable row level security;
alter table desafio_progresso enable row level security;

create policy "desafios_select_participante" on desafios for select
  using (app_private.participa_desafio(id, auth.uid()));
create policy "desafios_insert_criador" on desafios for insert
  with check (auth.uid() = criador_id);
create policy "desafios_update_criador" on desafios for update
  using (auth.uid() = criador_id)
  with check (auth.uid() = criador_id);
create policy "desafios_delete_criador" on desafios for delete
  using (auth.uid() = criador_id);

create policy "desafio_participantes_select_grupo" on desafio_participantes for select
  using (app_private.participa_desafio(desafio_id, auth.uid()));

create policy "desafio_objetivos_select_grupo" on desafio_objetivos for select
  using (app_private.participa_desafio(desafio_id, auth.uid()));

create policy "desafio_progresso_select_grupo" on desafio_progresso for select
  using (exists (
    select 1 from desafio_objetivos o
    where o.id = objetivo_id and app_private.participa_desafio(o.desafio_id, auth.uid())
  ));

notify pgrst, 'reload schema';
