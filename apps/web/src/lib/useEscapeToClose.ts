import { useEffect } from "react";

/** Fecha o elemento chamador quando Esc é pressionado. */
export function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
}
