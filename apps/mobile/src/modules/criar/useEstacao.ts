import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export interface EstacaoResumo {
  id: string;
  nome: string;
  ativa: boolean;
}

/**
 * Leitura enxuta da Estação Órbita, para telas fora do Criar (a Órbita não precisa
 * carregar planetas, recursos e fotos só para saber se a estação está em órbita).
 */
export function useEstacao() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["estacao", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("planetas")
        .select("id,nome,estacao_ativa").eq("is_estacao", true).maybeSingle();
      if (error) throw error;
      return data ? { id: data.id, nome: data.nome, ativa: !!data.estacao_ativa } as EstacaoResumo : null;
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["estacao", userId] });
    qc.invalidateQueries({ queryKey: ["planetas"] });
  }

  const ativar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("garantir_estacao");
      if (error) throw error;
      return data as string;
    },
    onSuccess: invalidate,
  });

  return { estacao: query.data ?? null, isLoading: query.isLoading, ativar };
}
