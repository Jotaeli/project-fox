import { useState } from "react";
import type { Foto, Planeta, Recurso, Relatorio, SecaoTarefas, Tarefa } from "@project-fox/types";
import { CheckIcon, CloseIcon, ExtIcon, PlusIcon, SparkIcon } from "../../icons/index.js";
import { capFirst } from "../../lib/currentMonth.js";
import { TaskModal } from "../rotina/tarefas/TaskModal.js";
import { health, weeklyCount } from "./useCriar.js";
import { MOON_STYLE } from "./criarConstants.js";
import { useCriar } from "./useCriar.js";

const DAY = 86400000;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return capFirst(d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })) + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function statusText(h: number): [string, string] {
  if (h >= 0.99) return ["Órbita estável ✦", "#7ef0b2"];
  if (h >= 0.6) return ["Órbita regular", "#9fc3ff"];
  if (h > 0.25) return ["Desacelerando…", "#ffd27d"];
  if (h > 0) return ["Perdendo a cor", "#ff9d7d"];
  return ["Órbita quase parada", "#8fa3c8"];
}

export function MoonDrawer({
  planeta, moonId, relatorios, recursos, fotos, tarefas, secoes, onClose,
}: {
  planeta: Planeta; moonId: string; relatorios: Relatorio[]; recursos: Recurso[]; fotos: Foto[]; tarefas: Tarefa[];
  secoes: SecaoTarefas[]; onClose: () => void;
}) {
  const { addRelatorio, addRecurso, addFoto } = useCriar();
  const [repText, setRepText] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const st = MOON_STYLE[moonId];
  const Icon = st.icon;

  const planetRelatorios = relatorios.filter((r) => r.planetaId === planeta.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const planetRecursos = recursos.filter((r) => r.planetaId === planeta.id);
  const planetFotos = fotos.filter((f) => f.planetaId === planeta.id);
  const planetTasks = tarefas.filter((t) => t.origemPlanetaId === planeta.id && t.concluidaAt);
  const weekCut = Date.now() - 7 * DAY;
  const weekTasks = planetTasks.filter((t) => +new Date(t.concluidaAt!) > weekCut).sort((a, b) => +new Date(b.concluidaAt!) - +new Date(a.concluidaAt!));

  const h = health(planeta, relatorios);
  const [statusTxt, statusCol] = statusText(h);
  const geral = secoes.find((s) => s.fixa);

  function sendReport() {
    const v = repText.trim();
    if (!v) return;
    addRelatorio.mutate({ planetaId: planeta.id, conteudo: v }, { onSuccess: () => setRepText("") });
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>, kind: "recurso" | "foto") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (kind === "recurso") addRecurso.mutate({ planetaId: planeta.id, file });
    else addFoto.mutate({ planetaId: planeta.id, file });
    e.target.value = "";
  }

  return (
    <>
      <aside className="drawer open">
        <div className="dr-head">
          <span className="dr-icon"><Icon /></span>
          <div><div className="dr-title">Lua de {st.label}</div><div className="dr-sub">Planeta {planeta.nome}</div></div>
          <button className="dr-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {moonId === "relatorio" && (
          <>
            <div className="dr-body">
              <div className="dr-chip"><span className="dr-cdot" style={{ background: statusCol }} />
                {weeklyCount(planeta.id, relatorios)}/{planeta.metaSemanal} nesta semana · <span style={{ color: statusCol }}>{statusTxt}</span>
              </div>
              {!planetRelatorios.length && (
                <div className="empty">Nenhum relatório ainda.<br />Escreva o primeiro e veja o planeta ganhar vida. <SparkIcon /></div>
              )}
              {planetRelatorios.map((r) => (
                <div className="entry" key={r.id}>
                  <div className="e-date">{fmtDate(r.createdAt)}</div>
                  <div className="e-text">{r.conteudo}</div>
                </div>
              ))}
            </div>
            <div className="dr-foot">
              {weekTasks.length > 0 && (
                <>
                  <div className="dr-sec-label">Tarefas concluídas esta semana</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {weekTasks.map((t) => (
                      <span key={t.id} className="task-chip" onClick={() => setRepText((prev) => (prev ? prev + " " : "") + `Concluí "${t.titulo}".`)}>
                        <CheckIcon /> {t.titulo}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <button className="btn" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={() => setTaskModalOpen(true)}>
                <PlusIcon /> Nova tarefa
              </button>
              <textarea placeholder={`Como foi hoje em ${planeta.nome}?`} value={repText} onChange={(e) => setRepText(e.target.value)} />
              <button className="btn primary" style={{ width: "100%", marginTop: 10, justifyContent: "center" }} onClick={sendReport} disabled={addRelatorio.isPending}>
                Enviar relatório
              </button>
            </div>
          </>
        )}

        {moonId === "recursos" && (
          <>
            <div className="dr-body">
              {!planetRecursos.length && <div className="empty">Biblioteca vazia.<br />Guarde livros e materiais para acessar de qualquer dispositivo.</div>}
              {planetRecursos.map((r) => (
                <a className="res-item" key={r.id} href={r.arquivoUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                  <span className="r-icon"><ExtIcon /></span>
                  <div><div className="r-name">{r.nome}</div><div className="r-kind">{r.tipo}</div></div>
                </a>
              ))}
            </div>
            <div className="dr-foot">
              <label className="btn primary" style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}>
                <PlusIcon /> Adicionar recurso
                <input type="file" style={{ display: "none" }} onChange={(e) => onFileChange(e, "recurso")} />
              </label>
            </div>
          </>
        )}

        {moonId === "fotos" && (
          <>
            <div className="dr-body">
              {!planetFotos.length && <div className="empty">Nenhuma foto ainda.<br />Registre suas atividades para lembrar delas no futuro.</div>}
              {planetFotos.length > 0 && (
                <div className="photo-grid">
                  {planetFotos.map((f) => <img className="photo" key={f.id} src={f.url} alt="" />)}
                </div>
              )}
            </div>
            <div className="dr-foot">
              <label className="btn primary" style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}>
                <PlusIcon /> Adicionar foto
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onFileChange(e, "foto")} />
              </label>
            </div>
          </>
        )}
      </aside>

      {taskModalOpen && geral && (
        <TaskModal secoes={secoes} defaultSecaoId={geral.id} defaultOrigemPlanetaId={planeta.id} onClose={() => setTaskModalOpen(false)} />
      )}
    </>
  );
}
