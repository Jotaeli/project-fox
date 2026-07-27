import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Gasto, ModalidadeGasto, RendaMensal } from "@project-fox/types";
import { useAuth } from "../../../auth/AuthContext.js";
import { currentMonth } from "../../../lib/currentMonth.js";
import { supabase } from "../../../lib/supabaseClient.js";

function mapRenda(r: any): RendaMensal {
  return {
    id: r.id, userId: r.user_id, fonte: r.fonte, valor: Number(r.valor),
    mes: r.mes, origemTarefaId: r.origem_tarefa_id ?? undefined, createdAt: r.created_at,
  };
}
function mapModalidade(m: any): ModalidadeGasto {
  return { id: m.id, userId: m.user_id, nome: m.nome, cor: m.cor, fixa: m.fixa, ordem: m.ordem };
}
function mapGasto(g: any): Gasto {
  return {
    id: g.id, userId: g.user_id, modalidadeId: g.modalidade_id, descricao: g.descricao,
    valor: Number(g.valor), mes: g.mes, pago: g.pago, pagoEm: g.pago_em ?? undefined,
    itemWishlistId: g.item_wishlist_id ?? undefined, createdAt: g.created_at,
  };
}

export function calcCofrinho(rendas: RendaMensal[], gastos: Gasto[]) {
  const totalIncome = rendas.reduce((s, i) => s + i.valor, 0);
  const totalSpent = gastos.filter((g) => g.pago).reduce((s, g) => s + g.valor, 0);
  const avail = Math.max(0, totalIncome - totalSpent);
  return { totalIncome, totalSpent, avail };
}

export function useFinancas() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const mes = currentMonth();
  const qc = useQueryClient();

  const rendasQ = useQuery({
    queryKey: ["rendas", userId, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rendas_mensais").select("*").eq("mes", mes).order("created_at");
      if (error) throw error;
      return data.map(mapRenda);
    },
  });

  const modalidadesQ = useQuery({
    queryKey: ["modalidades", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("modalidades_gasto").select("*").order("ordem");
      if (error) throw error;
      return data.map(mapModalidade);
    },
  });

  const gastosQ = useQuery({
    queryKey: ["gastos", userId, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos").select("*").eq("mes", mes).order("created_at");
      if (error) throw error;
      return data.map(mapGasto);
    },
  });

  function invalidateFinancas() {
    qc.invalidateQueries({ queryKey: ["rendas", userId, mes] });
    qc.invalidateQueries({ queryKey: ["modalidades", userId] });
    qc.invalidateQueries({ queryKey: ["gastos", userId, mes] });
  }

  const addRenda = useMutation({
    mutationFn: async (input: { fonte: string; valor: number }) => {
      const { error } = await supabase.from("rendas_mensais").insert({
        user_id: userId, fonte: input.fonte, valor: input.valor, mes,
      });
      if (error) throw error;
    },
    onSuccess: invalidateFinancas,
  });

  const deleteRenda = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rendas_mensais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateFinancas,
  });

  const addModalidade = useMutation({
    mutationFn: async (nome: string) => {
      const ordem = (modalidadesQ.data?.length ?? 0);
      const { error } = await supabase.from("modalidades_gasto").insert({
        user_id: userId, nome, cor: "#6ea8ff", fixa: false, ordem,
      });
      if (error) throw error;
    },
    onSuccess: invalidateFinancas,
  });

  const addGasto = useMutation({
    mutationFn: async (input: { modalidadeId: string; descricao: string; valor: number; itemWishlistId?: string }) => {
      const { error } = await supabase.from("gastos").insert({
        user_id: userId, modalidade_id: input.modalidadeId, descricao: input.descricao,
        valor: input.valor, mes, pago: false, item_wishlist_id: input.itemWishlistId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidateFinancas,
  });

  const deleteGasto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateFinancas,
  });

  // interconexão: marcar gasto como pago (ou desfazer) reflete no item da wishlist ligado a ele
  const marcarGastoPago = useMutation({
    mutationFn: async (gasto: Gasto) => {
      const novoPago = !gasto.pago;
      const { error } = await supabase.from("gastos").update({
        pago: novoPago, pago_em: novoPago ? new Date().toISOString() : null,
      }).eq("id", gasto.id);
      if (error) throw error;
      if (gasto.itemWishlistId) {
        const { error: wErr } = await supabase.from("itens_wishlist").update({ comprado: novoPago }).eq("id", gasto.itemWishlistId);
        if (wErr) throw wErr;
      }
      return novoPago;
    },
    onSuccess: () => {
      invalidateFinancas();
      qc.invalidateQueries({ queryKey: ["wishlist", userId] });
    },
  });

  return {
    rendas: rendasQ.data ?? [],
    modalidades: modalidadesQ.data ?? [],
    gastos: gastosQ.data ?? [],
    isLoading: rendasQ.isLoading || modalidadesQ.isLoading || gastosQ.isLoading,
    mes,
    addRenda, deleteRenda, addModalidade, addGasto, deleteGasto, marcarGastoPago,
  };
}
