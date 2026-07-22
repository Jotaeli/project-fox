import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { SparkIcon } from "../icons/index.js";

const ToastContext = createContext<(text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((t: string) => {
    setText(t);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 3600);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div id="toast" className={show ? "show" : ""}>
        <span className="t-ic"><SparkIcon /></span>
        <span className="t-txt">{text}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
