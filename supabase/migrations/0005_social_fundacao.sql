-- Fase 5.1 — Fundação social: amizades, bloqueios, perfil público, postagens, reações, cutucadas
--
-- Princípios:
--   1. O RLS "dono único" das tabelas de domínio (planetas, tarefas, notas...) NÃO é alterado aqui.
--      A visibilidade do perfil de um amigo passa pela RPC `perfil_publico`, que concentra toda a
--      lógica de privacidade num único lugar.
--   2. Toda checagem de relação usada dentro de policy vive numa função `security definer`, para
--      não disparar o RLS da tabela consultada (evita recursão entre policies).
--   3. Nada é público por padrão: exposição é sempre opt-in via flags em `profiles`.

-- =========================================================================
-- Bloqueios — base de tudo, consultado por todas as demais checagens
-- =========================================================================

create table bloqueios (
  bloqueador_id uuid not null references auth.users (id) on delete cascade,
  bloqueado_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  constraint bloqueios_sem_auto_bloqueio check (bloqueador_id <> bloqueado_id)
);

create index bloqueios_bloqueado_id_idx on bloqueios (bloqueado_id);

alter table bloqueios enable row level security;

create policy "bloqueios_owner" on bloqueios for all
  using (auth.uid() = bloqueador_id)
  with check (auth.uid() = bloqueador_id);

-- Bloqueio é bidirecional em efeito: se qualquer um dos dois bloqueou, some tudo.
create function ha_bloqueio(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from bloqueios
    where (bloqueador_id = a and bloqueado_id = b)
       or (bloqueador_id = b and bloqueado_id = a)
  );
$$;

-- =========================================================================
-- Amizades
-- =========================================================================

create type status_amizade as enum ('pendente', 'aceita', 'recusada');

create table amizades (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references auth.users (id) on delete cascade,
  destinatario_id uuid not null references auth.users (id) on delete cascade,
  status status_amizade not null default 'pendente',
  created_at timestamptz not null default now(),
  respondida_em timestamptz,
  constraint amizades_sem_auto_amizade check (solicitante_id <> destinatario_id)
);

-- Um par de usuários tem no máximo uma linha, em qualquer direção.
create unique index amizades_par_unico_idx on amizades (
  least(solicitante_id, destinatario_id),
  greatest(solicitante_id, destinatario_id)
);

create index amizades_destinatario_idx on amizades (destinatario_id, status);
create index amizades_solicitante_idx on amizades (solicitante_id, status);

alter table amizades enable row level security;

create policy "amizades_select_participante" on amizades for select
  using (auth.uid() in (solicitante_id, destinatario_id));

create policy "amizades_insert_solicitante" on amizades for insert
  with check (
    auth.uid() = solicitante_id
    and status = 'pendente'
    and not ha_bloqueio(solicitante_id, destinatario_id)
  );

-- Só o destinatário aceita/recusa.
create policy "amizades_update_destinatario" on amizades for update
  using (auth.uid() = destinatario_id)
  with check (auth.uid() = destinatario_id);

-- Qualquer um dos dois desfaz (cancelar pedido ou desfazer amizade).
create policy "amizades_delete_participante" on amizades for delete
  using (auth.uid() in (solicitante_id, destinatario_id));

create function sao_amigos(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from amizades
    where status = 'aceita'
      and (
        (solicitante_id = a and destinatario_id = b)
        or (solicitante_id = b and destinatario_id = a)
      )
  ) and not ha_bloqueio(a, b);
$$;

