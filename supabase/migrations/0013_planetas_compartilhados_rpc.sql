-- Fase 5.4 — convites e preferências individuais de planetas compartilhados.

create function public.convidar_membro_planeta(p_planeta_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare titulo text;
begin
  if not app_private.eh_dono_planeta(p_planeta_id, auth.uid()) then
    raise exception 'Apenas o dono pode convidar membros';
  end if;
  if not app_private.sao_amigos(auth.uid(), p_user_id) then
    raise exception 'Convide apenas pessoas da sua órbita';
  end if;
  if p_user_id = auth.uid() then raise exception 'Você já participa deste planeta'; end if;

  select nome into titulo from planetas where id = p_planeta_id;
  insert into planeta_membros (planeta_id, user_id, papel, status, meta_semanal, convidado_por)
  values (p_planeta_id, p_user_id, 'membro', 'pendente', 3, auth.uid())
  on conflict (planeta_id, user_id) do update
    set status = 'pendente', convidado_por = auth.uid(), respondido_em = null
    where planeta_membros.status <> 'aceito';

  perform notificar(
    p_user_id, auth.uid(), 'planeta_convite',
    jsonb_build_object('planeta_id', p_planeta_id, 'titulo', titulo)
  );
end;
$$;

create function public.responder_convite_planeta(p_planeta_id uuid, p_aceitar boolean)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare dono uuid;
begin
  if p_aceitar then
    update planeta_membros
      set status = 'aceito', respondido_em = now()
      where planeta_id = p_planeta_id and user_id = auth.uid() and status = 'pendente';
  else
    delete from planeta_membros
      where planeta_id = p_planeta_id and user_id = auth.uid() and status = 'pendente';
  end if;
  if not found then raise exception 'Convite não encontrado ou já respondido'; end if;

  if p_aceitar then
    select user_id into dono from planetas where id = p_planeta_id;
    perform notificar(dono, auth.uid(), 'planeta_aceito', jsonb_build_object('planeta_id', p_planeta_id));
  end if;
end;
$$;

create function public.atualizar_meta_membro_planeta(p_planeta_id uuid, p_meta_semanal smallint)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  if p_meta_semanal not between 1 and 7 then raise exception 'Meta deve ficar entre 1 e 7'; end if;
  update planeta_membros set meta_semanal = p_meta_semanal
    where planeta_id = p_planeta_id and user_id = auth.uid() and status = 'aceito';
  if not found then raise exception 'Você não participa deste planeta'; end if;
end;
$$;

revoke execute on function public.convidar_membro_planeta(uuid, uuid) from public, anon;
revoke execute on function public.responder_convite_planeta(uuid, boolean) from public, anon;
revoke execute on function public.atualizar_meta_membro_planeta(uuid, smallint) from public, anon;
grant execute on function public.convidar_membro_planeta(uuid, uuid) to authenticated;
grant execute on function public.responder_convite_planeta(uuid, boolean) to authenticated;
grant execute on function public.atualizar_meta_membro_planeta(uuid, smallint) to authenticated;

notify pgrst, 'reload schema';
