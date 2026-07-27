import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { TipoPostagem } from "@project-fox/types";
import { CloseIcon, OrbitIcon, SendIcon } from "../../icons/index.js";
import { useAuth } from "../../auth/AuthContext.js";
import { supabase } from "../../lib/supabaseClient.js";
import { useToast } from "../../lib/toast.js";

export interface ShareMilestone {
  tipo: Exclude<TipoPostagem, "texto">;
  texto: string;
  dados: Record<string, unknown>;
  planetaId?: string;
  eventoId?: string;
  itemWishlistId?: string;
}

const ShareContext = createContext<(milestone: ShareMilestone) => void>(() => {});

export function SocialShareProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const toast = useToast();
  const [milestone, setMilestone] = useState<ShareMilestone | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  const offer = useCallback((next: ShareMilestone) => {
    setMilestone(next);
    setText(next.texto);
  }, []);

  async function share() {
    if (!session || !milestone) return;
    setPending(true);
    const { error } = await supabase.from("postagens").insert({
      user_id: session.user.id,
      tipo: milestone.tipo,
      texto: text.trim() || null,
      visibilidade: "amigos",
      dados: milestone.dados,
      planeta_id: milestone.planetaId ?? null,
      evento_id: milestone.eventoId ?? null,
      item_wishlist_id: milestone.itemWishlistId ?? null,
    });
    setPending(false);
    if (error) { toast(error.message); return; }
    setMilestone(null);
    toast("Conquista compartilhada com sua órbita.");
  }

  return <ShareContext.Provider value={offer}>
    {children}
    {milestone && <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) setMilestone(null); }}>
      <div className="modal" style={{ width: 430 }}>
        <div className="or-modal-head">
          <div><h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><OrbitIcon style={{ width: 19, color: "#aaa7ef" }} /> Compartilhar conquista?</h2><p>O app preparou o texto, mas só publica se você confirmar.</p></div>
          <button className="icon-btn" onClick={() => setMilestone(null)}><CloseIcon /></button>
        </div>
        <textarea style={{ width: "100%", minHeight: 100 }} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="actions" style={{ marginTop: 15 }}><button className="btn" onClick={() => setMilestone(null)}>Agora não</button><button className="btn primary" disabled={pending} onClick={share}><SendIcon /> Compartilhar</button></div>
      </div>
    </div>}
  </ShareContext.Provider>;
}

export function useOfferSocialShare() {
  return useContext(ShareContext);
}
