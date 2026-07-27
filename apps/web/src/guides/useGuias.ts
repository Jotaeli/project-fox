import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext.js";
import { supabase } from "../lib/supabaseClient.js";

export type GuiasVistos = Record<string, boolean>;

export function useGuias() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();

  const vistosQ = useQuery({
    queryKey: ["guias", userId],
    enabled: !!userId,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("guias_vistos").eq("id", userId!).single();
      if (error) throw error;
      return (data.guias_vistos ?? {}) as GuiasVistos;
    },
  });

  const markSeen = useMutation({
    mutationFn: async (key: string) => {
      const next: GuiasVistos = { ...(vistosQ.data ?? {}), [key]: true };
      const { error } = await supabase.from("profiles").update({ guias_vistos: next }).eq("id", userId!);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => qc.setQueryData(["guias", userId], next),
  });

  return { vistos: vistosQ.data, loaded: vistosQ.isSuccess, markSeen };
}
