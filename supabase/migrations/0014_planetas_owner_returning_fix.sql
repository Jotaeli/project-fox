-- Permite INSERT ... RETURNING ao criador antes do trigger AFTER registrar sua membresia.

drop policy if exists "planetas_membro_select" on planetas;
create policy "planetas_membro_select" on planetas for select
  using (user_id = auth.uid() or app_private.participa_planeta(id, auth.uid(), true));

notify pgrst, 'reload schema';
