import { useState } from "react";
import type { Evento, Planeta } from "@project-fox/types";
import { ChevIcon, ReportIcon, TargetIcon } from "../../icons/index.js";
import { deadlineUrgency, fmtDeadlineShort } from "../../lib/currentMonth.js";
import { derivedStatus, eventProgress } from "./useCriar.js";
import { GOAL_ICON_MAP, hueOf } from "./criarConstants.js";

function fmtShort(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function EventsPanel({
  planetas, eventos, onSelect,
}: {
  planetas: Planeta[]; eventos: Evento[]; onSelect: (planetaId: string, evento: Evento) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<"active" | "history">("active");
  const planetName = (id: string) => planetas.find((p) => p.id === id)?.nome ?? "";

  const rows = eventos.map((ev) => ({ ev, status: derivedStatus(ev) }));
  const active = rows.filter((r) => r.status === "ativo").sort((a, b) => a.ev.prazo.localeCompare(b.ev.prazo));
  const history = rows.filter((r) => r.status !== "ativo")
    .sort((a, b) => (b.ev.concluidoEm || b.ev.falhouEm || b.ev.prazo).localeCompare(a.ev.concluidoEm || a.ev.falhouEm || a.ev.prazo));

  return (
    <div className={`events-panel${collapsed ? " collapsed" : ""}`}>
      <div className="ep-head" onClick={() => setCollapsed((v) => !v)}>
        <span className="ep-ic"><TargetIcon /></span>
        <span className="ep-title">Eventos</span>
        <span className="ep-count">{active.length}</span>
        <span className="ep-chev"><ChevIcon /></span>
      </div>
      <div className="ep-inner">
        <div className="ep-tabs">
          <button className={`ep-tab${tab === "active" ? " sel" : ""}`} onClick={() => setTab("active")}>Ativos</button>
          <button className={`ep-tab${tab === "history" ? " sel" : ""}`} onClick={() => setTab("history")}>Histórico</button>
        </div>
        <div className="ep-body">
          {tab === "active" ? (
            active.length ? active.map(({ ev }) => {
              const pr = eventProgress(ev);
              const Icon = GOAL_ICON_MAP[ev.icone] ?? ReportIcon;
              const hue = hueOf(ev.cor);
              return (
                <div className="ep-row" key={ev.id} onClick={() => onSelect(ev.planetaId, ev)}>
                  <span className="ep-chip" style={{ "--eh": hue } as any}><Icon /></span>
                  <div className="ep-info">
                    <div className="ep-name">{ev.titulo}</div>
                    <div className="ep-sub">{planetName(ev.planetaId)} · {pr.done}/{pr.total} objetivos</div>
                    <div className="ep-prog"><div style={{ width: `${pr.pct * 100}%`, background: `hsl(${hue},65%,60%)` }} /></div>
                  </div>
                  <span className={`ep-time ${deadlineUrgency(ev.prazo)}`}>{fmtDeadlineShort(ev.prazo)}</span>
                </div>
              );
            }) : <div className="ep-empty">Nenhum evento ativo.<br />Crie uma meta dentro de um planeta!</div>
          ) : (
            history.length ? history.map(({ ev, status }) => {
              const Icon = GOAL_ICON_MAP[ev.icone] ?? ReportIcon;
              const hue = hueOf(ev.cor);
              return (
                <div className="ep-row" key={ev.id} onClick={() => onSelect(ev.planetaId, ev)}>
                  <span className="ep-chip" style={{ "--eh": hue } as any}><Icon /></span>
                  <div className="ep-info">
                    <div className="ep-name">{ev.titulo}</div>
                    <div className="ep-sub">{planetName(ev.planetaId)} · {fmtShort(ev.concluidoEm?.slice(0, 10) ?? ev.falhouEm?.slice(0, 10) ?? ev.prazo)}</div>
                  </div>
                  <span className={`ep-badge ${status === "concluido" ? "done" : "fail"}`}>{status === "concluido" ? "Concluída" : "Falhou"}</span>
                </div>
              );
            }) : <div className="ep-empty">Nenhuma meta finalizada ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
