import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DesafioSocial, ObjetivoDesafio, ParticipanteDesafio, ProgressoDesafio } from "@project-fox/types";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export interface RelatorioDesafio {
  id: string;
  planetaId: string;
  planetaNome: string;
  conteudo: string;
  createdAt: string;
}

export function useDesafios() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["desafios"] });
    qc.invalidateQueries({ queryKey: ["orbita", "notifications"] });
    qc.invalidateQueries({ queryKey: ["planetas"] });
    qc.invalidateQueries({ queryKey: ["estacao"] });
  };

  const query = useQuery({
    queryKey: ["desafios", userId], enabled: !!userId,
    queryFn: async () => {
      await supabase.rpc("atualizar_desafios_vencidos");
      const { data: ds, error } = await supabase.from("desafios").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (ds ?? []).map((d) => d.id);
      if (!ids.length) return { desafios: [], participantes: [], objetivos: [], progresso: [] } as {
        desafios: DesafioSocial[]; participantes: ParticipanteDesafio[]; objetivos: ObjetivoDesafio[]; progresso: ProgressoDesafio[];
      };
      const [partR, objR] = await Promise.all([
        supabase.from("desafio_participantes").select("*").in("desafio_id", ids),
        supabase.from("desafio_objetivos").select("*").in("desafio_id", ids).order("ordem"),
      ]);
      if (partR.error) throw partR.error; if (objR.error) throw objR.error;
      const objectiveIds = (objR.data ?? []).map((o) => o.id);
      const progressR = objectiveIds.length
        ? await supabase.from("desafio_progresso").select("*").in("objetivo_id", objectiveIds)
        : { data: [], error: null };
      if (progressR.error) throw progressR.error;
      const peopleIds = [...new Set((partR.data ?? []).map((p) => p.user_id))];
      const peopleR = peopleIds.length
        ? await supabase.from("profiles").select("id,nome,handle,avatar_url").in("id", peopleIds)
        : { data: [], error: null };
      if (peopleR.error) throw peopleR.error;
      const people = new Map((peopleR.data ?? []).map((p) => [p.id, p]));
      return {
        desafios: (ds ?? []).map((d) => ({
          id: d.id, criadorId: d.criador_id, titulo: d.titulo, descricao: d.descricao ?? undefined,
          icone: d.icone, cor: d.cor, prazo: d.prazo, status: d.status,
          concluidoEm: d.concluido_em ?? undefined, falhouEm: d.falhou_em ?? undefined, createdAt: d.created_at,
        })),
        participantes: (partR.data ?? []).map((p) => {
          const person = people.get(p.user_id);
          return {
            desafioId: p.desafio_id, userId: p.user_id, status: p.status, convidadoPor: p.convidado_por,
            respondidoEm: p.respondido_em ?? undefined, concluidoEm: p.concluido_em ?? undefined,
            nome: person?.nome ?? "Participante", handle: person?.handle ?? undefined, avatarUrl: person?.avatar_url ?? undefined,
          };
        }),
        objetivos: (objR.data ?? []).map((o) => ({ id: o.id, desafioId: o.desafio_id, titulo: o.titulo, ordem: o.ordem })),
        progresso: (progressR.data ?? []).map((p) => ({ objetivoId: p.objetivo_id, userId: p.user_id, relatorioId: p.relatorio_id ?? undefined, comprovadoEm: p.comprovado_em })),
      } as { desafios: DesafioSocial[]; participantes: ParticipanteDesafio[]; objetivos: ObjetivoDesafio[]; progresso: ProgressoDesafio[] };
    },
  });

  const reports = useQuery({
    queryKey: ["desafios", "reports", userId], enabled: !!userId,
    queryFn: async () => {
      const { data: estacao, error: estacaoError } = await supabase.from("planetas").select("id,nome").eq("is_estacao", true).maybeSingle();
      if (estacaoError) throw estacaoError;
      if (!estacao) return [] as RelatorioDesafio[];
      const { data, error } = await supabase.from("relatorios").select("id,planeta_id,conteudo,created_at")
        .eq("planeta_id", estacao.id).eq("autor_id", userId!)
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.id, planetaId: r.planeta_id, planetaNome: estacao.nome, conteudo: r.conteudo, createdAt: r.created_at })) as RelatorioDesafio[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { titulo: string; descricao?: string; icone: string; cor: string; prazo: string; objetivos: string[]; convidados: string[] }) => {
      const { data, error } = await supabase.rpc("criar_desafio", {
        p_titulo: input.titulo, p_descricao: input.descricao ?? "", p_icone: input.icone,
        p_cor: input.cor, p_prazo: input.prazo, p_objetivos: input.objetivos, p_convidados: input.convidados,
      });
      if (error) throw error; return data as string;
    }, onSuccess: invalidate,
  });

  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase.rpc("responder_desafio", { p_desafio_id: id, p_aceitar: accept });
      if (error) throw error;
    }, onSuccess: invalidate,
  });

  const prove = useMutation({
    mutationFn: async ({ objectiveId, reportId }: { objectiveId: string; reportId: string }) => {
      const { data, error } = await supabase.rpc("comprovar_objetivo_desafio", { p_objetivo_id: objectiveId, p_relatorio_id: reportId });
      if (error) throw error; return data as boolean;
    }, onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("desafios").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
    }, onSuccess: invalidate,
  });

  return { userId, query, reports, create, respond, prove, cancel };
}
