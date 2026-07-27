import { useEffect, useState } from "react";
import { CloseIcon } from "../icons/index.js";
import { GUIDES, type GuideKey } from "./guideContent.js";

export function GuideModal({ guideKey, onClose }: { guideKey: GuideKey; onClose: () => void }) {
  const guide = GUIDES[guideKey];
  const [i, setI] = useState(0);

  useEffect(() => setI(0), [guideKey]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((p) => Math.min(p + 1, guide.slides.length - 1));
      if (e.key === "ArrowLeft") setI((p) => Math.max(p - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guide.slides.length, onClose]);

  const slide = guide.slides[i];
  const last = i === guide.slides.length - 1;
  const Art = slide.art;
  const Interactive = slide.interactive;

  return (
    <div className="modal-wrap open guide-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal guide-modal" role="dialog" aria-label={`Guia — ${guide.titulo}`}>
        <button className="icon-btn guide-close" title="Fechar" onClick={onClose}><CloseIcon /></button>

        {Art && <div className="guide-art-box"><Art /></div>}

        <div className="guide-body">
          <span className="guide-kicker">{guide.titulo}</span>
          <h2>{slide.titulo}</h2>
          <p className="guide-text">{slide.texto}</p>
          {Interactive && <Interactive />}
        </div>

        <div className="guide-foot">
          <div className="guide-dots">
            {guide.slides.map((_, idx) => (
              <button
                key={idx}
                className={`guide-dot${idx === i ? " sel" : ""}`}
                onClick={() => setI(idx)}
                aria-label={`Passo ${idx + 1}`}
              />
            ))}
          </div>
          <div className="guide-nav">
            {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Voltar</button>}
            {last
              ? <button className="btn primary" onClick={onClose}>Entendi</button>
              : <button className="btn primary" onClick={() => setI(i + 1)}>Próximo</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
