-- Fase 5.5 — convites de espaços compartilhados.

create function public.convidar_membro_espaco_notas(p_espaco_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare titulo text;
begin
  if not app_private.eh_dono_espaco_notas(p_espaco_id, auth.uid()) then
    raise exception 'Apenas o dono pode convidar membros';
  end if;
  if not app_private.sao_amigos(auth.uid(), p_user_id) then
    raise exception 'Convide apenas pessoas da sua órbita';
  end if;
  if p_user_id = auth.uid() then raise exception 'Você já participa deste espaço'; end if;

  select nome into titulo from espacos_notas where id = p_espaco_id;
  insert into espaco_notas_membros (espaco_id, user_id, papel, status, convidado_por)
  values (p_espaco_id, p_user_id, 'membro', 'pendente', auth.uid())
  on conflict (espaco_id, user_id) do update
    set status = 'pendente', convidado_por = auth.uid(), respondido_em = null
    where espaco_notas_membros.status <> 'aceito';

  perform notificar(
    p_user_id, auth.uid(), 'espaco_notas_convite',
    jsonb_build_object('espaco_id', p_espaco_id, 'titulo', titulo)
  );
end;
$$;

create function public.responder_convite_espaco_notas(p_espaco_id uuid, p_aceitar boolean)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare dono uuid;
begin
  if p_aceitar then
    update espaco_notas_membros set status = 'aceito', respondido_em = now()
      where espaco_id = p_espaco_id and user_id = auth.uid() and status = 'pendente';
  else
    delete from espaco_notas_membros
      where espaco_id = p_espaco_id and user_id = auth.uid() and status = 'pendente';
  end if;
  if not found then raise exception 'Convite não encontrado ou já respondido'; end if;

  if p_aceitar then
    select owner_id into dono from espacos_notas where id = p_espaco_id;
    perform notificar(dono, auth.uid(), 'espaco_notas_aceito', jsonb_build_object('espaco_id', p_espaco_id));
  end if;
end;
$$;

revoke execute on function public.convidar_membro_espaco_notas(uuid, uuid) from public, anon;
revoke execute on function public.responder_convite_espaco_notas(uuid, boolean) from public, anon;
grant execute on function public.convidar_membro_espaco_notas(uuid, uuid) to authenticated;
grant execute on function public.responder_convite_espaco_notas(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
