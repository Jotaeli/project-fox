import { useState } from "react";
import type { ItemWishlist, TierWishlist } from "@project-fox/types";
import { useCriar } from "../../criar/useCriar.js";
import { ExtIcon, ImageIcon, TrashIcon } from "../../../icons/index.js";
import { ConfirmDialog } from "../../../lib/ConfirmDialog.js";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { useEscapeToClose } from "../../../lib/useEscapeToClose.js";
import { hueFromId, photoStyle, TIER_ORDER, TIERS } from "./wishConstants.js";
import { useWishlist } from "./useWishlist.js";

export function WishDetail({ item, onClose }: { item: ItemWishlist; onClose: () => void }) {
  const { updateTier, updatePlaneta, deleteItem } = useWishlist();
  const { planetas } = useCriar();
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEscapeToClose(() => (confirmOpen ? setConfirmOpen(false) : onClose()));

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="wish-hero" style={item.foto ? { backgroundImage: `url(${item.foto})` } : photoStyle(hueFromId(item.id))}>
          {!item.foto && <ImageIcon />}
        </div>
        <h2 style={{ marginBottom: 12 }}>
          {item.nome} {item.comprado && <span style={{ fontSize: 11, color: "var(--green)" }}>✓ comprado</span>}
        </h2>
        <div className="wd-row"><b>{fmtBRL(item.valor)}</b></div>
        {item.descricao && <div className="wd-row" style={{ alignItems: "flex-start" }}><span style={{ lineHeight: 1.55 }}>{item.descricao}</span></div>}
        {item.link && <div className="wd-row"><ExtIcon /><a href={item.link} target="_blank" rel="noopener noreferrer">Link de compra</a></div>}
        <div className="field" style={{ marginTop: 16 }}>
          <label>Tier</label>
          <div className="tier-select">
            {TIER_ORDER.map((key) => (
              <div
                key={key}
                className={`tier-opt${item.tier === key ? " sel" : ""}`}
                style={{ "--to-c": TIERS[key].c, "--to-bg": TIERS[key].bg1 } as React.CSSProperties}
                onClick={() => key !== item.tier && updateTier.mutate({ id: item.id, tier: key as TierWishlist })}
              >
                {key}
              </div>
            ))}
          </div>
        </div>
        {planetas.length > 0 && (
          <div className="field">
            <label>Planeta relacionado</label>
            <select
              value={item.planetaId ?? ""}
              onChange={(e) => updatePlaneta.mutate({ id: item.id, planetaId: e.target.value || null })}
            >
              <option value="">Nenhum</option>
              {planetas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        )}
        <div className="actions">
          <button className="btn danger" style={{ marginRight: "auto" }} onClick={() => setConfirmOpen(true)}>
            <TrashIcon /> Excluir
          </button>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
      {confirmOpen && (
        <ConfirmDialog
          title="Excluir desejo?"
          message={<>"{item.nome}" será removido da wishlist. Essa ação não pode ser desfeita.</>}
          pending={deleteItem.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => deleteItem.mutate(item.id, { onSuccess: onClose })}
        />
      )}
    </div>
  );
}
