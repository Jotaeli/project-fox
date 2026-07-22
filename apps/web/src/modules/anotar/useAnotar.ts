import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BadgeNota, ConexaoNota, Nota } from "@project-fox/types";
import { useAuth } from "../../auth/AuthContext.js";
import { supabase } from "../../lib/supabaseClient.js";

function mapNota(n: any): Nota {
  return {
    id: n.id, userId: n.user_id, titulo: n.titulo, conteudo: n.conteudo,
    badges: n.badges as BadgeNota[], posX: n.pos_x ?? undefined, posY: n.pos_y ?? undefined,
    createdAt: n.created_at,
  };
}
function mapConexao(c: any): ConexaoNota {
  return { id: c.id, userId: c.user_id, notaOrigemId: c.nota_origem_id, notaDestinoId: c.nota_destino_id };
}

export function useAnotar() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const notasQ = useQuery({
    queryKey: ["notas", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("notas").select("*").order("created_at");
      if (error) throw error;
      return data.map(mapNota);
    },
  });

  const conexoesQ = useQuery({
    queryKey: ["conexoes", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("conexoes_notas").select("*");
      if (error) throw error;
      return data.map(mapConexao);
    },
  });

  function invalidateNotas() {
    qc.invalidateQueries({ queryKey: ["notas", userId] });
  }
  function invalidateConexoes() {
    qc.invalidateQueries({ queryKey: ["conexoes", userId] });
  }

  const addNota = useMutation({
    mutationFn: async (input: { titulo: string; conteudo: string; badges: BadgeNota[]; posX: number; posY: number }) => {
      const { data, error } = await supabase.from("notas").insert({
        user_id: userId, titulo: input.titulo, conteudo: input.conteudo, badges: input.badges,
        pos_x: input.posX, pos_y: input.posY,
      }).select().single();
      if (error) throw error;
      return mapNota(data);
    },
    onSuccess: invalidateNotas,
  });

  const updateNota = useMutation({
    mutationFn: async (input: { id: string; titulo?: string; conteudo?: string; badges?: BadgeNota[]; posX?: number; posY?: number }) => {
      const patch: Record<string, unknown> = {};
      if (input.titulo !== undefined) patch.titulo = input.titulo;
      if (input.conteudo !== undefined) patch.conteudo = input.conteudo;
      if (input.badges !== undefined) patch.badges = input.badges;
      if (input.posX !== undefined) patch.pos_x = input.posX;
      if (input.posY !== undefined) patch.pos_y = input.posY;
      const { error } = await supabase.from("notas").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidateNotas,
  });

  const deleteNota = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateNotas(); invalidateConexoes(); },
  });

  const addConexao = useMutation({
    mutationFn: async (input: { origemId: string; destinoId: string }) => {
      const { error } = await supabase.from("conexoes_notas").insert({
        user_id: userId, nota_origem_id: input.origemId, nota_destino_id: input.destinoId,
      });
      if (error) throw error;
    },
    onSuccess: invalidateConexoes,
  });

  const deleteConexao = useMutation({
    mutationFn: async (input: { a: string; b: string }) => {
      await supabase.from("conexoes_notas").delete()
        .eq("nota_origem_id", input.a).eq("nota_destino_id", input.b);
      await supabase.from("conexoes_notas").delete()
        .eq("nota_origem_id", input.b).eq("nota_destino_id", input.a);
    },
    onSuccess: invalidateConexoes,
  });

  return {
    notas: notasQ.data ?? [],
    conexoes: conexoesQ.data ?? [],
    isLoading: notasQ.isLoading || conexoesQ.isLoading,
    addNota, updateNota, deleteNota, addConexao, deleteConexao,
  };
}
