import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChecklistItemEvento, Evento, Foto, Planeta, Recurso, Relatorio, StatusEvento, TipoPlaneta } from "@project-fox/types";
import { useAuth } from "../../auth/AuthContext.js";
import { supabase } from "../../lib/supabaseClient.js";

const DAY = 86400000;

function mapPlaneta(p: any): Planeta {
  return {
    id: p.id, userId: p.user_id, nome: p.nome, cor: p.cor, tipo: p.tipo as TipoPlaneta,
    objetivoPrincipal: p.objetivo_principal, descricao: p.descricao ?? undefined,
    metaSemanal: p.meta_semanal, temRecursos: p.tem_recursos, temFotos: p.tem_fotos,
    createdAt: p.created_at,
  };
}
function mapRelatorio(r: any): Relatorio {
  return { id: r.id, planetaId: r.planeta_id, conteudo: r.conteudo, notaConectadaId: r.nota_conectada_id ?? undefined, createdAt: r.created_at };
}
function mapRecurso(r: any): Recurso {
  return { id: r.id, planetaId: r.planeta_id, nome: r.nome, arquivoUrl: r.arquivo_url, tipo: r.tipo, createdAt: r.created_at };
}
function mapFoto(f: any): Foto {
  return { id: f.id, planetaId: f.planeta_id, url: f.url, createdAt: f.created_at };
}
function mapChecklistItem(c: any): ChecklistItemEvento {
  return { id: c.id, eventoId: c.evento_id, titulo: c.titulo, relatorioAnexadoId: c.relatorio_anexado_id ?? undefined, comprovado: c.comprovado };
}
function mapEvento(e: any, checklist: ChecklistItemEvento[]): Evento {
  return {
    id: e.id, planetaId: e.planeta_id, titulo: e.titulo, icone: e.icone, cor: e.cor, prazo: e.prazo,
    status: e.status as StatusEvento, checklist, concluidoEm: e.concluido_em ?? undefined, falhouEm: e.falhou_em ?? undefined,
    createdAt: e.created_at,
  };
}

/** Status "falha" é derivado no cliente a partir do prazo — não exige varredura em background. */
export function derivedStatus(ev: Evento): StatusEvento {
  if (ev.status === "ativo" && new Date(`${ev.prazo}T23:59:59`).getTime() < Date.now()) return "falha";
  return ev.status;
}
export function eventProgress(ev: Evento) {
  const done = ev.checklist.filter((c) => c.comprovado).length;
  return { done, total: ev.checklist.length, pct: done / Math.max(1, ev.checklist.length) };
}
export function weeklyCount(planetaId: string, relatorios: Relatorio[]): number {
  const cut = Date.now() - 7 * DAY;
  return relatorios.filter((r) => r.planetaId === planetaId && new Date(r.createdAt).getTime() > cut).length;
}
export function health(p: Planeta, relatorios: Relatorio[]): number {
  let h = Math.min(1, weeklyCount(p.id, relatorios) / p.metaSemanal);
  const age = Date.now() - new Date(p.createdAt).getTime();
  if (age < 7 * DAY) h = Math.max(h, 1 - age / (7 * DAY));
  return h;
}

