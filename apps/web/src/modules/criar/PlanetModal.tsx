import { useState } from "react";
import { AwardIcon, CameraIcon, LibraryIcon, ReportIcon } from "../../icons/index.js";
import { COLOR_NAMES, HUES, PLANET_TYPES, type TipoPlanetaKey } from "./criarConstants.js";
import { useCriar } from "./useCriar.js";

function TypeSwatch({ type, hue }: { type: TipoPlanetaKey; hue: number }) {
  const base = `hsl(${hue},55%,50%)`;
  if (type === "gasoso") {
    return (
      <div style={{
        width: 34, height: 34, borderRadius: "50%", margin: "0 auto 7px", position: "relative", overflow: "hidden",
        background: `radial-gradient(circle at 32% 30%, hsl(${hue},55%,70%), hsl(${hue},50%,36%))`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "repeating-linear-gradient(0deg, transparent 0 5px, rgba(0,0,0,.22) 5px 9px, transparent 9px 13px, rgba(255,255,255,.14) 13px 16px)",
        }} />
      </div>
    );
  }
  if (type === "anelado") {
    return (
      <div style={{
        width: 34, height: 34, borderRadius: "50%", margin: "0 auto 7px", position: "relative",
        background: `radial-gradient(circle at 32% 30%, hsl(${hue},55%,68%), hsl(${hue},50%,34%))`,
      }}>
        <div style={{
          position: "absolute", left: -9, right: -9, top: 11, height: 12, borderRadius: "50%",
          border: `2.5px solid hsla(${hue},60%,75%,.75)`, transform: "rotate(-14deg)",
        }} />
      </div>
    );
  }
  if (type === "gelado") {
    return (
      <div style={{
        width: 34, height: 34, borderRadius: "50%", margin: "0 auto 7px", position: "relative", overflow: "hidden",
        background: `radial-gradient(circle at 30% 28%, hsl(${hue},35%,90%), hsl(${hue},50%,58%) 55%, hsl(${hue},55%,34%))`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 65% 34% at 50% 6%, rgba(255,255,255,.95), transparent 72%),"
            + "radial-gradient(ellipse 58% 30% at 50% 97%, rgba(255,255,255,.85), transparent 72%)",
        }} />
      </div>
    );
  }
  return <div style={{ width: 34, height: 34, borderRadius: "50%", margin: "0 auto 7px", background: base }} />;
}

export function PlanetModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { addPlaneta } = useCriar();
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [hue, setHue] = useState(HUES[0]);
  const [tipo, setTipo] = useState<TipoPlanetaKey>("rochoso");
  const [temRecursos, setTemRecursos] = useState(false);
  const [temFotos, setTemFotos] = useState(false);
  const [meta, setMeta] = useState(3);

  function submit() {
    const nomeClean = nome.trim();
    if (!nomeClean) return;
    addPlaneta.mutate(
      {
        nome: nomeClean, cor: String(hue), tipo, objetivoPrincipal: objetivo.trim(),
        descricao: descricao.trim() || undefined, metaSemanal: meta, temRecursos, temFotos,
      },
      { onSuccess: (p) => onCreated(p.id) },
    );
  }

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>Novo planeta</h2>
        <div className="field">
          <label>Nome da área</label>
          <input type="text" maxLength={24} placeholder="Ex.: Esporte, Leitura, Música…" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Objetivo principal</label>
          <input type="text" maxLength={60} placeholder="Ex.: Ler 12 livros no ano" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
        </div>
        <div className="field">
          <label>Descrição</label>
          <textarea maxLength={140} style={{ minHeight: 52 }} placeholder="Por que essa área importa pra você?" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="field">
          <label>Cor</label>
          <div className="swatches">
            {HUES.map((h) => (
              <div key={h} className={`swatch${hue === h ? " sel" : ""}`} style={{ background: `hsl(${h},65%,55%)` }} title={COLOR_NAMES[h]} onClick={() => setHue(h)} />
            ))}
          </div>
        </div>
        <div className="field">
          <label>Tipo</label>
          <div className="type-grid">
            {PLANET_TYPES.map((t) => (
              <div key={t.id} className={`type-card${tipo === t.id ? " sel" : ""}`} onClick={() => setTipo(t.id)}>
                <TypeSwatch type={t.id} hue={hue} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Luas</label>
          <div className="moon-opts">
            <div className="moon-opt locked">
              <span className="mo-icon"><ReportIcon /></span>
              <span className="mo-txt"><span className="mo-name">Relatório</span><span className="mo-desc">Seus diários sobre esta área</span></span>
              <span className="mo-req">obrigatória</span>
            </div>
            <label className="moon-opt">
              <span className="mo-icon"><LibraryIcon /></span>
              <span className="mo-txt"><span className="mo-name">Recursos</span><span className="mo-desc">Livros, arquivos e materiais</span></span>
              <input type="checkbox" checked={temRecursos} onChange={(e) => setTemRecursos(e.target.checked)} />
            </label>
            <label className="moon-opt">
              <span className="mo-icon"><CameraIcon /></span>
              <span className="mo-txt"><span className="mo-name">Fotos</span><span className="mo-desc">Registros visuais das atividades</span></span>
              <input type="checkbox" checked={temFotos} onChange={(e) => setTemFotos(e.target.checked)} />
            </label>
          </div>
        </div>
        <div className="field">
          <label>Meta de relatórios</label>
          <input type="range" min={1} max={7} value={meta} onChange={(e) => setMeta(+e.target.value)} />
          <div className="meta-val"><b>{meta}×</b> por semana {meta === 7 ? "(todo dia)" : meta === 1 ? "(bem tranquilo)" : ""}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={addPlaneta.isPending}>Criar planeta</button>
        </div>
      </div>
    </div>
  );
}
