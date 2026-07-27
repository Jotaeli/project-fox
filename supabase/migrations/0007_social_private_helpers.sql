-- Fase 5.1 — helpers de RLS fora do schema exposto pelo PostgREST.
--
-- Policies rodam como o usuário e precisam de EXECUTE nas funções que chamam.
-- A 0006 revogou esse direito para evitar RPC direta, o que também impediu as
-- próprias policies de funcionar. Manter os helpers num schema não exposto
-- resolve os dois lados: RLS pode executar, clientes não ganham endpoints RPC.

create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

alter function public.ha_bloqueio(uuid, uuid) set schema app_private;
alter function public.sao_amigos(uuid, uuid) set schema app_private;
alter function public.pode_ver_perfil(uuid) set schema app_private;
alter function public.pode_ver_postagem(uuid) set schema app_private;

alter function app_private.ha_bloqueio(uuid, uuid)
  set search_path = app_private, public;
alter function app_private.sao_amigos(uuid, uuid)
  set search_path = app_private, public;
alter function app_private.pode_ver_perfil(uuid)
  set search_path = app_private, public;
alter function app_private.pode_ver_postagem(uuid)
  set search_path = app_private, public;

revoke execute on function app_private.ha_bloqueio(uuid, uuid) from public, anon;
revoke execute on function app_private.sao_amigos(uuid, uuid) from public, anon;
revoke execute on function app_private.pode_ver_perfil(uuid) from public, anon;
revoke execute on function app_private.pode_ver_postagem(uuid) from public, anon;

grant execute on function app_private.ha_bloqueio(uuid, uuid) to authenticated;
grant execute on function app_private.sao_amigos(uuid, uuid) to authenticated;
grant execute on function app_private.pode_ver_perfil(uuid) to authenticated;
grant execute on function app_private.pode_ver_postagem(uuid) to authenticated;

-- RPCs públicas que usam os helpers precisam enxergar o schema privado em seu
-- search_path. O schema privado vem depois de public para manter as tabelas e
-- tipos resolvidos como antes.
alter function public.buscar_por_handle(text)
  set search_path = public, app_private;
alter function public.perfil_publico(uuid)
  set search_path = public, app_private;
alter function public.feed(int, timestamptz)
  set search_path = public, app_private;

notify pgrst, 'reload schema';
