import type { Evento, Planeta, Tarefa } from "@project-fox/types";
import { useAuth } from "../../auth/AuthContext.js";
import { BADGES, INDEP_RGB } from "../anotar/AnotarPage.js";
import { useAnotar } from "../anotar/useAnotar.js";
import { derivedStatus, eventProgress, health, useCriar } from "../criar/useCriar.js";
import { calcCofrinho, useFinancas } from "../rotina/financas/useFinancas.js";
import { isTarefaConcluida, useTarefas } from "../rotina/tarefas/useTarefas.js";
import { useWishlist } from "../rotina/wishlist/useWishlist.js";
import { TIER_ORDER, TIERS } from "../rotina/wishlist/wishConstants.js";

export type Urgencia = "atrasado" | "urgent" | "warn" | "";

export interface UrgentItem {
  id: string;
  tipo: "tarefa" | "evento";
  titulo: string;
  sub: string;
  prazo: string;
  urgencia: Urgencia;
  diasLabel: string;
  planetaId?: string;
}

function diasAte(prazo: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${prazo}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function diasLabel(dias: number): string {
  if (dias < 0) return "atrasado";
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

function urgencia(dias: number): Urgencia {
  if (dias < 0) return "atrasado";
  if (dias <= 1) return "urgent";
  if (dias <= 3) return "warn";
  return "";
}

export function greeting(hour: number): string {
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function useHome() {
  const { session } = useAuth();
  const nome = (session?.user.user_metadata as { nome?: string } | undefined)?.nome ?? session?.user.email ?? "";
  const primeiroNome = nome.split(" ")[0].split("@")[0];

  const { secoes, tarefas } = useTarefas();
  const { rendas, gastos, modalidades } = useFinancas();
  const { items: wishItems } = useWishlist();
  const { planetas, relatorios, eventos } = useCriar();
  const { notas } = useAnotar();

  const urgentTarefas: UrgentItem[] = tarefas
    .filter((t: Tarefa) => t.prazo && !isTarefaConcluida(t))
    .map((t) => {
      const dias = diasAte(t.prazo!);
      const secao = secoes.find((s) => s.id === t.secaoId);
      const feitas = t.etapas.filter((e) => e.concluida).length;
      return {
        id: t.id, tipo: "tarefa" as const, titulo: t.titulo,
        sub: `${secao?.nome ?? "Geral"} · etapa ${feitas} de ${t.etapas.length}`,
        prazo: t.prazo!, urgencia: urgencia(dias), diasLabel: diasLabel(dias),
      };
    });

  const urgentEventos: UrgentItem[] = eventos
    .filter((e: Evento) => derivedStatus(e) === "ativo")
    .map((e) => {
      const dias = diasAte(e.prazo);
      const planeta = planetas.find((p) => p.id === e.planetaId);
      const prog = eventProgress(e);
      return {
        id: e.id, tipo: "evento" as const, titulo: `Meta: ${e.titulo}`,
        sub: `Planeta ${planeta?.nome ?? "?"} · ${prog.done} de ${prog.total}`,
        prazo: e.prazo, urgencia: urgencia(dias), diasLabel: diasLabel(dias),
        planetaId: e.planetaId,
      };
    });

  const urgentes = [...urgentTarefas, ...urgentEventos]
    .sort((a, b) => (a.prazo < b.prazo ? -1 : 1))
    .slice(0, 6);

  const cofrinho = calcCofrinho(rendas, gastos);
  const cofrinhoLegenda = modalidades
    .map((m) => ({ nome: m.nome, cor: m.cor, total: gastos.filter((g) => g.modalidadeId === m.id).reduce((s, g) => s + g.valor, 0) }))
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const planetasPreview: (Planeta & { saude: number })[] = planetas
    .map((p) => ({ ...p, saude: health(p, relatorios) }))
    .sort((a, b) => b.saude - a.saude)
    .slice(0, 3);
  const planetasComEventoAtivo = new Set(eventos.filter((e) => derivedStatus(e) === "ativo").map((e) => e.planetaId));

  const wishDestaque = TIER_ORDER
    .map((tier) => wishItems.find((w) => w.tier === tier && !w.comprado))
    .find(Boolean);
  const wishDestaquePlaneta = wishDestaque?.planetaId ? planetas.find((p) => p.id === wishDestaque.planetaId)?.nome : undefined;
  const wishTemMetaAtiva = !!wishDestaque?.planetaId && planetasComEventoAtivo.has(wishDestaque.planetaId);

  const notasRecentes = notas
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 4)
    .map((n) => {
      const cores = n.badges.length ? n.badges.map((b) => BADGES[b].rgb) : [INDEP_RGB];
      return { id: n.id, titulo: n.titulo, badges: n.badges, cores, createdAt: n.createdAt };
    });

  return {
    primeiroNome,
    urgentes,
    cofrinho, cofrinhoLegenda,
    planetasPreview, planetasComEventoAtivo,
    wishDestaque, wishTierInfo: wishDestaque ? TIERS[wishDestaque.tier] : null,
    wishDestaquePlaneta, wishTemMetaAtiva,
    notasRecentes,
    secoes,
    isLoading: false,
  };
}
