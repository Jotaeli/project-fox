-- Fase 4.6 — Guias das abas: quais cards de onboarding o usuário já viu.
-- Chaves: "home", "rotina-financas", "rotina-wishlist", "rotina-tarefas", "anotar", "criar"

alter table profiles
  add column guias_vistos jsonb not null default '{}'::jsonb;
