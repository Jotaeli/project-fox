import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BadgeNota, ConexaoNota, EspacoNotas, MembroEspacoNotas, Nota } from "@project-fox/types";
import { useAuth } from "../../auth/AuthContext.js";
import { supabase } from "../../lib/supabaseClient.js";

export interface AmigoEspacoNotas {
  userId: string;
  nome: string;
  handle?: string;
  avatarUrl?: string;
}

function mapNotaPessoal(n: any): Nota {
  return {
    id: n.id, userId: n.user_id, titulo: n.titulo, conteudo: n.conteudo,
    badges: n.badges as BadgeNota[], posX: n.pos_x ?? undefined, posY: n.pos_y ?? undefined,
    createdAt: n.created_at,
  };
}
function mapConexaoPessoal(c: any): ConexaoNota {
  return { id: c.id, userId: c.user_id, notaOrigemId: c.nota_origem_id, notaDestinoId: c.nota_destino_id };
}

function defaultSharedPosition(noteId: string, userId: string, index: number, total: number) {
  const source = `${noteId}:${userId}`;
  let seed = 0;
  for (let i = 0; i < source.length; i++) seed = (seed * 31 + source.charCodeAt(i)) | 0;
  const jitter = (Math.abs(seed) % 1000) / 1000;
  const angle = (index / Math.max(1, total)) * Math.PI * 2 + jitter * 0.7;
  const radius = 170 + (Math.abs(seed >> 4) % 90);
  return { pos_x: Math.cos(angle) * radius, pos_y: Math.sin(angle) * radius };
}

