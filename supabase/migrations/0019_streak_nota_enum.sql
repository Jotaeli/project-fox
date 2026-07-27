-- Notas passam a ser uma atividade válida para a sequência.
-- O valor do enum fica em uma migration própria porque o Postgres só permite
-- usá-lo com segurança depois do commit que o adiciona.

alter type tipo_atividade_streak add value if not exists 'nota';

notify pgrst, 'reload schema';
