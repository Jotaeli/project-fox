-- Registra notas pessoais e compartilhadas no streak, sempre para o autor.

create function app_private.on_nota_streak()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
  values (new.user_id, app_private.dia_local(new.user_id, new.created_at), 'nota', new.id, new.created_at)
  on conflict (user_id, tipo, referencia_id) do nothing;
  return new;
end;
$$;

create trigger notas_registra_streak
  after insert on notas
  for each row execute function app_private.on_nota_streak();

create function app_private.on_nota_compartilhada_streak()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
  values (new.autor_id, app_private.dia_local(new.autor_id, new.created_at), 'nota', new.id, new.created_at)
  on conflict (user_id, tipo, referencia_id) do nothing;
  return new;
end;
$$;

create trigger notas_compartilhadas_registra_streak
  after insert on notas_compartilhadas
  for each row execute function app_private.on_nota_compartilhada_streak();

-- Mantém o histórico coerente para notas que já existiam antes desta regra.
insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
select n.user_id, app_private.dia_local(n.user_id, n.created_at), 'nota', n.id, n.created_at
from notas n
on conflict (user_id, tipo, referencia_id) do nothing;

insert into atividades_streak (user_id, dia, tipo, referencia_id, created_at)
select n.autor_id, app_private.dia_local(n.autor_id, n.created_at), 'nota', n.id, n.created_at
from notas_compartilhadas n
on conflict (user_id, tipo, referencia_id) do nothing;

revoke all on function app_private.on_nota_streak() from public, anon, authenticated;
revoke all on function app_private.on_nota_compartilhada_streak() from public, anon, authenticated;

notify pgrst, 'reload schema';
