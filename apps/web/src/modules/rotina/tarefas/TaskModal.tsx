import { useState } from "react";
import type { SecaoTarefas } from "@project-fox/types";
import { CheckIcon, CloseIcon, PlusIcon } from "../../../icons/index.js";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { useToast } from "../../../lib/toast.js";
import { useEscapeToClose } from "../../../lib/useEscapeToClose.js";
import { useWishlist } from "../wishlist/useWishlist.js";
import { useTarefas } from "./useTarefas.js";

export function TaskModal({
  secoes, defaultSecaoId, defaultOrigemPlanetaId, onClose,
}: {
  secoes: SecaoTarefas[]; defaultSecaoId: string; defaultOrigemPlanetaId?: string; onClose: () => void;
}) {
  const { addTarefa } = useTarefas();
  const { items } = useWishlist();
  const toast = useToast();
  useEscapeToClose(onClose);
  const [titulo, setTitulo] = useState("");
  const [secaoId, setSecaoId] = useState(defaultSecaoId);
  const [prazo, setPrazo] = useState("");
  const [stages, setStages] = useState<string[]>([""]);
  const [financeira, setFinanceira] = useState(false);
  const [valor, setValor] = useState("");
  const [wishId, setWishId] = useState("");

  function setStage(i: number, v: string) {
    setStages((prev) => prev.map((s, idx) => (idx === i ? v : s)));
  }
  function removeStage(i: number) {
    if (stages.length > 1) setStages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    const title = titulo.trim();
    if (!title) { toast("Dê um título pra tarefa."); return; }
    const cleanStages = stages.map((s) => s.trim()).filter(Boolean);
    if (!cleanStages.length) { toast("Adicione pelo menos uma etapa."); return; }
    addTarefa.mutate(
      {
        titulo: title, secaoId, prazo: prazo || undefined, etapas: cleanStages,
        financeira, valorAlvo: financeira ? Number(valor) || 0 : undefined, wishlistRefId: financeira && wishId ? wishId : undefined,
        origemPlanetaId: defaultOrigemPlanetaId,
      },
      { onSuccess: onClose },
    );
  }

  const availableWishItems = items.filter((w) => !w.comprado);

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>Nova tarefa</h2>
        <div className="field"><label>Título</label>
          <input type="text" maxLength={50} placeholder="Ex.: Organizar o quarto" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div className="field"><label>Seção</label>
          <select value={secaoId} onChange={(e) => setSecaoId(e.target.value)}>
            {secoes.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className="field"><label>Prazo (opcional)</label>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
        <div className="field"><label>Etapas</label>
          <div>
            {stages.map((s, i) => (
              <div className="stage-input-row" key={i}>
                <input type="text" maxLength={60} placeholder="Ex.: Separar materiais" value={s} onChange={(e) => setStage(i, e.target.value)} />
                <button className="icon-btn" onClick={() => removeStage(i)}><CloseIcon /></button>
              </div>
            ))}
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center", fontSize: 12.5 }} onClick={() => setStages((prev) => [...prev, ""])}>
            <PlusIcon /> Adicionar etapa
          </button>
        </div>
        <div className="field">
          <div className={`check-row${financeira ? " sel" : ""}`} onClick={() => setFinanceira((v) => !v)}>
            <span className="cbox"><CheckIcon /></span> Tarefa financeira
          </div>
          <div className={`cascade${financeira ? " open" : ""}`}>
            <div className="cascade-inner">
              <div className="field" style={{ marginBottom: 12 }}><label>Valor a conquistar</label>
                <input type="number" min={0} step={10} placeholder="R$" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}><label>Referenciar desejo da wishlist</label>
                <select value={wishId} onChange={(e) => setWishId(e.target.value)}>
                  <option value="">Nenhum</option>
                  {availableWishItems.map((w) => <option key={w.id} value={w.id}>{w.nome} — {fmtBRL(w.valor)}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={addTarefa.isPending}>Criar tarefa</button>
        </div>
      </div>
    </div>
  );
}
