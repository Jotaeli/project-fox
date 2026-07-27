-- Ao excluir a própria conta, remove apenas o conteúdo que ela criou em planetas compartilhados.

alter table relatorios drop constraint relatorios_autor_id_fkey;
alter table relatorios add constraint relatorios_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete cascade;

alter table recursos drop constraint recursos_autor_id_fkey;
alter table recursos add constraint recursos_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete cascade;

alter table fotos drop constraint fotos_autor_id_fkey;
alter table fotos add constraint fotos_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete cascade;

alter table eventos drop constraint eventos_autor_id_fkey;
alter table eventos add constraint eventos_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete cascade;

alter table checklist_itens_evento drop constraint checklist_itens_evento_autor_id_fkey;
alter table checklist_itens_evento add constraint checklist_itens_evento_autor_id_fkey foreign key (autor_id) references auth.users(id) on delete cascade;

notify pgrst, 'reload schema';
