import { useMemo, useState } from "react";
import type { SecaoTarefas, Tarefa } from "@project-fox/types";
import { CheckIcon, ChevIcon, CoinIcon, PlusIcon } from "../../../icons/index.js";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { useWishlist } from "../wishlist/useWishlist.js";
import { SectionsNav } from "./SectionsNav.js";
import { StackPanel } from "./StackPanel.js";
import { TaskDetail } from "./TaskDetail.js";
import { TaskModal } from "./TaskModal.js";
import { isTarefaConcluida, useTarefas } from "./useTarefas.js";

function tasksForSection(sec: SecaoTarefas, tasks: Tarefa[]): Tarefa[] {
  const items = tasks.filter((t) => t.secaoId === sec.id && !isTarefaConcluida(t));
  if (sec.ordenacao === "data") {
    const withDl = items.filter((t) => t.prazo).sort((a, b) => (a.prazo! < b.prazo! ? -1 : 1));
    const withoutDl = items.filter((t) => !t.prazo);
    return [...withDl, ...withoutDl];
  }
  return items.slice().sort((a, b) => a.ordem - b.ordem);
}

export function TarefasTab() {
  const { secoes, tarefas, isLoading } = useTarefas();
  const { items } = useWishlist();
  const [activeSectionId, setActiveSectionId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);

  const geral = secoes.find((s) => s.fixa);
  const effectiveActiveId = secoes.find((s) => s.id === activeSectionId)?.id ?? geral?.id ?? "";
  const activeSec = secoes.find((s) => s.id === effectiveActiveId);

  const taskCounts = useMemo(() => {
    const m = new Map<string, number>();
    tarefas.filter((t) => !isTarefaConcluida(t)).forEach((t) => m.set(t.secaoId, (m.get(t.secaoId) ?? 0) + 1));
    return m;
  }, [tarefas]);

  const doneTasks = useMemo(() => tarefas.filter(isTarefaConcluida).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [tarefas]);
  const wishById = (id?: string) => (id ? items.find((w) => w.id === id) : undefined);
  const detailTarefa = detailId ? tarefas.find((t) => t.id === detailId) : undefined;

  if (isLoading || !activeSec) {
    return <section className="tabpane sel"><div className="pane-head"><div className="pane-title">Tarefas</div></div></section>;
  }

  return (
    <section className="tabpane sel">
      <div className="pane-head">
        <div>
          <div className="pane-title">Tarefas</div>
          <div className="pane-sub">A pilha define a prioridade</div>
        </div>
        <button className="btn primary" onClick={() => setModalOpen(true)}><PlusIcon /> Adicionar tarefa</button>
      </div>
      <div className="tasks-layout">
        <SectionsNav secoes={secoes} taskCounts={taskCounts} activeSectionId={effectiveActiveId} onSelect={(id) => setActiveSectionId(id || geral?.id || "")} />
        <StackPanel
          sec={activeSec}
          tasks={tasksForSection(activeSec, tarefas)}
          wishById={wishById}
          onOpenTask={setDetailId}
          onAddTask={() => setModalOpen(true)}
        />
      </div>
      <div className="done-fold">
        <button className="btn" onClick={() => setDoneOpen((v) => !v)}><ChevIcon /> Concluídas ({doneTasks.length})</button>
      </div>
      <div className={`done-list${doneOpen ? " open" : ""}`}>
        {doneTasks.map((t) => (
          <div className="done-item" key={t.id}>
            <CheckIcon /> {t.titulo}
            {t.financeira && <span className="chip money" style={{ marginLeft: "auto" }}><CoinIcon /> {fmtBRL(t.valorAlvo ?? 0)}</span>}
          </div>
        ))}
      </div>

      {modalOpen && <TaskModal secoes={secoes} defaultSecaoId={effectiveActiveId} onClose={() => setModalOpen(false)} />}
      {detailTarefa && <TaskDetail tarefa={detailTarefa} wish={wishById(detailTarefa.wishlistRefId)} onClose={() => setDetailId(null)} />}
    </section>
  );
}
