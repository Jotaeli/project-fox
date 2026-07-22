-- Project Fox — schema inicial
-- Multi-usuário: toda tabela de domínio tem user_id -> auth.users(id) e RLS restrita ao dono.

create extension if not exists "pgcrypto";

-- =========================================================================
-- Perfis
-- =========================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- =========================================================================
-- Desenvolver/Criar — precede Rotina pois wishlist/tarefas referenciam planetas
-- =========================================================================

create type tipo_planeta as enum ('rochoso', 'gasoso', 'anelado', 'gelado');
create type status_evento as enum ('ativo', 'concluido', 'falha');

create table planetas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  cor text not null,
  tipo tipo_planeta not null,
  objetivo_principal text not null,
  descricao text,
  meta_semanal smallint not null check (meta_semanal between 1 and 7),
  created_at timestamptz not null default now()
);

create index planetas_user_id_idx on planetas (user_id);

create table relatorios (
  id uuid primary key default gen_random_uuid(),
  planeta_id uuid not null references planetas (id) on delete cascade,
  conteudo text not null,
  nota_conectada_id uuid, -- fk para notas adicionada depois de notas existir
  created_at timestamptz not null default now()
);

create index relatorios_planeta_id_idx on relatorios (planeta_id);

create table recursos (
  id uuid primary key default gen_random_uuid(),
  planeta_id uuid not null references planetas (id) on delete cascade,
  nome text not null,
  arquivo_url text not null,
  tipo text not null,
  created_at timestamptz not null default now()
);

create index recursos_planeta_id_idx on recursos (planeta_id);

create table fotos (
  id uuid primary key default gen_random_uuid(),
  planeta_id uuid not null references planetas (id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

create index fotos_planeta_id_idx on fotos (planeta_id);

create table eventos (
  id uuid primary key default gen_random_uuid(),
  planeta_id uuid not null references planetas (id) on delete cascade,
  titulo text not null,
  icone text not null,
  cor text not null,
  prazo date not null,
  status status_evento not null default 'ativo',
  created_at timestamptz not null default now()
);

create index eventos_planeta_id_idx on eventos (planeta_id);

create table checklist_itens_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos (id) on delete cascade,
  titulo text not null,
  relatorio_anexado_id uuid references relatorios (id) on delete set null,
  comprovado boolean not null default false
);

create index checklist_itens_evento_evento_id_idx on checklist_itens_evento (evento_id);

-- =========================================================================
-- Rotina — Wishlist
-- =========================================================================

create type tier_wishlist as enum ('S', 'A', 'B', 'C');

create table itens_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor numeric(12, 2) not null,
  foto text,
  planeta_id uuid references planetas (id) on delete set null,
  descricao text,
  link text,
  tier tier_wishlist not null default 'C',
  comprado boolean not null default false,
  created_at timestamptz not null default now()
);

create index itens_wishlist_user_id_idx on itens_wishlist (user_id);

-- =========================================================================
-- Rotina — Finanças
-- =========================================================================

create table rendas_mensais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fonte text not null,
  valor numeric(12, 2) not null,
  mes char(7) not null, -- "YYYY-MM"
  origem_tarefa_id uuid, -- fk para tarefas adicionada depois de tarefas existir
  created_at timestamptz not null default now()
);

create index rendas_mensais_user_id_mes_idx on rendas_mensais (user_id, mes);

create table modalidades_gasto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  cor text not null,
  fixa boolean not null default false,
  ordem smallint not null default 0
);

create index modalidades_gasto_user_id_idx on modalidades_gasto (user_id);

create table gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  modalidade_id uuid not null references modalidades_gasto (id) on delete cascade,
  descricao text not null,
  valor numeric(12, 2) not null,
  mes char(7) not null,
  pago boolean not null default false,
  pago_em timestamptz,
  item_wishlist_id uuid references itens_wishlist (id) on delete set null,
  created_at timestamptz not null default now()
);

create index gastos_user_id_mes_idx on gastos (user_id, mes);

-- =========================================================================
-- Rotina — Tarefas
-- =========================================================================

create type ordenacao_secao as enum ('personalizado', 'data');

create table secoes_tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  cor text not null,
  ordem smallint not null default 0,
  fixa boolean not null default false, -- "Geral" não pode ser excluída
  ordenacao ordenacao_secao not null default 'personalizado'
);

