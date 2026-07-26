import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EtapaTarefa, OrdenacaoSecao, SecaoTarefas, Tarefa } from "@project-fox/types";
import { useAuth } from "../../../auth/AuthContext.js";
import { currentMonth } from "../../../lib/currentMonth.js";
import { supabase } from "../../../lib/supabaseClient.js";

function mapSecao(s: any): SecaoTarefas {
  return { id: s.id, userId: s.user_id, nome: s.nome, cor: s.cor, ordem: s.ordem, fixa: s.fixa, ordenacao: s.ordenacao };
}
function mapEtapa(e: any): EtapaTarefa {
  return { id: e.id, tarefaId: e.tarefa_id, titulo: e.titulo, ordem: e.ordem, concluida: e.concluida };
}
function mapTarefa(t: any, etapas: EtapaTarefa[]): Tarefa {
  return {
    id: t.id, userId: t.user_id, secaoId: t.secao_id, titulo: t.titulo, descricao: t.descricao ?? undefined,
    ordem: t.ordem, prazo: t.prazo ?? undefined, etapas, financeira: t.financeira,
    valorAlvo: t.valor_alvo != null ? Number(t.valor_alvo) : undefined,
    wishlistRefId: t.wishlist_ref_id ?? undefined, origemPlanetaId: t.origem_planeta_id ?? undefined,
    concluidaAt: t.concluida_at ?? undefined,
    createdAt: t.created_at,
  };
}

export function isTarefaConcluida(t: Tarefa): boolean {
  return t.etapas.length > 0 && t.etapas.every((e) => e.concluida);
}

