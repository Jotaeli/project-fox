import type { ReactNode } from "react";

export function ConfirmDialog({
  title, message, confirmLabel = "Excluir", onConfirm, onCancel, pending,
}: {
  title: string; message: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; pending?: boolean;
}) {
  return (
    <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ width: 340 }}>
        <h2 style={{ marginBottom: 10 }}>{title}</h2>
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, marginBottom: 22 }}>{message}</p>
        <div className="actions">
          <button className="btn" onClick={onCancel}>Cancelar</button>
          <button className="btn danger" onClick={onConfirm} disabled={pending}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
