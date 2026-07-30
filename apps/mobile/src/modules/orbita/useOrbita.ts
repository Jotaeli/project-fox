import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContextoCutucada, RankingStreakItem, StreakResumo, TipoPostagem, TipoReacao } from "@project-fox/types";
import { supabase } from "../../lib/supabaseClient";

export interface SocialProfile {
  id: string;
  nome: string;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  descobrivel: boolean;
  aceitaCutucadas: boolean;
  planetaFavoritoId: string | null;
  mostrarPlanetaFavorito: boolean;
  mostrarMetaPrincipal: boolean;
  mostrarEventos: boolean;
  mostrarWishlist: boolean;
  mostrarStreak: boolean;
}

export interface FriendSummary {
  friendshipId: string;
  userId: string;
  nome: string;
  handle: string | null;
  avatarUrl: string | null;
  direction: "incoming" | "outgoing" | "friend";
}

export interface FeedItem {
  id: string;
  autorId: string;
  autorNome: string;
  autorHandle: string | null;
  autorAvatar: string | null;
  tipo: TipoPostagem;
  texto: string | null;
  dados: Record<string, unknown>;
  createdAt: string;
  reacoes: Partial<Record<TipoReacao, number>>;
  minhaReacao: TipoReacao | null;
}

export interface NotificationItem {
  id: string;
  atorId: string | null;
  tipo: string;
  payload: Record<string, unknown>;
  lida: boolean;
  createdAt: string;
  ator?: { nome: string; handle: string | null; avatarUrl: string | null };
}

export interface PublicProfile {
  id: string;
  nome: string;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  desde: string;
  ehAmigo: boolean;
  aceitaCutucadas: boolean;
  planetaFavorito?: Record<string, unknown> | null;
  metaPrincipal?: Record<string, unknown> | null;
  eventosAtivos?: Record<string, unknown>[];
  wishlistDestaque?: Record<string, unknown> | null;
}

const profileSelect = "id,nome,handle,avatar_url,bio,descobrivel,aceita_cutucadas,planeta_favorito_id,mostrar_planeta_favorito,mostrar_meta_principal,mostrar_eventos,mostrar_wishlist,mostrar_streak";

function mapProfile(row: Record<string, any>): SocialProfile {
  return {
    id: row.id, nome: row.nome, handle: row.handle, avatarUrl: row.avatar_url, bio: row.bio,
    descobrivel: row.descobrivel, aceitaCutucadas: row.aceita_cutucadas,
    planetaFavoritoId: row.planeta_favorito_id,
    mostrarPlanetaFavorito: row.mostrar_planeta_favorito,
    mostrarMetaPrincipal: row.mostrar_meta_principal, mostrarEventos: row.mostrar_eventos,
    mostrarWishlist: row.mostrar_wishlist, mostrarStreak: row.mostrar_streak,
  };
}

