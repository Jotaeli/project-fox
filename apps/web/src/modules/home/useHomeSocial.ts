import { useQuery } from "@tanstack/react-query";
import type { TipoPostagem } from "@project-fox/types";
import { useAuth } from "../../auth/AuthContext.js";
import { supabase } from "../../lib/supabaseClient.js";

export interface HomeSocialPost {
  id: string;
  autorNome: string;
  autorAvatar?: string;
  tipo: TipoPostagem;
  texto?: string;
  createdAt: string;
}

export interface HomeSocialChallenge {
  id: string;
  titulo: string;
  cor: string;
  prazo: string;
}

export function useHomeSocial() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["orbita", "home-social", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const [streakR, feedR, notificationsR, friendsR, challengeR] = await Promise.all([
        supabase.rpc("meu_streak"),
        supabase.rpc("feed", { limite: 4, antes: null }),
        supabase.from("notificacoes").select("id", { count: "exact", head: true }).eq("lida", false),
        supabase.from("amizades").select("id", { count: "exact", head: true }).eq("status", "aceita"),
        supabase.from("desafios").select("id,titulo,cor,prazo").eq("status", "ativo").order("prazo").limit(1),
      ]);
      if (streakR.error) throw streakR.error;
      if (feedR.error) throw feedR.error;
      if (notificationsR.error) throw notificationsR.error;
      if (friendsR.error) throw friendsR.error;
      if (challengeR.error) throw challengeR.error;

      const latest = feedR.data?.[0] as Record<string, unknown> | undefined;
      const challenge = challengeR.data?.[0];
      return {
        streak: {
          atual: Number(streakR.data?.atual ?? 0),
          ativoHoje: Boolean(streakR.data?.ativo_hoje),
          congelamentoDisponivel: Boolean(streakR.data?.congelamento_disponivel ?? true),
        },
        latestPost: latest ? {
          id: String(latest.id),
          autorNome: String(latest.autor_nome ?? "Alguém"),
          autorAvatar: latest.autor_avatar ? String(latest.autor_avatar) : undefined,
          tipo: latest.tipo as TipoPostagem,
          texto: latest.texto ? String(latest.texto) : undefined,
          createdAt: String(latest.created_at),
        } satisfies HomeSocialPost : undefined,
        challenge: challenge ? {
          id: challenge.id,
          titulo: challenge.titulo,
          cor: challenge.cor,
          prazo: challenge.prazo,
        } satisfies HomeSocialChallenge : undefined,
        unread: notificationsR.count ?? 0,
        friends: friendsR.count ?? 0,
      };
    },
  });
}
