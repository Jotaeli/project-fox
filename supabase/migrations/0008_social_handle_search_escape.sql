-- Fase 5.1 — corrige o caractere de escape da busca por handle.

create or replace function public.buscar_por_handle(termo text)
returns table (id uuid, nome text, handle text, avatar_url text)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select p.id, p.nome, p.handle, p.avatar_url
  from profiles p
  where p.handle is not null
    and p.descobrivel
    and p.id <> auth.uid()
    and p.handle like
      replace(replace(lower(trim(termo)), '%', E'\\%'), '_', E'\\_') || '%'
      escape E'\\'
    and not app_private.ha_bloqueio(auth.uid(), p.id)
  order by p.handle
  limit 10;
$$;

revoke execute on function public.buscar_por_handle(text) from public, anon;
grant execute on function public.buscar_por_handle(text) to authenticated;

notify pgrst, 'reload schema';
