import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { GuideModal } from "./GuideModal.js";
import type { GuideKey } from "./guideContent.js";
import "./guides.css";
import { useGuias } from "./useGuias.js";

interface GuideCtx {
  activeKey: GuideKey | null;
  registerGuide: (key: GuideKey | null) => void;
  openGuide: () => void;
}

const Ctx = createContext<GuideCtx>({ activeKey: null, registerGuide: () => {}, openGuide: () => {} });

export function GuideProvider({ children }: { children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<GuideKey | null>(null);
  const [open, setOpen] = useState(false);
  const { vistos, loaded, markSeen } = useGuias();

  // Lido por ref para que o auto-abrir dependa só da aba + carregamento,
  // e não re-dispare quando marcamos o guia como visto.
  const vistosRef = useRef(vistos);
  vistosRef.current = vistos;

  useEffect(() => {
    if (!activeKey || !loaded) return;
    setOpen(!vistosRef.current?.[activeKey]);
  }, [activeKey, loaded]);

  const registerGuide = useCallback((key: GuideKey | null) => setActiveKey(key), []);
  const openGuide = useCallback(() => setOpen(true), []);

  const close = useCallback(() => {
    setOpen(false);
    if (activeKey && !vistosRef.current?.[activeKey]) markSeen.mutate(activeKey);
  }, [activeKey, markSeen]);

  return (
    <Ctx.Provider value={{ activeKey, registerGuide, openGuide }}>
      {children}
      {open && activeKey && <GuideModal guideKey={activeKey} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useGuideControls() {
  return useContext(Ctx);
}

/** Declara qual guia pertence à tela atual. Chame no topo de cada página/aba. */
export function useRegisterGuide(key: GuideKey) {
  const { registerGuide } = useGuideControls();
  useEffect(() => {
    registerGuide(key);
    return () => registerGuide(null);
  }, [key, registerGuide]);
}
