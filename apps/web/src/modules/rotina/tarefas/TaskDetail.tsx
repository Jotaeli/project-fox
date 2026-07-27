import { useState } from "react";
import type { ItemWishlist, Tarefa } from "@project-fox/types";
import { CheckIcon, CoinIcon, SparkIcon, TrashIcon } from "../../../icons/index.js";
import { burstAt } from "../../../lib/burst.js";
import { ConfirmDialog } from "../../../lib/ConfirmDialog.js";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { useToast } from "../../../lib/toast.js";
import { useEscapeToClose } from "../../../lib/useEscapeToClose.js";
import { useTarefas } from "./useTarefas.js";

export function TaskDetail({ tarefa, wish, onClose }: { tarefa: Tarefa; wish?: ItemWishlist; onClose: () => void }) {
  const { avancarEtapa, desfazerEtapa, deleteTarefa } = useTarefas();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEscapeToClose(() => (confirmOpen ? setConfirmOpen(false) : onClose()));
  const stages = tarefa.etapas.slice().sort((a, b) => a.ordem - b.ordem);
  const doneCount = stages.filter((s) => s.concluida).length;
  const finished = doneCount === stages.length;

  function handleAdvance(e: React.MouseEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    avancarEtapa.mutate(tarefa, {
      onSuccess: (res) => {
        if (res.finished) {
          burstAt(rect.left + rect.width / 2, rect.top, ["#6ea8ff", "#ffd66e", "#4ade80", "#f472b6"]);
          if (tarefa.financeira && tarefa.valorAlvo) {
            toast(`${fmtBRL(tarefa.valorAlvo)} conquistados foram pro cofrinho!`);
          } else {
            toast("Tarefa concluída!");
          }
          setTimeout(onClose, 900);
        } else {
          burstAt(rect.left + rect.width / 2, rect.top, ["#6ea8ff", "#9fc3ff"]);
        }
      },
    });
  }

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2 style={{ marginBottom: 6 }}>{tarefa.titulo}</h2>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {tarefa.financeira && <span className="chip money"><CoinIcon /> conquista {fmtBRL(tarefa.valorAlvo ?? 0)}</span>}
          {wish && <span className="chip wish"><SparkIcon /> {wish.nome}</span>}
        </div>
        <div>
          {stages.map((s) => (
            <div
              key={s.id}
              className={`stage-line${s.concluida ? " done" : !s.concluida && s.ordem === doneCount ? " current" : ""}`}
              onClick={() => s.concluida && desfazerEtapa.mutate({ tarefa, etapaOrdem: s.ordem })}
            >
              <span className="stage-dot">{s.concluida && <CheckIcon />}</span>
              <span className="stage-txt">{s.titulo}</span>
            </div>
          ))}
        </div>
        <button className="btn primary advance-btn" disabled={finished} onClick={handleAdvance}>
          {finished ? "Tarefa concluída" : <><CheckIcon /> Concluir etapa</>}
        </button>
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn danger" style={{ marginRight: "auto" }} onClick={() => setConfirmOpen(true)}>
            <TrashIcon />
          </button>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
      {confirmOpen && (
        <ConfirmDialog
          title="Excluir tarefa?"
          message={<>A tarefa "{tarefa.titulo}" e suas etapas serão perdidas. Essa ação não pode ser desfeita.</>}
          pending={deleteTarefa.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => deleteTarefa.mutate(tarefa.id, { onSuccess: onClose })}
        />
      )}
    </div>
  );
}
