import { useEffect, useState, type DragEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { ItemWishlist, TierWishlist } from "@project-fox/types";
import { useCriar } from "../../criar/useCriar.js";
import { TiersArt } from "../../../guides/illustrations.js";
import { CoinIcon, ImageIcon, PlanetIcon, PlusIcon } from "../../../icons/index.js";
import { burstAt } from "../../../lib/burst.js";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { hueFromId, photoStyle, TIER_ORDER, TIERS } from "./wishConstants.js";
import { useWishlist } from "./useWishlist.js";
import { WishDetail } from "./WishDetail.js";
import { WishModal } from "./WishModal.js";

function WishCard({ item, planetaNome, onOpen }: { item: ItemWishlist; planetaNome?: string; onOpen: () => void }) {
  const t = TIERS[item.tier];
  return (
    <div
      className={`wish-card${item.comprado ? " bought" : ""}`}
      draggable
      style={{ "--wc": `${t.c}55`, "--wc-glow": `${t.c}33` } as React.CSSProperties}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", item.id); (e.currentTarget as HTMLElement).classList.add("dragging"); }}
      onDragEnd={(e) => (e.currentTarget as HTMLElement).classList.remove("dragging")}
      onClick={onOpen}
    >
      <div className="wish-photo" style={item.foto ? { backgroundImage: `url(${item.foto})` } : photoStyle(hueFromId(item.id))}>
        {!item.foto && <ImageIcon />}
      </div>
      <div className="wish-info">
        <div className="wish-name">{item.nome}</div>
        <div className="wish-price"><CoinIcon /> {fmtBRL(item.valor)}</div>
        {planetaNome && (
          <div className="wish-chips">
            <span className="chip planet"><PlanetIcon /> {planetaNome}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function WishlistTab() {
  const { items, updateTier } = useWishlist();
  const { planetas } = useCriar();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ItemWishlist | null>(null);
  const [searchParams] = useSearchParams();

  // deep link vindo da Home (destaque da wishlist): abre direto o item
  useEffect(() => {
    const iid = searchParams.get("item");
    if (!iid) return;
    const item = items.find((w) => w.id === iid);
    if (item) setDetailItem(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, items]);

  function handleDropOnTier(e: DragEvent, tier: TierWishlist) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("dragover");
    const draggedId = e.dataTransfer.getData("text/plain");
    const dragged = items.find((i) => i.id === draggedId);
    if (!dragged || dragged.tier === tier) return;
    const prevTier = dragged.tier;
    updateTier.mutate({ id: dragged.id, tier });
    const up = TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(prevTier);
    if (up) burstAt(e.clientX, e.clientY, [TIERS[tier].c, "#fff", TIERS[tier].c]);
  }

  const total = items.filter((w) => !w.comprado).reduce((s, w) => s + w.valor, 0);

  return (
    <section className="tabpane sel">
      <div className="pane-head">
        <div>
          <div className="pane-title">Wishlist Consumista</div>
          <div className="pane-sub">
            Arraste os desejos entre os tiers · <span className="wish-total">total dos desejos: <b>{fmtBRL(total)}</b></span>
          </div>
        </div>
        <button className="btn primary" onClick={() => setModalOpen(true)}><PlusIcon /> Adicionar desejo</button>
      </div>

      {items.length === 0 && (
        <div className="empty-hero" style={{ padding: "50px 0" }}>
          <TiersArt />
          <h3>Sua wishlist está vazia</h3>
          <p>Adicione o primeiro desejo e organize por tier — quanto mais alto, mais perto de virar realidade.</p>
        </div>
      )}

      <div id="tiers" style={items.length === 0 ? { display: "none" } : undefined}>
        {TIER_ORDER.map((key) => {
          const t = TIERS[key];
          const rowItems = items.filter((w) => w.tier === key);
          return (
            <div
              key={key}
              className="tier"
              data-tier={key}
              style={{ "--tc": t.c, "--tc-glow": `${t.c}66`, "--tc-bg1": t.bg1, "--tc-bg2": t.bg2 } as React.CSSProperties}
            >
              <div className="tier-label">
                <span className="tier-letter">{key}</span>
                <span className="tier-name">{t.name}</span>
              </div>
              <div
                className="tier-body"
                onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add("dragover"); }}
                onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove("dragover")}
                onDrop={(e) => handleDropOnTier(e, key)}
              >
                {rowItems.length === 0 && <div className="tier-empty">Arraste desejos para cá</div>}
                {rowItems.map((w) => (
                  <WishCard
                    key={w.id}
                    item={w}
                    planetaNome={planetas.find((p) => p.id === w.planetaId)?.nome}
                    onOpen={() => setDetailItem(w)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && <WishModal onClose={() => setModalOpen(false)} />}
      {detailItem && <WishDetail item={detailItem} onClose={() => setDetailItem(null)} />}
    </section>
  );
}
