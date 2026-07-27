# Project Fox

App pessoal (web + Android, API compartilhada), multi-usuário, 3 módulos interconectados: **Rotina**, **Anotar**, **Desenvolver/Criar**.

## Stack (decidido)
- TypeScript full-stack: React (web) + Expo/React Native (Android) + Node API — monorepo (pnpm + Turborepo)
- Backend: Supabase (Postgres + Auth + Storage)
- Multi-usuário desde o início (não é single-user)

## Status: Fase 5.6 (Guia da Órbita + faixa social na Home) — COMPLETA (ver CLAUDE.md)
- [x] `prototypes/solar-system.html` — Desenvolver/Criar
- [x] `prototypes/neural-notes.html` — Anotar
- [x] `prototypes/rotina.html` — Rotina (3 sub-abas)

### Specs da Rotina (definidas pelo usuário, prototipadas)
- **Finanças**: cofrinho porquinho (SVG) com moedas douradas = % da renda restante; hover mostra saldo; renda mensal registrável (fonte + valor); modalidades de gasto (Wishlist sempre fixa + livres: comida, contas, rolê…); cada gasto tem check "foi pago" → moedas somem com stagger
- **Wishlist**: tierlist gamificada estilo loot-cards — S=Obsessão (dourado + brilho varrendo), A=Desejo (rosa), B=Curtiria (azul), C=Algum dia (cinza); drag&drop entre tiers; item: nome, valor, foto, planeta do Desenvolver/Criar, descrição, link de compra
- **Tarefas**: pilha de prioridade (topo = "AGORA", cards recuam), etapas com botão centralizado "Concluir etapa"; modal de criação com etapas dinâmicas + check "Tarefa financeira" (cascata: valor a conquistar + ref. wishlist)
- **Interconexões implementadas**: gasto da modalidade Wishlist pago → item vira "comprado" na tierlist; tarefa financeira concluída → valor vira renda automática no cofrinho ("Tarefa · título", borda verde); wishlist referenciável como chip em tarefas

Rodar protótipos: `preview_start` com `name: "prototypes"` (server já configurado em `.Codex/launch.json`, porta 8123, serve a pasta `prototypes/`). **Não usar `file://`** — o browser embutido bloqueia.

## Os 3 módulos

### Rotina
- **Wishlist Consumista**: prioridade visual de compras (evitar gasto por impulso)
- **Tarefas**: também podem ser criadas a partir de Desenvolver/Criar
- **Finanças**: estrutura mensal fixa (não planilha livre), puxa itens da wishlist

### Anotar
- Grafo estilo Obsidian: conexões 100% manuais (usuário liga notas, sem sugestão automática)
- Notas podem ter **múltiplas badges**: wishlist=verde, tarefas=azul, criar=rosa, sem badge=branco
- Badge = "tem a ver com" (atribuição manual — não é proveniência automática)
- Visual resolvido no protótipo: núcleo da nota = cor da badge principal; halo = blend aditivo (`globalCompositeOperation lighter`) de todas as badges
- Relatório do Desenvolver/Criar **pode conectar** a uma nota do Anotar, mas não vira nota

### Desenvolver/Criar
- Sistema solar: planeta = área de desenvolvimento — nome, cor, tipo (rochoso/gasoso/anelado/gelado), objetivo principal, descrição
- 3 luas por planeta: **Relatório** (obrigatória, meta semanal configurável 1-7x), **Recursos** (opcional, biblioteca de arquivos), **Fotos** (opcional)
- Saúde do planeta: **gradual**, proporcional ao % da meta semanal cumprido em janela deslizante de 7 dias; carência de 7 dias para planetas recém-criados
- **Eventos/Metas**: criadas dentro do planeta — título, ícone (banco próprio), cor, prazo (1 semana a 3 meses), checklist de objetivos definido na criação
- Cada item do checklist é comprovado **anexando um relatório** existente do planeta; todos comprovados = meta concluída; prazo vencido com checklist incompleto = falha (varredura automática)
- Painel de Eventos (canto inferior direito): aba Ativos (todos os planetas) + aba Histórico (concluídas/falhas)
- "Empolgação": planeta com evento ativo ganha brilho pulsante + faíscas orbitando + órbita 20% mais rápida; concluir meta dispara festinha (confete + anéis + toast)

## Linguagem visual
- Tom azul escuro em todo o app; clean, moderno, não pode cansar os olhos (uso diário)
- **Sem emojis coloridos** — banco de ícones de linha próprio (SVG inline, `currentColor`, estilo Feather/Lucide). Símbolos tipográficos neutros (← ＋ ✕ ✦) são aceitáveis
- Web caprichado; Android pode ser mais simples (limitações da plataforma)

## Roadmap
0. Protótipos visuais — completa
1. Fundação — monorepo, schema Supabase, tipos compartilhados — completa
2. Web — casca de navegação + Rotina completa — completa
3. Web — Anotar — completa
4. Web — Desenvolver/Criar, Home e Guias — completa
5. Web — Social ("Órbita") — completa (5.1 a 5.6)
6. Android (Expo) — versão enxuta *(próxima)*
7. Polimento e deploy

## Em aberto (decidir antes de implementar a respectiva fase)
- O que tarefas concluídas alimentam, além do que já está no protótipo solar (contexto no relatório, placar mensal, partículas de recompensa, gráfico de stats)
- Campos/layout exatos de Finanças

## Modelo por tipo de tarefa
- **Sonnet 5** (padrão): implementação de specs já fechadas, features mecânicas, bugfixes
- **Opus**: decisões de design visual/UX em aberto, prototipagem de telas novas, polish criativo
