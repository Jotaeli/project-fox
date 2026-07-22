import { useState, type ChangeEvent } from "react";
import type { TierWishlist } from "@project-fox/types";
import { TIER_ORDER, TIERS } from "./wishConstants.js";
import { useWishlist } from "./useWishlist.js";

export function WishModal({ onClose }: { onClose: () => void }) {
  const { addItem } = useWishlist();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [tier, setTier] = useState<TierWishlist>("A");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  function handleFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function submit() {
    if (!nome.trim()) return;
    addItem.mutate(
      { nome: nome.trim(), valor: Number(valor) || 0, tier, descricao: desc.trim() || undefined, link: link.trim() || undefined, fotoFile },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>Novo desejo</h2>
        <div className="field"><label>Nome</label>
          <input type="text" maxLength={40} placeholder="Ex.: Microfone Shure MV7" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="field"><label>Valor</label>
          <input type="number" min={0} step={10} placeholder="R$" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <div className="field"><label>Foto</label>
          <input type="file" accept="image/*" onChange={handleFoto} />
          {fotoPreview && <img src={fotoPreview} alt="" style={{ marginTop: 8, width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />}
        </div>
        <div className="field"><label>Descrição</label>
          <textarea maxLength={200} placeholder="Por que você quer isso?" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="field"><label>Link de compra (opcional)</label>
          <input type="text" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className="field"><label>Tier inicial</label>
          <div className="tier-select">
            {TIER_ORDER.map((key) => (
              <div
                key={key}
                className={`tier-opt${tier === key ? " sel" : ""}`}
                style={{ "--to-c": TIERS[key].c, "--to-bg": TIERS[key].bg1 } as React.CSSProperties}
                onClick={() => setTier(key)}
              >
                {key}
              </div>
            ))}
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={addItem.isPending}>Adicionar desejo</button>
        </div>
      </div>
    </div>
  );
}