-- Perfil é visível para: você mesmo, amigos, e quem tem pedido pendente com você
-- (senão não daria pra ver quem te mandou solicitação).
create function pode_ver_perfil(alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = alvo
    or (
      not ha_bloqueio(auth.uid(), alvo)
      and (
        sao_amigos(auth.uid(), alvo)
        or exists (
          select 1 from amizades
          where status = 'pendente'
            and (
              (solicitante_id = auth.uid() and destinatario_id = alvo)
              or (solicitante_id = alvo and destinatario_id = auth.uid())
            )
        )
      )
    );
$$;

-- =========================================================================
-- Perfis — identidade social + flags de privacidade
-- =========================================================================

alter table profiles
  add column handle text unique,
  add column avatar_url text,
  add column bio text,
  add column descobrivel boolean not null default true,
  add column aceita_cutucadas boolean not null default true,
  add column planeta_favorito_id uuid references planetas (id) on delete set null,
  add column mostrar_planeta_favorito boolean not null default true,
  add column mostrar_meta_principal boolean not null default true,
  add column mostrar_eventos boolean not null default true,
  add column mostrar_wishlist boolean not null default true,
  add column mostrar_streak boolean not null default true,
  add constraint profiles_handle_formato check (handle ~ '^[a-z0-9_]{3,20}$');

-- A policy antiga só permitia ler o próprio perfil.
drop policy "profiles_select_own" on profiles;

create policy "profiles_select_visivel" on profiles for select
  using (pode_ver_perfil(id));

-- Busca por handle: única porta para descobrir alguém que ainda não é amigo.
-- Retorna apenas o cartão mínimo, e só de quem se marcou como descobrível.
create function buscar_por_handle(termo text)
returns table (id uuid, nome text, handle text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome, p.handle, p.avatar_url
  from profiles p
  where p.handle is not null
    and p.descobrivel
    and p.id <> auth.uid()
    and p.handle like lower(trim(termo)) || '%'
    and not ha_bloqueio(auth.uid(), p.id)
  order by p.handle
  limit 10;
$$;

revoke execute on function buscar_por_handle(text) from public, anon;
grant execute on function buscar_por_handle(text) to authenticated;

-- =========================================================================
-- Postagens
-- =========================================================================

create type visibilidade_postagem as enum ('privado', 'amigos', 'publico');

create type tipo_postagem as enum (
  'texto',
  'evento_concluido',
  'planeta_criado',
  'marco_relatorios',
  'wishlist_comprado',
  'marco_streak',
  'desafio_vencido'
);

create table postagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo tipo_postagem not null default 'texto',
  texto text,
  visibilidade visibilidade_postagem not null default 'amigos',
  planeta_id uuid references planetas (id) on delete set null,
  evento_id uuid references eventos (id) on delete set null,
  nota_id uuid references notas (id) on delete set null,
  item_wishlist_id uuid references itens_wishlist (id) on delete set null,
  -- Snapshot do marco no momento da publicação (título, cor, ícone, contagem…).
  -- Congelado de propósito: a postagem não deve mudar se o planeta for editado depois.
  dados jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index postagens_user_id_created_idx on postagens (user_id, created_at desc);

alter table postagens enable row level security;

create policy "postagens_select_visivel" on postagens for select
  using (
    auth.uid() = user_id
    or (
      not ha_bloqueio(auth.uid(), user_id)
      and (
        visibilidade = 'publico'
        or (visibilidade = 'amigos' and sao_amigos(auth.uid(), user_id))
      )
    )
  );

create policy "postagens_insert_own" on postagens for insert
  with check (auth.uid() = user_id);

create policy "postagens_update_own" on postagens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "postagens_delete_own" on postagens for delete
  using (auth.uid() = user_id);

create function pode_ver_postagem(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from postagens p
    where p.id = p_id
      and (
        p.user_id = auth.uid()
        or (
          not ha_bloqueio(auth.uid(), p.user_id)
          and (
            p.visibilidade = 'publico'
            or (p.visibilidade = 'amigos' and sao_amigos(auth.uid(), p.user_id))
          )
        )
      )
  );
$$;

-- =========================================================================
-- Reações — ícones de linha do banco próprio, sem emoji colorido
-- =========================================================================

create type tipo_reacao as enum ('faisca', 'foguete', 'chama', 'alvo', 'aplauso');

create table reacoes (
  id uuid primary key default gen_random_uuid(),
  postagem_id uuid not null references postagens (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo tipo_reacao not null,
  created_at timestamptz not null default now(),
  unique (postagem_id, user_id)
);

create index reacoes_postagem_id_idx on reacoes (postagem_id);

alter table reacoes enable row level security;

create policy "reacoes_select_visivel" on reacoes for select
  using (pode_ver_postagem(postagem_id));

create policy "reacoes_insert_own" on reacoes for insert
  with check (auth.uid() = user_id and pode_ver_postagem(postagem_id));

create policy "reacoes_update_own" on reacoes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reacoes_delete_own" on reacoes for delete
  using (auth.uid() = user_id);

-- =========================================================================
-- Cutucadas — 1 por alvo por dia, só entre amigos, só se o alvo aceitar
-- =========================================================================

create type contexto_cutucada as enum ('perfil', 'planeta', 'evento', 'streak');

create table cutucadas (
  id uuid primary key default gen_random_uuid(),
  de_id uuid not null references auth.users (id) on delete cascade,
  para_id uuid not null references auth.users (id) on delete cascade,
  contexto contexto_cutucada not null default 'perfil',
  planeta_id uuid references planetas (id) on delete cascade,
  evento_id uuid references eventos (id) on delete cascade,
  -- Motivo gerado pelo app ("3 dias sem relatório"), congelado no envio.
  motivo text,
  created_at timestamptz not null default now(),
  dia date not null default (now() at time zone 'utc')::date,
  constraint cutucadas_sem_auto_cutucada check (de_id <> para_id),
  unique (de_id, para_id, dia)
);

create index cutucadas_para_id_idx on cutucadas (para_id, created_at desc);

alter table cutucadas enable row level security;

create policy "cutucadas_select_participante" on cutucadas for select
  using (auth.uid() in (de_id, para_id));

create policy "cutucadas_insert_amigo" on cutucadas for insert
  with check (
    auth.uid() = de_id
    and sao_amigos(de_id, para_id)
    and exists (select 1 from profiles p where p.id = para_id and p.aceita_cutucadas)
  );

-- =========================================================================
-- Notificações — escritas apenas por trigger (sem policy de insert = cliente não escreve)
-- =========================================================================

create type tipo_notificacao as enum (
  'amizade_pedido',
  'amizade_aceita',
  'cutucada',
  'reacao'
);

create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ator_id uuid references auth.users (id) on delete cascade,
  tipo tipo_notificacao not null,
  payload jsonb not null default '{}',
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create index notificacoes_user_id_idx on notificacoes (user_id, lida, created_at desc);

alter table notificacoes enable row level security;

create policy "notificacoes_select_own" on notificacoes for select
  using (auth.uid() = user_id);

-- Marcar como lida.
create policy "notificacoes_update_own" on notificacoes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notificacoes_delete_own" on notificacoes for delete
  using (auth.uid() = user_id);

create function notificar(
  p_user_id uuid,
  p_ator_id uuid,
  p_tipo tipo_notificacao,
  p_payload jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id = p_ator_id then
    return;
  end if;
  insert into notificacoes (user_id, ator_id, tipo, payload)
  values (p_user_id, p_ator_id, p_tipo, p_payload);
end;
$$;

revoke execute on function notificar(uuid, uuid, tipo_notificacao, jsonb) from public, anon, authenticated;

create function on_amizade_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform notificar(new.destinatario_id, new.solicitante_id, 'amizade_pedido', '{}'::jsonb);
  elsif tg_op = 'UPDATE' and new.status = 'aceita' and old.status <> 'aceita' then
    perform notificar(new.solicitante_id, new.destinatario_id, 'amizade_aceita', '{}'::jsonb);
  end if;
  return new;
end;
$$;

create trigger amizades_notifica
  after insert or update on amizades
  for each row execute function on_amizade_change();

create function on_cutucada_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform notificar(
    new.para_id,
    new.de_id,
    'cutucada',
    jsonb_build_object('contexto', new.contexto, 'motivo', new.motivo, 'planeta_id', new.planeta_id)
  );
  return new;
end;
$$;

create trigger cutucadas_notifica
  after insert on cutucadas
  for each row execute function on_cutucada_insert();

create function on_reacao_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dono uuid;
begin
  select user_id into dono from postagens where id = new.postagem_id;
  perform notificar(
    dono,
    new.user_id,
    'reacao',
    jsonb_build_object('postagem_id', new.postagem_id, 'tipo', new.tipo)
  );
  return new;
end;
$$;

create trigger reacoes_notifica
  after insert on reacoes
  for each row execute function on_reacao_insert();

-- =========================================================================
-- Perfil público — única porta de leitura do conteúdo de um amigo.
-- Concentra a privacidade aqui em vez de afrouxar o RLS de 6 tabelas.
-- =========================================================================

create function perfil_publico(alvo uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p profiles;
  eh_dono boolean := (auth.uid() = alvo);
  resultado jsonb;
begin
  if not pode_ver_perfil(alvo) then
    return null;
  end if;

  select * into p from profiles where id = alvo;
  if not found then
    return null;
  end if;

  resultado := jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'handle', p.handle,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'desde', p.created_at,
    'eh_amigo', sao_amigos(auth.uid(), alvo),
    'aceita_cutucadas', p.aceita_cutucadas
  );

  -- Planeta favorito
  if (eh_dono or p.mostrar_planeta_favorito) and p.planeta_favorito_id is not null then
    resultado := resultado || jsonb_build_object(
      'planeta_favorito',
      (select to_jsonb(x) from (
        select pl.id, pl.nome, pl.cor, pl.tipo, pl.objetivo_principal, pl.descricao, pl.meta_semanal
        from planetas pl where pl.id = p.planeta_favorito_id
      ) x)
    );
  end if;

  -- Meta principal = evento ativo com prazo mais próximo, com progresso do checklist
  if eh_dono or p.mostrar_meta_principal then
    resultado := resultado || jsonb_build_object(
      'meta_principal',
      (select to_jsonb(x) from (
        select e.id, e.titulo, e.icone, e.cor, e.prazo, pl.nome as planeta_nome, pl.cor as planeta_cor,
               (select count(*) from checklist_itens_evento c where c.evento_id = e.id) as total,
               (select count(*) from checklist_itens_evento c where c.evento_id = e.id and c.comprovado) as comprovados
        from eventos e
        join planetas pl on pl.id = e.planeta_id
        where pl.user_id = alvo and e.status = 'ativo'
        order by e.prazo
        limit 1
      ) x)
    );
  end if;

  -- Eventos ativos
  if eh_dono or p.mostrar_eventos then
    resultado := resultado || jsonb_build_object(
      'eventos_ativos',
      coalesce((select jsonb_agg(to_jsonb(x)) from (
        select e.id, e.titulo, e.icone, e.cor, e.prazo, pl.nome as planeta_nome
        from eventos e
        join planetas pl on pl.id = e.planeta_id
        where pl.user_id = alvo and e.status = 'ativo'
        order by e.prazo
        limit 6
      ) x), '[]'::jsonb)
    );
  end if;

  -- Item principal da wishlist = tier mais alto, maior valor, ainda não comprado
  if eh_dono or p.mostrar_wishlist then
    resultado := resultado || jsonb_build_object(
      'wishlist_destaque',
      (select to_jsonb(x) from (
        select w.id, w.nome, w.valor, w.foto, w.tier, w.descricao, w.link
        from itens_wishlist w
        where w.user_id = alvo and not w.comprado
        order by w.tier, w.valor desc
        limit 1
      ) x)
    );
  end if;

  return resultado;
end;
$$;

revoke execute on function perfil_publico(uuid) from public, anon;
grant execute on function perfil_publico(uuid) to authenticated;

-- =========================================================================
-- Feed — postagens dos amigos + as próprias, mais recentes primeiro
-- =========================================================================

create function feed(limite int default 30, antes timestamptz default null)
returns table (
  id uuid,
  autor_id uuid,
  autor_nome text,
  autor_handle text,
  autor_avatar text,
  tipo tipo_postagem,
  texto text,
  dados jsonb,
  created_at timestamptz,
  reacoes jsonb,
  minha_reacao tipo_reacao
)
language sql
stable
security definer
set search_path = public
as $$
  select
    po.id,
    po.user_id,
    pr.nome,
    pr.handle,
    pr.avatar_url,
    po.tipo,
    po.texto,
    po.dados,
    po.created_at,
    coalesce((
      select jsonb_object_agg(t, n)
      from (select r.tipo::text as t, count(*) as n from reacoes r where r.postagem_id = po.id group by r.tipo) s
    ), '{}'::jsonb),
    (select r.tipo from reacoes r where r.postagem_id = po.id and r.user_id = auth.uid())
  from postagens po
  join profiles pr on pr.id = po.user_id
  where (po.user_id = auth.uid() or (sao_amigos(auth.uid(), po.user_id) and po.visibilidade <> 'privado'))
    and not ha_bloqueio(auth.uid(), po.user_id)
    and (antes is null or po.created_at < antes)
  order by po.created_at desc
  limit least(coalesce(limite, 30), 100);
$$;

revoke execute on function feed(int, timestamptz) from public, anon;
grant execute on function feed(int, timestamptz) to authenticated;

-- =========================================================================
-- Storage — avatares
-- Path convencionado: {user_id}/{filename}
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "avatares_public_read"
  on storage.objects for select
  using (bucket_id = 'avatares');

create policy "avatares_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatares_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatares_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
