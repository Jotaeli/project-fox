-- Fase 5.3 — operações atômicas, notificações e conclusão de desafios.

create function public.criar_desafio(
  p_titulo text,
  p_descricao text,
  p_icone text,
  p_cor text,
  p_prazo date,
  p_objetivos jsonb,
  p_convidados uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  novo_id uuid;
  convidado uuid;
  item jsonb;
  pos smallint := 0;
begin
  if trim(coalesce(p_titulo, '')) = '' then raise exception 'Título é obrigatório'; end if;
  if jsonb_typeof(p_objetivos) <> 'array' or jsonb_array_length(p_objetivos) = 0 then
    raise exception 'Adicione ao menos um objetivo';
  end if;
  if coalesce(array_length(p_convidados, 1), 0) = 0 then
    raise exception 'Convide ao menos um amigo';
  end if;
  if exists (
    select 1 from unnest(p_convidados) u
    where u = auth.uid() or not app_private.sao_amigos(auth.uid(), u)
  ) then raise exception 'Todos os convidados precisam ser seus amigos'; end if;

  insert into desafios (criador_id, titulo, descricao, icone, cor, prazo)
  values (auth.uid(), trim(p_titulo), nullif(trim(coalesce(p_descricao, '')), ''),
          coalesce(nullif(p_icone, ''), 'alvo'), coalesce(nullif(p_cor, ''), '#7c72e8'), p_prazo)
  returning id into novo_id;

  insert into desafio_participantes (desafio_id, user_id, status, convidado_por, respondido_em)
  values (novo_id, auth.uid(), 'aceito', auth.uid(), now());

  for item in select value from jsonb_array_elements(p_objetivos) loop
    if trim(coalesce(item #>> '{}', '')) <> '' then
      insert into desafio_objetivos (desafio_id, titulo, ordem)
      values (novo_id, trim(item #>> '{}'), pos);
      pos := pos + 1;
    end if;
  end loop;
  if pos = 0 then raise exception 'Adicione ao menos um objetivo válido'; end if;

  foreach convidado in array p_convidados loop
    insert into desafio_participantes (desafio_id, user_id, status, convidado_por)
    values (novo_id, convidado, 'pendente', auth.uid());
    perform notificar(
      convidado, auth.uid(), 'desafio_convite',
      jsonb_build_object('desafio_id', novo_id, 'titulo', trim(p_titulo))
    );
  end loop;
  return novo_id;
end;
$$;

create function public.responder_desafio(p_desafio_id uuid, p_aceitar boolean)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare criador uuid;
begin
  update desafio_participantes
  set status = case when p_aceitar then 'aceito'::status_participante_desafio else 'recusado'::status_participante_desafio end,
      respondido_em = now()
  where desafio_id = p_desafio_id and user_id = auth.uid() and status = 'pendente';
  if not found then raise exception 'Convite não encontrado ou já respondido'; end if;

  if p_aceitar then
    select criador_id into criador from desafios where id = p_desafio_id;
    perform notificar(
      criador, auth.uid(), 'desafio_aceito',
      jsonb_build_object('desafio_id', p_desafio_id)
    );
  end if;
end;
$$;

create function public.comprovar_objetivo_desafio(p_objetivo_id uuid, p_relatorio_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  desafio uuid;
  todos_meus boolean;
  todos_grupo boolean;
  criador uuid;
begin
  select o.desafio_id into desafio from desafio_objetivos o where o.id = p_objetivo_id;
  if desafio is null or not exists (
    select 1 from desafio_participantes
    where desafio_id = desafio and user_id = auth.uid() and status = 'aceito'
  ) then raise exception 'Você não participa deste desafio'; end if;

  if not exists (
    select 1 from relatorios r join planetas p on p.id = r.planeta_id
    where r.id = p_relatorio_id and p.user_id = auth.uid()
  ) then raise exception 'Relatório inválido'; end if;

  insert into desafio_progresso (objetivo_id, user_id, relatorio_id)
  values (p_objetivo_id, auth.uid(), p_relatorio_id)
  on conflict (objetivo_id, user_id) do update
    set relatorio_id = excluded.relatorio_id, comprovado_em = now();

  select not exists (
    select 1 from desafio_objetivos o
    where o.desafio_id = desafio
      and not exists (
        select 1 from desafio_progresso pr
        where pr.objetivo_id = o.id and pr.user_id = auth.uid()
      )
  ) into todos_meus;

  if todos_meus then
    update desafio_participantes set concluido_em = coalesce(concluido_em, now())
    where desafio_id = desafio and user_id = auth.uid();
  end if;

  select not exists (
    select 1 from desafio_participantes dp
    where dp.desafio_id = desafio and dp.status = 'aceito' and dp.concluido_em is null
  ) and not exists (
    select 1 from desafio_participantes dp
    where dp.desafio_id = desafio and dp.status = 'pendente'
  ) into todos_grupo;

  if todos_grupo then
    update desafios set status = 'concluido', concluido_em = now()
    where id = desafio and status = 'ativo';
    select criador_id into criador from desafios where id = desafio;
    insert into notificacoes (user_id, ator_id, tipo, payload)
    select dp.user_id, auth.uid(), 'desafio_concluido', jsonb_build_object('desafio_id', desafio)
    from desafio_participantes dp
    where dp.desafio_id = desafio and dp.user_id <> auth.uid() and dp.status = 'aceito';
  end if;
  return todos_meus;
end;
$$;

create function public.atualizar_desafios_vencidos()
returns integer
language plpgsql
security definer
set search_path = public, app_private
as $$
declare quantidade integer;
begin
  update desafios d set status = 'falha', falhou_em = now()
  where d.status = 'ativo' and d.prazo < current_date
    and app_private.participa_desafio(d.id, auth.uid());
  get diagnostics quantidade = row_count;
  return quantidade;
end;
$$;

revoke execute on function public.criar_desafio(text,text,text,text,date,jsonb,uuid[]) from public, anon;
revoke execute on function public.responder_desafio(uuid,boolean) from public, anon;
revoke execute on function public.comprovar_objetivo_desafio(uuid,uuid) from public, anon;
revoke execute on function public.atualizar_desafios_vencidos() from public, anon;
grant execute on function public.criar_desafio(text,text,text,text,date,jsonb,uuid[]) to authenticated;
grant execute on function public.responder_desafio(uuid,boolean) to authenticated;
grant execute on function public.comprovar_objetivo_desafio(uuid,uuid) to authenticated;
grant execute on function public.atualizar_desafios_vencidos() to authenticated;

notify pgrst, 'reload schema';
