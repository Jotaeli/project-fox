-- Corrige garantir_estacao: o trigger planeta_registra_dono (0012) já insere a
-- membresia do dono ao criar o planeta, então o insert manual duplicava a PK.

create or replace function public.garantir_estacao()
returns uuid
language plpgsql
security definer
set search_path = public, app_private
as $$
declare estacao_id uuid;
begin
  select id into estacao_id from planetas
  where user_id = auth.uid() and is_estacao;

  if estacao_id is null then
    insert into planetas (
      user_id, nome, cor, tipo, objetivo_principal, descricao,
      meta_semanal, tem_recursos, tem_fotos, is_estacao, estacao_ativa
    ) values (
      auth.uid(), 'Estação Órbita', '212', 'rochoso',
      'Comprovar os desafios que você divide com seus amigos',
      'A parte social do seu sistema. Os relatórios daqui comprovam seus desafios.',
      1, false, false, true, true
    ) returning id into estacao_id;
    -- a membresia de dono vem do trigger planeta_registra_dono
  else
    update planetas set estacao_ativa = true where id = estacao_id;
  end if;

  return estacao_id;
end;
$$;

notify pgrst, 'reload schema';
