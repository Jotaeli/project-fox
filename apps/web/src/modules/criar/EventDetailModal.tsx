import { useState } from "react";
import type { Evento, Relatorio } from "@project-fox/types";
import { CheckIcon, ClockIcon, ReportIcon } from "../../icons/index.js";
import { deadlineUrgency, fmtDeadlineShort } from "../../lib/currentMonth.js";
import { derivedStatus, eventProgress } from "./useCriar.js";
import { GOAL_ICON_MAP, hueOf } from "./criarConstants.js";
import { useCriar } from "./useCriar.js";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function EventDetailModal({
  evento, relatorios, onClose, onCompleted,
}: {
  evento: Evento; relatorios: Relatorio[]; onClose: () => void; onCompleted: () => void;
}) {
  const { attachProof } = useCriar();
  const [attachIdx, setAttachIdx] = useState<number | null>(null);
  const status = derivedStatus(evento);
  const pr = eventProgress(evento);
  const hue = hueOf(evento.cor);
  const Icon = GOAL_ICON_MAP[evento.icone] ?? ReportIcon;
  const planetReports = relatorios.filter((r) => r.planetaId === evento.planetaId).slice(0, 6);

  function pick(checklistItemId: string, relatorioId: string) {
    attachProof.mutate(
      { checklistItemId, relatorioId, evento },
      {
        onSuccess: (res) => {
          setAttachIdx(null);
          if (res.completed) onCompleted();
        },
      },
    );
  }

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 420 }}>
        <div className="ev-head" style={{ "--eh": hue } as any}>
          <span className="ev-chip-lg"><Icon /></span>
          <div style={{ flex: 1 }}>
            <div className="ev-title">{evento.titulo}</div>
            <div className="ev-sub">{pr.done}/{pr.total} objetivos</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          {status === "ativo" && (
            <span className={`ep-time ${deadlineUrgency(evento.prazo)}`} style={{ fontSize: 11 }}>
              <ClockIcon /> até {fmtDeadlineShort(evento.prazo)}
            </span>
          )}
          {status === "concluido" && <span className="ep-badge done">Concluída{evento.concluidoEm ? ` em ${fmtDateTime(evento.concluidoEm)}` : ""}</span>}
          {status === "falha" && <span className="ep-badge fail">Falhou — prazo até {fmtDeadlineShort(evento.prazo)}</span>}
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(148,180,255,.12)", overflow: "hidden", marginBottom: 18 }}>
          <div style={{ height: "100%", borderRadius: 99, width: `${pr.pct * 100}%`, background: `hsl(${hue},65%,58%)`, transition: "width .4s" }} />
        </div>
        {evento.checklist.map((c, i) => (
          <div className={`ev-item${c.comprovado ? " done" : ""}`} style={{ "--eh": hue } as any} key={c.id}>
            <div className="ev-item-head">
              <span className="ev-check">{c.comprovado ? <CheckIcon /> : null}</span>
              <span className="ev-item-text">{c.titulo}</span>
              {!c.comprovado && status === "ativo" && (
                <button className="ev-attach" onClick={() => setAttachIdx(attachIdx === i ? null : i)}>Anexar relatório</button>
              )}
            </div>
            {attachIdx === i && (
              <div className="ev-picker">
                {planetReports.length ? planetReports.map((r) => (
                  <div className="ev-pick" key={r.id} onClick={() => pick(c.id, r.id)}>
                    <span className="pk-date">{fmtDateTime(r.createdAt)}</span> {r.conteudo.slice(0, 64)}{r.conteudo.length > 64 ? "…" : ""}
                  </div>
                )) : <div className="ep-empty">Nenhum relatório neste planeta ainda.<br />Escreva um na lua de Relatório!</div>}
                <button className="btn" style={{ width: "100%", fontSize: 11.5, padding: 6 }} onClick={() => setAttachIdx(null)}>Cancelar</button>
              </div>
            )}
          </div>
        ))}
        <div className="actions"><button className="btn" onClick={onClose}>Fechar</button></div>
      </div>
    </div>
  );
}