create index secoes_tarefas_user_id_idx on secoes_tarefas (user_id);

create table tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  secao_id uuid not null references secoes_tarefas (id) on delete restrict,
  titulo text not null,
  descricao text,
  ordem smallint not null default 0,
  prazo date,
  financeira boolean not null default false,
  valor_alvo numeric(12, 2),
  wishlist_ref_id uuid references itens_wishlist (id) on delete set null,
  origem_planeta_id uuid references planetas (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint tarefa_financeira_tem_valor check (
    (financeira = false) or (financeira = true and valor_alvo is not null)
  )
);

create index tarefas_user_id_idx on tarefas (user_id);
create index tarefas_secao_id_idx on tarefas (secao_id);

create table etapas_tarefa (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references tarefas (id) on delete cascade,
  titulo text not null,
  ordem smallint not null default 0,
  concluida boolean not null default false
);

create index etapas_tarefa_tarefa_id_idx on etapas_tarefa (tarefa_id);

alter table rendas_mensais
  add constraint rendas_mensais_origem_tarefa_fk
  foreign key (origem_tarefa_id) references tarefas (id) on delete set null;

-- =========================================================================
-- Anotar
-- =========================================================================

create table notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  conteudo text not null default '',
  badges text[] not null default '{}',
  pos_x double precision,
  pos_y double precision,
  created_at timestamptz not null default now(),
  constraint notas_badges_validas check (badges <@ array['wishlist', 'tarefas', 'criar']::text[])
);

create index notas_user_id_idx on notas (user_id);

create table conexoes_notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nota_origem_id uuid not null references notas (id) on delete cascade,
  nota_destino_id uuid not null references notas (id) on delete cascade,
  constraint conexoes_notas_sem_auto_loop check (nota_origem_id <> nota_destino_id),
  unique (nota_origem_id, nota_destino_id)
);

create index conexoes_notas_user_id_idx on conexoes_notas (user_id);

alter table relatorios
  add constraint relatorios_nota_conectada_fk
  foreign key (nota_conectada_id) references notas (id) on delete set null;

-- =========================================================================
-- Row Level Security — políticas padrão (dono do registro via auth.uid())
-- =========================================================================

-- Tabelas com user_id direto
do $$
declare
  t text;
begin
  foreach t in array array[
    'planetas', 'itens_wishlist', 'rendas_mensais', 'modalidades_gasto',
    'gastos', 'secoes_tarefas', 'tarefas', 'notas', 'conexoes_notas'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "%s_owner" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t
    );
  end loop;
end $$;

-- Tabelas filhas de planetas (dono via join)
alter table relatorios enable row level security;
create policy "relatorios_owner" on relatorios for all
  using (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()))
  with check (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()));

alter table recursos enable row level security;
create policy "recursos_owner" on recursos for all
  using (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()))
  with check (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()));

alter table fotos enable row level security;
create policy "fotos_owner" on fotos for all
  using (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()))
  with check (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()));

alter table eventos enable row level security;
create policy "eventos_owner" on eventos for all
  using (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()))
  with check (exists (select 1 from planetas p where p.id = planeta_id and p.user_id = auth.uid()));

-- Tabelas netas (dono via evento -> planeta, ou tarefa -> user_id)
alter table checklist_itens_evento enable row level security;
create policy "checklist_itens_evento_owner" on checklist_itens_evento for all
  using (exists (
    select 1 from eventos e join planetas p on p.id = e.planeta_id
    where e.id = evento_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from eventos e join planetas p on p.id = e.planeta_id
    where e.id = evento_id and p.user_id = auth.uid()
  ));

alter table etapas_tarefa enable row level security;
create policy "etapas_tarefa_owner" on etapas_tarefa for all
  using (exists (select 1 from tarefas t where t.id = tarefa_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tarefas t where t.id = tarefa_id and t.user_id = auth.uid()));

-- =========================================================================
-- Novo usuário: cria perfil + seção "Geral" + modalidade "Wishlist"
-- =========================================================================

create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', new.email));

  insert into public.secoes_tarefas (user_id, nome, cor, ordem, fixa, ordenacao)
  values (new.id, 'Geral', '#5b7fff', 0, true, 'personalizado');

  insert into public.modalidades_gasto (user_id, nome, cor, fixa, ordem)
  values (new.id, 'Wishlist', '#e0b64c', true, 0);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
