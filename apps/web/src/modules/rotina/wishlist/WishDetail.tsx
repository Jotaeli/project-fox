import type { ItemWishlist, TierWishlist } from "@project-fox/types";
import { ExtIcon, ImageIcon, TrashIcon } from "../../../icons/index.js";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { TIER_ORDER, TIERS } from "./wishConstants.js";
import { useWishlist } from "./useWishlist.js";

export function WishDetail({ item, onClose }: { item: ItemWishlist; onClose: () => void }) {
  const { updateTier, deleteItem } = useWishlist();

  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="wish-hero" style={item.foto ? { backgroundImage: `url(${item.foto})` } : undefined}>
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
        <div className="actions">
          <button
            className="btn"
            style={{ color: "#ff8f8f", marginRight: "auto" }}
            onClick={() => deleteItem.mutate(item.id, { onSuccess: onClose })}
          >
            <TrashIcon /> Excluir
          </button>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