export function useOrbita(userId?: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["orbita"] });

  const profile = useQuery({
    queryKey: ["orbita", "profile", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select(profileSelect).eq("id", userId!).single();
      if (error) throw error;
      return mapProfile(data);
    },
  });

  const planets = useQuery({
    queryKey: ["orbita", "planets", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("planetas").select("id,nome,cor").order("nome");
      if (error) throw error;
      return data as { id: string; nome: string; cor: string }[];
    },
  });

  const relations = useQuery({
    queryKey: ["orbita", "relations", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("amizades").select("id,solicitante_id,destinatario_id,status,created_at");
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((r) => r.solicitante_id === userId ? r.destinatario_id : r.solicitante_id))];
      if (!ids.length) return [] as FriendSummary[];
      const { data: people, error: pError } = await supabase.from("profiles").select("id,nome,handle,avatar_url").in("id", ids);
      if (pError) throw pError;
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((r) => {
        const otherId = r.solicitante_id === userId ? r.destinatario_id : r.solicitante_id;
        const p = byId.get(otherId);
        return {
          friendshipId: r.id, userId: otherId, nome: p?.nome ?? "Usuário",
          handle: p?.handle ?? null, avatarUrl: p?.avatar_url ?? null,
          direction: r.status === "aceita" ? "friend" : r.destinatario_id === userId ? "incoming" : "outgoing",
        } satisfies FriendSummary;
      });
    },
  });

  const feed = useQuery({
    queryKey: ["orbita", "feed", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("feed", { limite: 50, antes: null });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, any>) => ({
        id: r.id, autorId: r.autor_id, autorNome: r.autor_nome, autorHandle: r.autor_handle,
        autorAvatar: r.autor_avatar, tipo: r.tipo, texto: r.texto, dados: r.dados ?? {},
        createdAt: r.created_at, reacoes: r.reacoes ?? {}, minhaReacao: r.minha_reacao,
      })) as FeedItem[];
    },
  });

  const notifications = useQuery({
    queryKey: ["orbita", "notifications", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("notificacoes").select("id,ator_id,tipo,payload,lida,created_at").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      const actorIds = [...new Set((data ?? []).flatMap((n) => n.ator_id ? [n.ator_id] : []))];
      const actors = actorIds.length
        ? await supabase.from("profiles").select("id,nome,handle,avatar_url").in("id", actorIds)
        : { data: [], error: null };
      if (actors.error) throw actors.error;
      const byId = new Map((actors.data ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((n) => {
        const a = n.ator_id ? byId.get(n.ator_id) : undefined;
        return {
          id: n.id, atorId: n.ator_id, tipo: n.tipo, payload: n.payload ?? {}, lida: n.lida,
          createdAt: n.created_at,
          ator: a ? { nome: a.nome, handle: a.handle, avatarUrl: a.avatar_url } : undefined,
        } as NotificationItem;
      });
    },
  });

  const streak = useQuery({
    queryKey: ["orbita", "streak", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("meu_streak");
      if (error) throw error;
      return {
        atual: data.atual ?? 0,
        recorde: data.recorde ?? 0,
        ativos7d: data.ativos_7d ?? 0,
        congelamentosUsados: data.congelamentos_usados ?? 0,
        congelamentoDisponivel: data.congelamento_disponivel ?? true,
        ativoHoje: data.ativo_hoje ?? false,
      } as StreakResumo;
    },
  });

  const ranking = useQuery({
    queryKey: ["orbita", "ranking-streak", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ranking_streak");
      if (error) throw error;
      return (data ?? []).map((row: Record<string, any>) => ({
        userId: row.user_id, nome: row.nome, handle: row.handle ?? undefined,
        avatarUrl: row.avatar_url ?? undefined, atual: row.atual ?? 0,
        recorde: row.recorde ?? 0, ativos7d: row.ativos_7d ?? 0, eu: row.eu,
      })) as RankingStreakItem[];
    },
  });

  const activityDays = useQuery({
    queryKey: ["orbita", "activity-days", userId], enabled: !!userId,
    queryFn: async () => {
      const start = new Date(); start.setDate(start.getDate() - 6);
      const { data, error } = await supabase.from("atividades_streak").select("dia").gte("dia", start.toISOString().slice(0, 10)).order("dia");
      if (error) throw error;
      return [...new Set((data ?? []).map((row) => row.dia as string))];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (input: Partial<Omit<SocialProfile, "id">>) => {
      const patch: Record<string, unknown> = {};
      const keys: Record<string, string> = {
        nome: "nome", handle: "handle", avatarUrl: "avatar_url", bio: "bio", descobrivel: "descobrivel",
        aceitaCutucadas: "aceita_cutucadas", planetaFavoritoId: "planeta_favorito_id",
        mostrarPlanetaFavorito: "mostrar_planeta_favorito", mostrarMetaPrincipal: "mostrar_meta_principal",
        mostrarEventos: "mostrar_eventos", mostrarWishlist: "mostrar_wishlist", mostrarStreak: "mostrar_streak",
      };
      Object.entries(input).forEach(([key, value]) => {
        const dbKey = keys[key];
        if (dbKey && value !== undefined) patch[dbKey] = value;
      });
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId!);
      if (error) throw error;
    }, onSuccess: refresh,
  });

  const uploadAvatar = useMutation({
    mutationFn: async (input: { uri: string; mimeType: string }) => {
      const byMime: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
      const ext = byMime[input.mimeType];
      if (!ext) throw new Error("Use uma imagem JPG, PNG, WebP ou GIF.");
      const path = `${userId}/avatar.${ext}`;
      const response = await fetch(input.uri);
      const blob = await response.blob();
      if (blob.size > 5 * 1024 * 1024) throw new Error("A foto precisa ter no máximo 5 MB.");
      const { error } = await supabase.storage.from("avatares").upload(path, blob, { upsert: true, contentType: input.mimeType, cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatares").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { data: storedUrl, error: pError } = await supabase.rpc("definir_avatar", { p_url: url });
      if (pError) throw pError;
      if (storedUrl !== url) throw new Error("A foto foi enviada, mas o perfil não confirmou a atualização.");
      return url;
    }, onSuccess: (url) => {
      qc.setQueryData(["orbita", "profile", userId], (current: SocialProfile | undefined) => current ? { ...current, avatarUrl: url } : current);
      refresh();
    },
  });

  const createPost = useMutation({
    mutationFn: async (texto: string) => {
      const { error } = await supabase.from("postagens").insert({ user_id: userId, tipo: "texto", texto: texto.trim(), visibilidade: "amigos", dados: {} });
      if (error) throw error;
    }, onSuccess: refresh,
  });

  const react = useMutation({
    mutationFn: async ({ postId, tipo, current }: { postId: string; tipo: TipoReacao; current: TipoReacao | null }) => {
      if (current === tipo) {
        const { error } = await supabase.from("reacoes").delete().eq("postagem_id", postId).eq("user_id", userId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reacoes").upsert({ postagem_id: postId, user_id: userId, tipo }, { onConflict: "postagem_id,user_id" });
        if (error) throw error;
      }
    }, onSuccess: refresh,
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (targetId: string) => {
      const { error } = await supabase.from("amizades").insert({ solicitante_id: userId, destinatario_id: targetId });
      if (error) throw error;
    }, onSuccess: refresh,
  });

  const answerFriendRequest = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase.rpc("responder_amizade", { p_amizade_id: id, p_aceitar: accept });
      if (error) throw error;
    }, onSuccess: refresh,
  });

  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from("amizades").delete().eq("id", friendshipId);
      if (error) throw error;
    }, onSuccess: refresh,
  });

  const poke = useMutation({
    mutationFn: async ({ targetId, contexto = "perfil", motivo }: { targetId: string; contexto?: ContextoCutucada; motivo?: string }) => {
      const { error } = await supabase.from("cutucadas").insert({ de_id: userId, para_id: targetId, contexto, motivo });
      if (error) throw error;
    }, onSuccess: refresh,
  });

  const block = useMutation({
    mutationFn: async (targetId: string) => {
      const friendship = relations.data?.find((r) => r.userId === targetId);
      if (friendship) await supabase.from("amizades").delete().eq("id", friendship.friendshipId);
      const { error } = await supabase.from("bloqueios").insert({ bloqueador_id: userId, bloqueado_id: targetId });
      if (error) throw error;
    }, onSuccess: refresh,
  });

  const markNotificationsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("user_id", userId!).eq("lida", false);
      if (error) throw error;
    }, onSuccess: refresh,
  });

  return {
    profile, planets, relations, feed, notifications, streak, ranking, activityDays,
    updateProfile, uploadAvatar, createPost, react,
    sendFriendRequest, answerFriendRequest, removeFriend, poke, block, markNotificationsRead,
  };
}

export async function searchProfiles(term: string) {
  const { data, error } = await supabase.rpc("buscar_por_handle", { termo: term });
  if (error) throw error;
  return (data ?? []).map((p: Record<string, any>) => ({ id: p.id, nome: p.nome, handle: p.handle, avatarUrl: p.avatar_url }));
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("perfil_publico", { alvo: id });
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id, nome: data.nome, handle: data.handle, avatarUrl: data.avatar_url, bio: data.bio,
    desde: data.desde, ehAmigo: data.eh_amigo, aceitaCutucadas: data.aceita_cutucadas,
    planetaFavorito: data.planeta_favorito, metaPrincipal: data.meta_principal,
    eventosAtivos: data.eventos_ativos, wishlistDestaque: data.wishlist_destaque,
  };
}
