import { useState } from "react";
import { CloseIcon } from "../../icons/index.js";
import { useToast } from "../../lib/toast.js";
import { DEADLINES, GOAL_ICONS, HUES } from "./criarConstants.js";
import { useCriar } from "./useCriar.js";

export function GoalModal({ planetaId, planetaNome, onClose }: { planetaId: string; planetaNome: string; onClose: () => void }) {
  const { addEvento } = useCriar();
  const toast = useToast();
  const [titulo, setTitulo] = useState("");
  const [icone, setIcone] = useState(GOAL_ICONS[0].id);
  const [hue, setHue] = useState(HUES[0]);
  const [dias, setDias] = useState(30);
  const [items, setItems] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState("");

  function addItem() {
    const v = itemInput.trim();
    if (!v) return;
    setItems((prev) => [...prev, v]);
    setItemInput("");
  }

  function submit() {
    const t = titulo.trim();
    if (!t) { toast("Dê um título pra meta."); return; }
    if (!items.length) { toast("Adicione pelo menos um objetivo ao checklist."); return; }
    const prazo = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
    addEvento.mutate(
      { planetaId, titulo: t, icone, cor: String(hue), prazo, checklist: items },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 400 }}>
        <h2>Nova meta <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>· planeta {planetaNome}</span></h2>
        <div className="field">
          <label>Título</label>
          <input type="text" maxLength={48} placeholder="Ex.: Ler Dom Quixote" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Ícone</label>
          <div className="icon-grid">
            {GOAL_ICONS.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.id} className={`icon-opt${icone === g.id ? " sel" : ""}`} style={{ color: icone === g.id ? `hsl(${hue},75%,72%)` : undefined, borderColor: icone === g.id ? `hsla(${hue},65%,60%,.6)` : undefined, background: icone === g.id ? `hsla(${hue},60%,55%,.12)` : undefined }} onClick={() => setIcone(g.id)}>
                  <Icon />
                </div>
              );
            })}
          </div>
        </div>
        <div className="field">
          <label>Cor</label>
          <div className="swatches">
            {HUES.map((h) => (
              <div key={h} className={`swatch${hue === h ? " sel" : ""}`} style={{ background: `hsl(${h},65%,55%)` }} onClick={() => setHue(h)} />
            ))}
          </div>
        </div>
        <div className="field">
          <label>Prazo</label>
          <div className="dl-chips">
            {DEADLINES.map((dl) => (
              <div key={dl.d} className={`dl-chip${dias === dl.d ? " sel" : ""}`} onClick={() => setDias(dl.d)}>{dl.l}</div>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Checklist de objetivos</label>
          <div>
            {items.map((it, i) => (
              <div className="cl-item" key={i}>
                <span style={{ color: "var(--muted)" }}>{i + 1}.</span> {it}
                <button className="cl-x" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}><CloseIcon /></button>
              </div>
            ))}
          </div>
          <div className="add-row">
            <input type="text" maxLength={60} placeholder="Ex.: Terminar a Parte 1" value={itemInput}
              onChange={(e) => setItemInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addItem(); }} />
            <button className="btn" onClick={addItem}>Adicionar</button>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={addEvento.isPending}>Criar meta</button>
        </div>
      </div>
    </div>
  );
}
