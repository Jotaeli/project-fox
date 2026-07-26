import type { Planeta, Tarefa } from "@project-fox/types";
import { BarChartIcon } from "../../icons/index.js";
import { hueOf } from "./criarConstants.js";

const DAY = 86400000;

function monthlyTaskCount(planetaId: string, tarefas: Tarefa[]): number {
  const cut = Date.now() - 30 * DAY;
  return tarefas.filter((t) => t.origemPlanetaId === planetaId && t.concluidaAt && +new Date(t.concluidaAt) > cut).length;
}

export function StatsModal({ planetas, tarefas, onClose }: { planetas: Planeta[]; tarefas: Tarefa[]; onClose: () => void }) {
  const rows = planetas.map((p) => ({ nome: p.nome, hue: hueOf(p.cor), count: monthlyTaskCount(p.id, tarefas) }));
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 380 }}>
        <h2><BarChartIcon /> Tarefas concluídas <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>· prévia da aba Rotina</span></h2>
        {rows.length ? rows.map((r) => (
          <div key={r.nome} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span>{r.nome}</span><span style={{ color: "var(--muted)" }}>{r.count}</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: "rgba(148,180,255,.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, width: `${(r.count / max) * 100}%`, background: `hsl(${r.hue},60%,55%)` }} />
            </div>
          </div>
        )) : <div className="empty">Nenhum planeta criado ainda.</div>}
        <div className="actions"><button className="btn" onClick={onClose}>Fechar</button></div>
      </div>
    </div>
  );
}