export function useAnotar(espacoId: string | null = null) {
  const { session } = useAuth();
  const userId = session!.user.id;
  const qc = useQueryClient();
  const graphKey = espacoId ?? "pessoal";

  const spacesQ = useQuery({
    queryKey: ["espacos-notas", userId],
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("espacos_notas").select("*").order("created_at");
      if (error) throw error;
      const ids = (rows ?? []).map((row) => row.id);
      if (!ids.length) return { spaces: [] as EspacoNotas[], invites: [] as { id: string; nome: string; cor: string }[] };
      const { data: memberRows, error: memberError } = await supabase.from("espaco_notas_membros").select("*").in("espaco_id", ids);
      if (memberError) throw memberError;
      const peopleIds = [...new Set((memberRows ?? []).map((member) => member.user_id))];
      const { data: people, error: peopleError } = await supabase.from("profiles").select("id,nome,handle,avatar_url").in("id", peopleIds);
      if (peopleError) throw peopleError;
      const peopleById = new Map((people ?? []).map((person) => [person.id, person]));
      const members = (memberRows ?? []).map((member) => {
        const person = peopleById.get(member.user_id);
        return {
          espacoId: member.espaco_id, userId: member.user_id, nome: person?.nome ?? "Participante",
          handle: person?.handle ?? undefined, avatarUrl: person?.avatar_url ?? undefined,
          papel: member.papel, status: member.status, convidadoPor: member.convidado_por ?? undefined,
          respondidoEm: member.respondido_em ?? undefined, createdAt: member.created_at,
        } as MembroEspacoNotas;
      });
      const invites = (rows ?? []).flatMap((row) => {
        const mine = members.find((member) => member.espacoId === row.id && member.userId === userId);
        return mine?.status === "pendente" ? [{ id: row.id, nome: row.nome, cor: row.cor }] : [];
      });
      const spaces = (rows ?? []).flatMap((row) => {
        const spaceMembers = members.filter((member) => member.espacoId === row.id);
        const mine = spaceMembers.find((member) => member.userId === userId);
        return mine?.status === "aceito" ? [{
          id: row.id, ownerId: row.owner_id, nome: row.nome, cor: row.cor, membros: spaceMembers,
          meuPapel: mine.papel, createdAt: row.created_at,
        } as EspacoNotas] : [];
      });
      return { spaces, invites };
    },
  });

  const friendsQ = useQuery({
    queryKey: ["espacos-notas-friends", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("amizades").select("solicitante_id,destinatario_id").eq("status", "aceita")
        .or(`solicitante_id.eq.${userId},destinatario_id.eq.${userId}`);
      if (error) throw error;
      const ids = (data ?? []).map((friendship) => friendship.solicitante_id === userId ? friendship.destinatario_id : friendship.solicitante_id);
      if (!ids.length) return [] as AmigoEspacoNotas[];
      const { data: people, error: peopleError } = await supabase.from("profiles").select("id,nome,handle,avatar_url").in("id", ids);
      if (peopleError) throw peopleError;
      return (people ?? []).map((person) => ({ userId: person.id, nome: person.nome, handle: person.handle ?? undefined, avatarUrl: person.avatar_url ?? undefined }));
    },
  });

  const activeSpace = spacesQ.data?.spaces.find((space) => space.id === espacoId);

  const notasQ = useQuery({
    queryKey: ["notas", userId, graphKey],
    enabled: !espacoId || !!activeSpace,
    queryFn: async () => {
      if (!espacoId) {
        const { data, error } = await supabase.from("notas").select("*").order("created_at");
        if (error) throw error;
        return data.map(mapNotaPessoal);
      }
      const { data, error } = await supabase.from("notas_compartilhadas").select("*").eq("espaco_id", espacoId).order("created_at");
      if (error) throw error;
      const ids = data.map((note) => note.id);
      const { data: positions, error: positionError } = ids.length
        ? await supabase.from("posicoes_notas_compartilhadas").select("*").in("nota_id", ids).eq("user_id", userId)
        : { data: [], error: null };
      if (positionError) throw positionError;
      const byNote = new Map((positions ?? []).map((position) => [position.nota_id, position]));
      const missingPositions = data.flatMap((note, index) => {
        if (byNote.has(note.id)) return [];
        const position = defaultSharedPosition(note.id, userId, index, data.length);
        const row = { nota_id: note.id, user_id: userId, ...position };
        byNote.set(note.id, row);
        return [row];
      });
      if (missingPositions.length) {
        const { error: seedError } = await supabase.from("posicoes_notas_compartilhadas").upsert(missingPositions, { onConflict: "nota_id,user_id" });
        if (seedError) throw seedError;
      }
      const members = activeSpace?.membros ?? [];
      return data.map((note) => {
        const position = byNote.get(note.id);
        return {
          id: note.id, userId: note.autor_id, espacoId: note.espaco_id,
          autorNome: note.autor_id === userId ? "Você" : members.find((member) => member.userId === note.autor_id)?.nome ?? "Membro",
          titulo: note.titulo, conteudo: note.conteudo, badges: note.badges as BadgeNota[],
          posX: position?.pos_x ?? undefined, posY: position?.pos_y ?? undefined, createdAt: note.created_at,
        } as Nota;
      });
    },
  });

  const conexoesQ = useQuery({
    queryKey: ["conexoes", userId, graphKey],
    enabled: !espacoId || !!activeSpace,
    queryFn: async () => {
      if (!espacoId) {
        const { data, error } = await supabase.from("conexoes_notas").select("*");
        if (error) throw error;
        return data.map(mapConexaoPessoal);
      }
      const { data, error } = await supabase.from("conexoes_notas_compartilhadas").select("*").eq("espaco_id", espacoId);
      if (error) throw error;
      return data.map((connection) => ({
        id: connection.id, userId: connection.autor_id, espacoId: connection.espaco_id,
        notaOrigemId: connection.nota_origem_id, notaDestinoId: connection.nota_destino_id,
      } as ConexaoNota));
    },
  });

  function invalidateNotas() { qc.invalidateQueries({ queryKey: ["notas", userId, graphKey] }); }
  function invalidateConexoes() { qc.invalidateQueries({ queryKey: ["conexoes", userId, graphKey] }); }
  function invalidateSpaces() { qc.invalidateQueries({ queryKey: ["espacos-notas", userId] }); }

  const addNota = useMutation({
    mutationFn: async (input: { titulo: string; conteudo: string; badges: BadgeNota[]; posX: number; posY: number }) => {
      if (!espacoId) {
        const { data, error } = await supabase.from("notas").insert({
          user_id: userId, titulo: input.titulo, conteudo: input.conteudo, badges: input.badges,
          pos_x: input.posX, pos_y: input.posY,
        }).select().single();
        if (error) throw error;
        return mapNotaPessoal(data);
      }
      const { data, error } = await supabase.from("notas_compartilhadas").insert({
        espaco_id: espacoId, autor_id: userId, titulo: input.titulo, conteudo: input.conteudo, badges: input.badges,
      }).select().single();
      if (error) throw error;
      const { error: positionError } = await supabase.from("posicoes_notas_compartilhadas").insert({
        nota_id: data.id, user_id: userId, pos_x: input.posX, pos_y: input.posY,
      });
      if (positionError) throw positionError;
      return { id: data.id, userId, espacoId, autorNome: "Você", titulo: data.titulo, conteudo: data.conteudo, badges: data.badges as BadgeNota[], posX: input.posX, posY: input.posY, createdAt: data.created_at } as Nota;
    },
    onSuccess: invalidateNotas,
  });

  const updateNota = useMutation({
    mutationFn: async (input: { id: string; titulo?: string; conteudo?: string; badges?: BadgeNota[]; posX?: number; posY?: number }) => {
      if (!espacoId) {
        const patch: Record<string, unknown> = {};
        if (input.titulo !== undefined) patch.titulo = input.titulo;
        if (input.conteudo !== undefined) patch.conteudo = input.conteudo;
        if (input.badges !== undefined) patch.badges = input.badges;
        if (input.posX !== undefined) patch.pos_x = input.posX;
        if (input.posY !== undefined) patch.pos_y = input.posY;
        const { error } = await supabase.from("notas").update(patch).eq("id", input.id);
        if (error) throw error;
        return;
      }
      const patch: Record<string, unknown> = {};
      if (input.titulo !== undefined) patch.titulo = input.titulo;
      if (input.conteudo !== undefined) patch.conteudo = input.conteudo;
      if (input.badges !== undefined) patch.badges = input.badges;
      if (Object.keys(patch).length) {
        const { error } = await supabase.from("notas_compartilhadas").update(patch).eq("id", input.id);
        if (error) throw error;
      }
      if (input.posX !== undefined && input.posY !== undefined) {
        const { error } = await supabase.from("posicoes_notas_compartilhadas").upsert({
          nota_id: input.id, user_id: userId, pos_x: input.posX, pos_y: input.posY, updated_at: new Date().toISOString(),
        }, { onConflict: "nota_id,user_id" });
        if (error) throw error;
      }
    },
    onSuccess: invalidateNotas,
  });

  const deleteNota = useMutation({
    mutationFn: async (id: string) => {
      const table = espacoId ? "notas_compartilhadas" : "notas";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateNotas(); invalidateConexoes(); },
  });

  const addConexao = useMutation({
    mutationFn: async (input: { origemId: string; destinoId: string }) => {
      const { error } = espacoId
        ? await supabase.from("conexoes_notas_compartilhadas").insert({ espaco_id: espacoId, autor_id: userId, nota_origem_id: input.origemId, nota_destino_id: input.destinoId })
        : await supabase.from("conexoes_notas").insert({ user_id: userId, nota_origem_id: input.origemId, nota_destino_id: input.destinoId });
      if (error) throw error;
    },
    onSuccess: invalidateConexoes,
  });

  const deleteConexao = useMutation({
    mutationFn: async (input: { a: string; b: string }) => {
      const table = espacoId ? "conexoes_notas_compartilhadas" : "conexoes_notas";
      const first = await supabase.from(table).delete().eq("nota_origem_id", input.a).eq("nota_destino_id", input.b);
      if (first.error) throw first.error;
      const second = await supabase.from(table).delete().eq("nota_origem_id", input.b).eq("nota_destino_id", input.a);
      if (second.error) throw second.error;
    },
    onSuccess: invalidateConexoes,
  });

  const createSpace = useMutation({
    mutationFn: async ({ nome, cor }: { nome: string; cor: string }) => {
      const { data, error } = await supabase.from("espacos_notas").insert({ owner_id: userId, nome, cor }).select("id").single();
      if (error) throw error;
      return data.id as string;
    }, onSuccess: invalidateSpaces,
  });
  const inviteMember = useMutation({
    mutationFn: async ({ spaceId, friendId }: { spaceId: string; friendId: string }) => {
      const { error } = await supabase.rpc("convidar_membro_espaco_notas", { p_espaco_id: spaceId, p_user_id: friendId });
      if (error) throw error;
    }, onSuccess: invalidateSpaces,
  });
  const respondInvite = useMutation({
    mutationFn: async ({ spaceId, accept }: { spaceId: string; accept: boolean }) => {
      const { error } = await supabase.rpc("responder_convite_espaco_notas", { p_espaco_id: spaceId, p_aceitar: accept });
      if (error) throw error;
    }, onSuccess: invalidateSpaces,
  });

  return {
    userId, spaces: spacesQ.data?.spaces ?? [], spaceInvites: spacesQ.data?.invites ?? [], friends: friendsQ.data ?? [], activeSpace,
    notas: notasQ.data ?? [], conexoes: conexoesQ.data ?? [],
    isLoading: spacesQ.isLoading || notasQ.isLoading || conexoesQ.isLoading,
    addNota, updateNota, deleteNota, addConexao, deleteConexao, createSpace, inviteMember, respondInvite,
  };
}
