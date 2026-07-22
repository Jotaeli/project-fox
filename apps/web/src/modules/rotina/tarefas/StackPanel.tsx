import { useLayoutEffect, useRef, type DragEvent } from "react";
import type { SecaoTarefas, Tarefa } from "@project-fox/types";
import { ClockIcon, CoinIcon, GripIcon, PlusIcon, SparkIcon } from "../../../icons/index.js";
import { deadlineUrgency, fmtBRL, fmtDeadlineShort } from "../../../lib/currentMonth.js";
import type { ItemWishlist } from "@project-fox/types";
import { useTarefas } from "./useTarefas.js";

function StageDots({ tarefa }: { tarefa: Tarefa }) {
  const stages = tarefa.etapas.slice().sort((a, b) => a.ordem - b.ordem);
  const doneCount = stages.filter((s) => s.concluida).length;
  return (
    <div className="stage-dots">
      {stages.map((s, i) => (
        <span key={s.id} style={{ display: "contents" }}>
          <span className={`sd${s.concluida ? " done" : i === doneCount ? " current" : ""}`} />
          {i < stages.length - 1 && <span className={`sd-line${i < doneCount ? " done" : ""}`} />}
        </span>
      ))}
    </div>
  );
}

function TaskCard({
  tarefa, wish, onOpen, onDragStart, onDragOver, onDrop, draggable,
}: {
  tarefa: Tarefa; wish?: ItemWishlist; onOpen: () => void;
  onDragStart: (e: DragEvent) => void; onDragOver: (e: DragEvent) => void; onDrop: (e: DragEvent) => void; draggable: boolean;
}) {
  const stages = tarefa.etapas.slice().sort((a, b) => a.ordem - b.ordem);
  const done = stages.filter((s) => s.concluida).length;
  return (
    <div
      className="task-card"
      data-id={tarefa.id}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={(e) => (e.currentTarget as HTMLElement).classList.remove("dragging")}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onOpen}
    >
      {tarefa.prazo && (
        <span className={`task-deadline ${deadlineUrgency(tarefa.prazo)}`}>
          <ClockIcon /> {fmtDeadlineShort(tarefa.prazo)}
        </span>
      )}
      <div className="task-title">
        <span className="task-grip"><GripIcon /></span>
        <span className="task-title-text">{tarefa.titulo}</span>
      </div>
      <div className="task-meta">
        <span className="task-stage">etapa {Math.min(done + 1, stages.length)}/{stages.length}</span>
        <StageDots tarefa={tarefa} />
        {tarefa.financeira && <span className="chip money"><CoinIcon /> {fmtBRL(tarefa.valorAlvo ?? 0)}</span>}
        {wish && <span className="chip wish"><SparkIcon /> {wish.nome}</span>}
      </div>
    </div>
  );
}

export function StackPanel({
  sec, tasks, wishById, onOpenTask, onAddTask,
}: {
  sec: SecaoTarefas; tasks: Tarefa[]; wishById: (id?: string) => ItemWishlist | undefined;
  onOpenTask: (id: string) => void; onAddTask: () => void;
}) {
  const { updateSecaoSort, reorderTasks, moveTaskToSection } = useTarefas();
  const bodyRef = useRef<HTMLDivElement>(null);
  const beforeRects = useRef<Map<string, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.querySelectorAll<HTMLElement>(".task-card").forEach((el) => {
      const id = el.dataset.id!;
      const old = beforeRects.current.get(id);
      if (!old) return;
      const now = el.getBoundingClientRect();
      const dx = old.left - now.left, dy = old.top - now.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        el.animate(
          [{ transform: `translate(${dx}px,${dy}px)` }, { transform: "translate(0,0)" }],
          { duration: 320, easing: "cubic-bezier(.22,.7,.32,1)" },
        );
      }
    });
  });

  function captureRects() {
    const body = bodyRef.current;
    beforeRects.current = new Map();
    if (!body) return;
    body.querySelectorAll<HTMLElement>(".task-card").forEach((el) => {
      beforeRects.current.set(el.dataset.id!, el.getBoundingClientRect());
    });
  }

  function handleCardDrop(e: DragEvent, target: Tarefa) {
    e.preventDefault(); e.stopPropagation();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === target.id || sec.ordenacao !== "personalizado") return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const placeAfter = e.clientY >= rect.top + rect.height / 2;
    const ids = tasks.map((t) => t.id);
    const fromIdx = ids.indexOf(draggedId);
    if (fromIdx === -1) return;
    ids.splice(fromIdx, 1);
    let targetIdx = ids.indexOf(target.id);
    ids.splice(targetIdx + (placeAfter ? 1 : 0), 0, draggedId);
    captureRects();
    reorderTasks.mutate(ids);
  }

  function handleBodyDrop(e: DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("dragover");
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || tasks.some((t) => t.id === draggedId)) return;
    captureRects();
    moveTaskToSection.mutate({ taskId: draggedId, secaoId: sec.id });
  }

  const hueMatch = /hsl\((\d+)/.exec(sec.cor);
  const hue = hueMatch ? hueMatch[1] : "212";

  return (
    <div className="stack-panel">
      <div className="stack-head" style={{ "--sd-glow": `hsl(${hue},70%,60%)` } as React.CSSProperties}>
        <span className="section-dot" style={{ background: `hsl(${hue},65%,60%)` }} />
        <span className="section-name">{sec.nome}</span>
        <div className="section-filter">
          <button className={`sf-btn${sec.ordenacao === "personalizado" ? " sel" : ""}`} onClick={() => updateSecaoSort.mutate({ id: sec.id, ordenacao: "personalizado" })}>Personalizado</button>
          <button className={`sf-btn${sec.ordenacao === "data" ? " sel" : ""}`} onClick={() => updateSecaoSort.mutate({ id: sec.id, ordenacao: "data" })}>Data</button>
        </div>
        <button className="icon-btn" title="Adicionar tarefa nesta seção" onClick={onAddTask}><PlusIcon /></button>
      </div>
      <div
        className="section-body"
        ref={bodyRef}
        onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add("dragover"); }}
        onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove("dragover")}
        onDrop={handleBodyDrop}
      >
        {tasks.length === 0 && <div className="section-empty">Nenhuma tarefa aqui ainda.</div>}
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            tarefa={t}
            wish={wishById(t.wishlistRefId)}
            draggable={sec.ordenacao === "personalizado"}
            onOpen={() => onOpenTask(t.id)}
            onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); (e.currentTarget as HTMLElement).classList.add("dragging"); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => handleCardDrop(e, t)}
          />
        ))}
      </div>
    </div>
  );
}
