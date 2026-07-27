-- Fase 5.2 — streak, um congelamento automático por semana e ranking de amigos.
-- Atividades válidas: relatório criado, tarefa concluída e evento/meta concluído.

alter table profiles
  add column fuso_horario text not null default 'America/Fortaleza';

create type tipo_atividade_streak as enum ('relatorio', 'tarefa', 'evento');

create table atividades_streak (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  tipo tipo_atividade_streak not null,
  referencia_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, tipo, referencia_id)
);

create index atividades_streak_user_dia_idx
  on atividades_streak (user_id, dia desc);

alter table atividades_streak enable row level security;

-- O cliente só lê o próprio histórico. Escrita acontece exclusivamente via triggers.
create policy "atividades_streak_select_own" on atividades_streak for select
  using (auth.uid() = user_id);

create function app_private.dia_local(p_user_id uuid, p_instante timestamptz)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (p_instante at time zone coalesce(
    (select fuso_horario from profiles where id = p_user_id),
    'America/Fortaleza'
  ))::date;
$$;

create function app_private.on_relatorio_streak()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare dono uuid;
begin
  select user_id into dono from planetas where id = new.planeta_id;
  insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
  values (dono, app_private.dia_local(dono, new.created_at), 'relatorio', new.id, new.created_at)
  on conflict (user_id, tipo, referencia_id) do nothing;
  return new;
end;
$$;

create trigger relatorios_registra_streak
  after insert on relatorios
  for each row execute function app_private.on_relatorio_streak();

create function app_private.on_tarefa_streak()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  if new.concluida_at is not null and (tg_op = 'INSERT' or old.concluida_at is null) then
    insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
    values (new.user_id, app_private.dia_local(new.user_id, new.concluida_at), 'tarefa', new.id, new.concluida_at)
    on conflict (user_id, tipo, referencia_id) do update
      set dia = excluded.dia, created_at = excluded.created_at;
  elsif tg_op = 'UPDATE' and new.concluida_at is null and old.concluida_at is not null then
    delete from atividades_streak
    where user_id = new.user_id and tipo = 'tarefa' and referencia_id = new.id;
  end if;
  return new;
end;
$$;

create trigger tarefas_registra_streak
  after insert or update of concluida_at on tarefas
  for each row execute function app_private.on_tarefa_streak();

create function app_private.on_evento_streak()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare dono uuid;
begin
  select user_id into dono from planetas where id = new.planeta_id;
  if new.status = 'concluido' and (tg_op = 'INSERT' or old.status <> 'concluido') then
    insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
    values (
      dono,
      app_private.dia_local(dono, coalesce(new.concluido_em, now())),
      'evento', new.id, coalesce(new.concluido_em, now())
    )
    on conflict (user_id, tipo, referencia_id) do update
      set dia = excluded.dia, created_at = excluded.created_at;
  elsif tg_op = 'UPDATE' and new.status <> 'concluido' and old.status = 'concluido' then
    delete from atividades_streak
    where user_id = dono and tipo = 'evento' and referencia_id = new.id;
  end if;
  return new;
end;
$$;

create trigger eventos_registra_streak
  after insert or update of status on eventos
  for each row execute function app_private.on_evento_streak();

-- Retroativo: atividades já existentes também entram no placar.
insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
select p.user_id, app_private.dia_local(p.user_id, r.created_at), 'relatorio', r.id, r.created_at
from relatorios r join planetas p on p.id = r.planeta_id
on conflict (user_id, tipo, referencia_id) do nothing;

insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
select t.user_id, app_private.dia_local(t.user_id, t.concluida_at), 'tarefa', t.id, t.concluida_at
from tarefas t where t.concluida_at is not null
on conflict (user_id, tipo, referencia_id) do nothing;

insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
select p.user_id, app_private.dia_local(p.user_id, coalesce(e.concluido_em, e.created_at)),
       'evento', e.id, coalesce(e.concluido_em, e.created_at)
from eventos e join planetas p on p.id = e.planeta_id
where e.status = 'concluido'
on conflict (user_id, tipo, referencia_id) do nothing;

create type app_private.streak_resultado as (
  atual integer,
  recorde integer,
  ativos_7d integer,
  congelamentos_usados integer,
  congelamento_disponivel boolean,
  ativo_hoje boolean
);