export function useCriar() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const planetasQ = useQuery({
    queryKey: ["planetas", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("planetas").select("*").order("created_at");
      if (error) throw error;
      return data.map(mapPlaneta);
    },
  });

  const relatoriosQ = useQuery({
    queryKey: ["relatorios", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("relatorios").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapRelatorio);
    },
  });

  const recursosQ = useQuery({
    queryKey: ["recursos", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("recursos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapRecurso);
    },
  });

  const fotosQ = useQuery({
    queryKey: ["fotos", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("fotos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapFoto);
    },
  });

  const eventosQ = useQuery({
    queryKey: ["eventos", userId],
    queryFn: async () => {
      const { data: eventos, error } = await supabase.from("eventos").select("*").order("prazo");
      if (error) throw error;
      const { data: itens, error: iErr } = await supabase.from("checklist_itens_evento").select("*");
      if (iErr) throw iErr;
      const itensByEvento = new Map<string, ChecklistItemEvento[]>();
      itens.map(mapChecklistItem).forEach((c) => {
        const list = itensByEvento.get(c.eventoId) ?? [];
        list.push(c);
        itensByEvento.set(c.eventoId, list);
      });
      return eventos.map((e) => mapEvento(e, itensByEvento.get(e.id) ?? []));
    },
  });

  function invalidatePlanetas() { qc.invalidateQueries({ queryKey: ["planetas", userId] }); }
  function invalidateRelatorios() { qc.invalidateQueries({ queryKey: ["relatorios", userId] }); }
  function invalidateRecursos() { qc.invalidateQueries({ queryKey: ["recursos", userId] }); }
  function invalidateFotos() { qc.invalidateQueries({ queryKey: ["fotos", userId] }); }
  function invalidateEventos() { qc.invalidateQueries({ queryKey: ["eventos", userId] }); }

  const addPlaneta = useMutation({
    mutationFn: async (input: {
      nome: string; cor: string; tipo: TipoPlaneta; objetivoPrincipal: string; descricao?: string;
      metaSemanal: number; temRecursos: boolean; temFotos: boolean;
    }) => {
      const { data, error } = await supabase.from("planetas").insert({
        user_id: userId, nome: input.nome, cor: input.cor, tipo: input.tipo,
        objetivo_principal: input.objetivoPrincipal, descricao: input.descricao || null,
        meta_semanal: input.metaSemanal, tem_recursos: input.temRecursos, tem_fotos: input.temFotos,
      }).select().single();
      if (error) throw error;
      return mapPlaneta(data);
    },
    onSuccess: invalidatePlanetas,
  });

  const deletePlaneta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planetas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePlanetas(); invalidateRelatorios(); invalidateRecursos(); invalidateFotos(); invalidateEventos();
      qc.invalidateQueries({ queryKey: ["tarefas", userId] });
      qc.invalidateQueries({ queryKey: ["wishlist", userId] });
    },
  });

  const addRelatorio = useMutation({
    mutationFn: async (input: { planetaId: string; conteudo: string }) => {
      const { error } = await supabase.from("relatorios").insert({ planeta_id: input.planetaId, conteudo: input.conteudo });
      if (error) throw error;
    },
    onSuccess: invalidateRelatorios,
  });

  async function uploadToBucket(bucket: string, planetaId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${planetaId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  const addRecurso = useMutation({
    mutationFn: async (input: { planetaId: string; file: File }) => {
      const url = await uploadToBucket("planeta-recursos", input.planetaId, input.file);
      const ext = input.file.name.split(".").pop()?.toUpperCase() || "Arquivo";
      const { error } = await supabase.from("recursos").insert({
        planeta_id: input.planetaId, nome: input.file.name, arquivo_url: url, tipo: ext,
      });
      if (error) throw error;
    },
    onSuccess: invalidateRecursos,
  });

  const addFoto = useMutation({
    mutationFn: async (input: { planetaId: string; file: File }) => {
      const url = await uploadToBucket("planeta-fotos", input.planetaId, input.file);
      const { error } = await supabase.from("fotos").insert({ planeta_id: input.planetaId, url });
      if (error) throw error;
    },
    onSuccess: invalidateFotos,
  });

  const addEvento = useMutation({
    mutationFn: async (input: { planetaId: string; titulo: string; icone: string; cor: string; prazo: string; checklist: string[] }) => {
      const { data: ev, error } = await supabase.from("eventos").insert({
        planeta_id: input.planetaId, titulo: input.titulo, icone: input.icone, cor: input.cor, prazo: input.prazo,
      }).select().single();
      if (error) throw error;
      const rows = input.checklist.map((titulo) => ({ evento_id: ev.id, titulo, comprovado: false }));
      const { error: iErr } = await supabase.from("checklist_itens_evento").insert(rows);
      if (iErr) throw iErr;
    },
    onSuccess: invalidateEventos,
  });

  const attachProof = useMutation({
    mutationFn: async (input: { checklistItemId: string; relatorioId: string; evento: Evento }) => {
      const { error } = await supabase.from("checklist_itens_evento")
        .update({ comprovado: true, relatorio_anexado_id: input.relatorioId }).eq("id", input.checklistItemId);
      if (error) throw error;
      const allDone = input.evento.checklist.every((c) => c.id === input.checklistItemId || c.comprovado);
      if (allDone) {
        const { error: eErr } = await supabase.from("eventos")
          .update({ status: "concluido", concluido_em: new Date().toISOString() }).eq("id", input.evento.id);
        if (eErr) throw eErr;
      }
      return { completed: allDone };
    },
    onSuccess: invalidateEventos,
  });

  return {
    planetas: planetasQ.data ?? [],
    relatorios: relatoriosQ.data ?? [],
    recursos: recursosQ.data ?? [],
    fotos: fotosQ.data ?? [],
    eventos: eventosQ.data ?? [],
    isLoading: planetasQ.isLoading || relatoriosQ.isLoading || recursosQ.isLoading || fotosQ.isLoading || eventosQ.isLoading,
    addPlaneta, deletePlaneta, addRelatorio, addRecurso, addFoto, addEvento, attachProof,
  };
}
