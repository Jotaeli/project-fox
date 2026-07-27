-- Vincula o avatar ao perfil por uma RPC explícita.
-- Evita updates silenciosos de zero linhas e mantém o alvo preso a auth.uid().

create function public.definir_avatar(p_url text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  atualizado text;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória';
  end if;
  if nullif(trim(p_url), '') is null then
    raise exception 'URL do avatar obrigatória';
  end if;

  update profiles
  set avatar_url = trim(p_url)
  where id = auth.uid()
  returning avatar_url into atualizado;

  if atualizado is null then
    raise exception 'Perfil não encontrado';
  end if;
  return atualizado;
end;
$$;

revoke execute on function public.definir_avatar(text) from public, anon;
grant execute on function public.definir_avatar(text) to authenticated;

notify pgrst, 'reload schema';