create function app_private.calcular_streak(p_user_id uuid)
returns app_private.streak_resultado
language plpgsql
stable
security definer
set search_path = public, app_private
as $$
declare
  hoje date := app_private.dia_local(p_user_id, now());
  cursor_dia date;
  primeiro_dia date;
  semana text;
  semanas_usadas text[] := '{}';
  atual integer := 0;
  recorde integer := 0;
  sequencia integer := 0;
  semana_recorde text := null;
  congelou_na_semana boolean := false;
  congelamentos integer := 0;
  tem_atividade boolean;
  ativo_hoje boolean;
  ativos_7d integer;
begin
  select exists(select 1 from atividades_streak where user_id = p_user_id and dia = hoje)
    into ativo_hoje;
  select count(distinct dia) from atividades_streak
    where user_id = p_user_id and dia between hoje - 6 and hoje
    into ativos_7d;
  select min(dia) from atividades_streak where user_id = p_user_id into primeiro_dia;

  if primeiro_dia is null then
    return (0, 0, 0, 0, true, false)::app_private.streak_resultado;
  end if;

  -- Streak atual. O dia de hoje ainda não terminado não consome congelamento.
  cursor_dia := case when ativo_hoje then hoje else hoje - 1 end;
  while cursor_dia >= primeiro_dia loop
    select exists(select 1 from atividades_streak where user_id = p_user_id and dia = cursor_dia)
      into tem_atividade;
    if tem_atividade then
      atual := atual + 1;
    else
      semana := to_char(cursor_dia, 'IYYY-IW');
      if not (semana = any(semanas_usadas)) then
        semanas_usadas := array_append(semanas_usadas, semana);
        congelamentos := congelamentos + 1;
      else
        exit;
      end if;
    end if;
    cursor_dia := cursor_dia - 1;
  end loop;

  -- Recorde histórico: uma ausência por semana preserva, a segunda reinicia.
  cursor_dia := primeiro_dia;
  while cursor_dia <= hoje loop
    semana := to_char(cursor_dia, 'IYYY-IW');
    if semana_recorde is distinct from semana then
      semana_recorde := semana;
      congelou_na_semana := false;
    end if;
    select exists(select 1 from atividades_streak where user_id = p_user_id and dia = cursor_dia)
      into tem_atividade;
    if tem_atividade then
      sequencia := sequencia + 1;
      recorde := greatest(recorde, sequencia);
    elsif not congelou_na_semana then
      congelou_na_semana := true;
    else
      sequencia := 0;
      congelou_na_semana := true;
    end if;
    cursor_dia := cursor_dia + 1;
  end loop;

  return (
    atual,
    recorde,
    ativos_7d,
    congelamentos,
    not (to_char(hoje, 'IYYY-IW') = any(semanas_usadas)),
    ativo_hoje
  )::app_private.streak_resultado;
end;
$$;

create function public.meu_streak()
returns jsonb
language sql
stable
security definer
set search_path = public, app_private
as $$
  select jsonb_build_object(
    'atual', s.atual,
    'recorde', s.recorde,
    'ativos_7d', s.ativos_7d,
    'congelamentos_usados', s.congelamentos_usados,
    'congelamento_disponivel', s.congelamento_disponivel,
    'ativo_hoje', s.ativo_hoje
  )
  from app_private.calcular_streak(auth.uid()) s;
$$;

create function public.ranking_streak()
returns table (
  user_id uuid,
  nome text,
  handle text,
  avatar_url text,
  atual integer,
  recorde integer,
  ativos_7d integer,
  eu boolean
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  with participantes as (
    select p.id, p.nome, p.handle, p.avatar_url
    from profiles p
    where p.id = auth.uid()
       or (p.mostrar_streak and app_private.sao_amigos(auth.uid(), p.id))
  )
  select p.id, p.nome, p.handle, p.avatar_url,
         s.atual, s.recorde, s.ativos_7d, p.id = auth.uid()
  from participantes p
  cross join lateral app_private.calcular_streak(p.id) s
  order by s.atual desc, s.ativos_7d desc, p.nome
  limit 100;
$$;

revoke execute on function public.meu_streak() from public, anon;
revoke execute on function public.ranking_streak() from public, anon;
grant execute on function public.meu_streak() to authenticated;
grant execute on function public.ranking_streak() to authenticated;

revoke all on function app_private.dia_local(uuid, timestamptz) from public, anon;
revoke all on function app_private.calcular_streak(uuid) from public, anon;
grant execute on function app_private.dia_local(uuid, timestamptz) to authenticated;
grant execute on function app_private.calcular_streak(uuid) to authenticated;

notify pgrst, 'reload schema';
