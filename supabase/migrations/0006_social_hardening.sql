-- Fase 5.1 — endurecimento do contrato social.
-- Mantém a migration 0005 intacta caso ela já tenha sido aplicada remotamente.

-- Exposição de conteúdo é opt-in. A 0005 criou as colunas como true, mas ainda
-- não havia interface para alguém ter escolhido isso conscientemente.
alter table profiles alter column mostrar_planeta_favorito set default false;
alter table profiles alter column mostrar_meta_principal set default false;
alter table profiles alter column mostrar_eventos set default false;
alter table profiles alter column mostrar_wishlist set default false;
alter table profiles alter column mostrar_streak set default false;

update profiles set
  mostrar_planeta_favorito = false,
  mostrar_meta_principal = false,
  mostrar_eventos = false,
  mostrar_wishlist = false,
  mostrar_streak = false;

-- O destinatário só pode responder ao pedido; não pode trocar os participantes.
drop policy if exists "amizades_update_destinatario" on amizades;
create policy "amizades_update_destinatario" on amizades for update
  using (auth.uid() = destinatario_id and status = 'pendente')
  with check (
    auth.uid() = destinatario_id
    and status in ('aceita', 'recusada')
    and respondida_em is not null
  );

-- Funções auxiliares não são APIs públicas. As RPCs explicitamente liberadas
-- abaixo continuam sendo as únicas portas sociais além das tabelas com RLS.
revoke execute on function ha_bloqueio(uuid, uuid) from public, anon, authenticated;
revoke execute on function sao_amigos(uuid, uuid) from public, anon, authenticated;
revoke execute on function pode_ver_perfil(uuid) from public, anon, authenticated;
revoke execute on function pode_ver_postagem(uuid) from public, anon, authenticated;

-- Impede curingas SQL do chamador de ampliarem a busca por handle.
create or replace function buscar_por_handle(termo text)
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
    and p.handle like replace(replace(lower(trim(termo)), '%', '\\%'), '_', '\\_') || '%' escape '\\'
    and not ha_bloqueio(auth.uid(), p.id)
  order by p.handle
  limit 10;
$$;

revoke execute on function buscar_por_handle(text) from public, anon;
grant execute on function buscar_por_handle(text) to authenticated;

-- Responder pedido numa RPC evita que o cliente precise controlar colunas da relação.
create or replace function responder_amizade(p_amizade_id uuid, p_aceitar boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update amizades
  set status = case when p_aceitar then 'aceita'::status_amizade else 'recusada'::status_amizade end,
      respondida_em = now()
  where id = p_amizade_id
    and destinatario_id = auth.uid()
    and status = 'pendente';

  if not found then
    raise exception 'Pedido de amizade não encontrado ou já respondido';
  end if;
end;
$$;

revoke execute on function responder_amizade(uuid, boolean) from public, anon;
grant execute on function responder_amizade(uuid, boolean) to authenticated;