export function useTarefas() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const secoesQ = useQuery({
    queryKey: ["secoes", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("secoes_tarefas").select("*").order("ordem");
      if (error) throw error;
      return data.map(mapSecao);
    },
  });

  const tarefasQ = useQuery({
    queryKey: ["tarefas", userId],
    queryFn: async () => {
      const { data: tarefas, error } = await supabase.from("tarefas").select("*").order("ordem");
      if (error) throw error;
      const { data: etapas, error: eErr } = await supabase.from("etapas_tarefa").select("*").order("ordem");
      if (eErr) throw eErr;
      const etapasByTarefa = new Map<string, EtapaTarefa[]>();
      etapas.map(mapEtapa).forEach((e) => {
        const list = etapasByTarefa.get(e.tarefaId) ?? [];
        list.push(e);
        etapasByTarefa.set(e.tarefaId, list);
      });
      return tarefas.map((t) => mapTarefa(t, etapasByTarefa.get(t.id) ?? []));
    },
  });

  function invalidateTarefas() {
    qc.invalidateQueries({ queryKey: ["tarefas", userId] });
  }
  function invalidateSecoes() {
    qc.invalidateQueries({ queryKey: ["secoes", userId] });
  }

  const addSecao = useMutation({
    mutationFn: async (input: { nome: string; cor: number }) => {
      const ordem = secoesQ.data?.length ?? 0;
      const { data, error } = await supabase.from("secoes_tarefas").insert({
        user_id: userId, nome: input.nome, cor: `hsl(${input.cor},65%,60%)`, ordem, fixa: false, ordenacao: "personalizado",
      }).select().single();
      if (error) throw error;
      return mapSecao(data);
    },
    onSuccess: invalidateSecoes,
  });

  const deleteSecao = useMutation({
    mutationFn: async (id: string) => {
      const geral = secoesQ.data?.find((s) => s.fixa);
      if (!geral) throw new Error("Seção Geral não encontrada");
      const { error: reassignErr } = await supabase.from("tarefas").update({ secao_id: geral.id }).eq("secao_id", id);
      if (reassignErr) throw reassignErr;
      const { error } = await supabase.from("secoes_tarefas").delete().eq("id", id);
      if (error) throw error;
      return geral.id;
    },
    onSuccess: () => { invalidateSecoes(); invalidateTarefas(); },
  });

  const updateSecaoSort = useMutation({
    mutationFn: async (input: { id: string; ordenacao: OrdenacaoSecao }) => {
      const { error } = await supabase.from("secoes_tarefas").update({ ordenacao: input.ordenacao }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidateSecoes,
  });

  const addTarefa = useMutation({
    mutationFn: async (input: {
      titulo: string; secaoId: string; prazo?: string; etapas: string[];
      financeira: boolean; valorAlvo?: number; wishlistRefId?: string; origemPlanetaId?: string;
    }) => {
      const maxOrdem = Math.max(0, ...(tarefasQ.data ?? []).filter((t) => t.secaoId === input.secaoId).map((t) => t.ordem + 1));
      const { data: t, error } = await supabase.from("tarefas").insert({
        user_id: userId, secao_id: input.secaoId, titulo: input.titulo, ordem: maxOrdem,
        prazo: input.prazo || null, financeira: input.financeira,
        valor_alvo: input.financeira ? input.valorAlvo ?? 0 : null,
        wishlist_ref_id: input.wishlistRefId || null,
        origem_planeta_id: input.origemPlanetaId || null,
      }).select().single();
      if (error) throw error;
      const rows = input.etapas.map((titulo, i) => ({ tarefa_id: t.id, titulo, ordem: i, concluida: false }));
      const { error: eErr } = await supabase.from("etapas_tarefa").insert(rows);
      if (eErr) throw eErr;
    },
    onSuccess: invalidateTarefas,
  });

  const deleteTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tarefas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateTarefas,
  });

  const moveTaskToSection = useMutation({
    mutationFn: async (input: { taskId: string; secaoId: string }) => {
      const maxOrdem = Math.max(0, ...(tarefasQ.data ?? []).filter((t) => t.secaoId === input.secaoId).map((t) => t.ordem + 1));
      const { error } = await supabase.from("tarefas").update({ secao_id: input.secaoId, ordem: maxOrdem }).eq("id", input.taskId);
      if (error) throw error;
    },
    onSuccess: invalidateTarefas,
  });

  const reorderTasks = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(orderedIds.map((id, ordem) => supabase.from("tarefas").update({ ordem }).eq("id", id)));
    },
    onSuccess: invalidateTarefas,
  });

  // avança a próxima etapa; se todas ficarem concluídas e a tarefa for financeira, gera renda automática (idempotente)
  const avancarEtapa = useMutation({
    mutationFn: async (tarefa: Tarefa) => {
      const next = tarefa.etapas.slice().sort((a, b) => a.ordem - b.ordem).find((e) => !e.concluida);
      if (!next) return { finished: false };
      const { error } = await supabase.from("etapas_tarefa").update({ concluida: true }).eq("id", next.id);
      if (error) throw error;
      const allDone = tarefa.etapas.every((e) => e.id === next.id || e.concluida);
      if (allDone) {
        const { error: cErr } = await supabase.from("tarefas").update({ concluida_at: new Date().toISOString() }).eq("id", tarefa.id);
        if (cErr) throw cErr;
      }
      if (allDone && tarefa.financeira) {
        const { data: existing } = await supabase.from("rendas_mensais").select("id").eq("origem_tarefa_id", tarefa.id).limit(1);
        if (!existing || existing.length === 0) {
          const { error: rErr } = await supabase.from("rendas_mensais").insert({
            user_id: userId, fonte: `Tarefa · ${tarefa.titulo}`, valor: tarefa.valorAlvo ?? 0,
            mes: currentMonth(), origem_tarefa_id: tarefa.id,
          });
          if (rErr) throw rErr;
        }
      }
      return { finished: allDone };
    },
    onSuccess: () => {
      invalidateTarefas();
      qc.invalidateQueries({ queryKey: ["rendas", userId] });
    },
  });

  const desfazerEtapa = useMutation({
    mutationFn: async (input: { tarefa: Tarefa; etapaOrdem: number }) => {
      const idsToRevert = input.tarefa.etapas.filter((e) => e.ordem >= input.etapaOrdem).map((e) => e.id);
      await Promise.all(idsToRevert.map((id) => supabase.from("etapas_tarefa").update({ concluida: false }).eq("id", id)));
      const { error } = await supabase.from("tarefas").update({ concluida_at: null }).eq("id", input.tarefa.id);
      if (error) throw error;
    },
    onSuccess: invalidateTarefas,
  });

  return {
    secoes: secoesQ.data ?? [],
    tarefas: tarefasQ.data ?? [],
    isLoading: secoesQ.isLoading || tarefasQ.isLoading,
    addSecao, deleteSecao, updateSecaoSort, addTarefa, deleteTarefa,
    moveTaskToSection, reorderTasks, avancarEtapa, desfazerEtapa,
  };
}
