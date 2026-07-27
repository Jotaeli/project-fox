import { useState, type DragEvent } from "react";
import type { SecaoTarefas } from "@project-fox/types";
import { PlusIcon, TrashIcon } from "../../../icons/index.js";
import { useToast } from "../../../lib/toast.js";
import { useEscapeToClose } from "../../../lib/useEscapeToClose.js";
import { HUES } from "../wishlist/wishConstants.js";
import { useTarefas } from "./useTarefas.js";

function NovaSecaoModal({ onClose }: { onClose: () => void }) {
  const { addSecao } = useTarefas();
  const toast = useToast();
  useEscapeToClose(onClose);
  const [nome, setNome] = useState("");
  const [hue, setHue] = useState(HUES[0]);

  function submit() {
    if (!nome.trim()) { toast("Dê um nome pra seção."); return; }
    addSecao.mutate({ nome: nome.trim(), cor: hue }, { onSuccess: onClose });
  }

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 360 }}>
        <h2>Nova seção</h2>
        <div className="field"><label>Nome</label>
          <input type="text" maxLength={24} placeholder="Ex.: Trabalho" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="field"><label>Cor</label>
          <div className="hue-swatches">
            {HUES.map((h) => (
              <div
                key={h}
                className={`hue-sw${hue === h ? " sel" : ""}`}
                style={{ background: `linear-gradient(135deg, hsl(${h},45%,38%), hsl(${(h + 40) % 360},55%,22%))` }}
                onClick={() => setHue(h)}
              />
            ))}
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit}>Criar seção</button>
        </div>
      </div>
    </div>
  );
}

export function SectionsNav({
  secoes, taskCounts, activeSectionId, onSelect,
}: {
  secoes: SecaoTarefas[]; taskCounts: Map<string, number>; activeSectionId: string; onSelect: (id: string) => void;
}) {
  const { deleteSecao, moveTaskToSection } = useTarefas();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  function handleDrop(e: DragEvent, secaoId: string) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("dragover");
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    moveTaskToSection.mutate({ taskId, secaoId });
  }

  return (
    <nav className="sections-nav">
      {secoes.map((sec) => {
        const hueMatch = /hsl\((\d+)/.exec(sec.cor);
        const hue = hueMatch ? hueMatch[1] : "212";
        return (
          <div
            key={sec.id}
            className={`section-nav-item${sec.id === activeSectionId ? " sel" : ""}`}
            style={{ "--sd-glow": `hsl(${hue},70%,60%)77` } as React.CSSProperties}
            onClick={() => onSelect(sec.id)}
            onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add("dragover"); }}
            onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove("dragover")}
            onDrop={(e) => handleDrop(e, sec.id)}
          >
            <span className="section-dot" style={{ background: `hsl(${hue},65%,60%)` }} />
            <span className="section-nav-name">{sec.nome}</span>
            <span className="section-nav-count">{taskCounts.get(sec.id) ?? 0}</span>
            {!sec.fixa && (
              <button
                className="icon-btn section-nav-del"
                title="Excluir seção"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSecao.mutate(sec.id, { onSuccess: () => { if (activeSectionId === sec.id) onSelect(""); toast("Seção excluída — tarefas movidas para Geral"); } });
                }}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        );
      })}
      <button className="btn section-nav-add" onClick={() => setModalOpen(true)}><PlusIcon /> Nova seção</button>
      {modalOpen && <NovaSecaoModal onClose={() => setModalOpen(false)} />}
    </nav>
  );
}
