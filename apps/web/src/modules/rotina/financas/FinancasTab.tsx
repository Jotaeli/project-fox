import { useState } from "react";
import type { Gasto, ModalidadeGasto } from "@project-fox/types";
import { CloseIcon, PlusIcon, SparkIcon } from "../../../icons/index.js";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { useToast } from "../../../lib/toast.js";
import { useWishlist } from "../wishlist/useWishlist.js";
import { DonutChart } from "./DonutChart.js";
import { Piggy } from "./Piggy.js";
import { useFinancas } from "./useFinancas.js";

function ModalityCard({ mod, gastos }: { mod: ModalidadeGasto; gastos: Gasto[] }) {
  const { marcarGastoPago, deleteGasto, addGasto } = useFinancas();
  const { items } = useWishlist();
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [val, setVal] = useState("");
  const [wishSel, setWishSel] = useState("");

  const planned = gastos.reduce((s, e) => s + e.valor, 0);
  const spentM = gastos.filter((e) => e.pago).reduce((s, e) => s + e.valor, 0);

  function submitFree() {
    const v = Number(val);
    if (!desc.trim() || !v) return;
    addGasto.mutate({ modalidadeId: mod.id, descricao: desc.trim(), valor: v });
    setDesc(""); setVal(""); setFormOpen(false);
  }
  function submitWish() {
    const w = items.find((i) => i.id === wishSel);
    if (!w) return;
    addGasto.mutate({ modalidadeId: mod.id, descricao: w.nome, valor: w.valor, itemWishlistId: w.id });
    setWishSel(""); setFormOpen(false);
  }

  const availableWishItems = items.filter((w) => !w.comprado && !gastos.some((g) => g.itemWishlistId === w.id));

  return (
    <div className="modality">
      <div className="mod-head">
        <span className="mod-name">{mod.fixa && <SparkIcon />}{mod.nome}</span>
        <button className="icon-btn" title="Adicionar gasto" onClick={() => setFormOpen((v) => !v)}><PlusIcon /></button>
      </div>
      <div className="mod-sub">{fmtBRL(spentM)} gastos de {fmtBRL(planned)} planejados</div>
      <div className="exp-list">
        {gastos.length === 0 && <div className="exp-empty">Nenhum gasto ainda</div>}
        {gastos.map((e) => {
          const w = items.find((i) => i.id === e.itemWishlistId);
          return (
            <div className={`exp-row${e.pago ? " spent" : ""}`} key={e.id}>
              <span className="exp-check" onClick={() => {
                marcarGastoPago.mutate(e, {
                  onSuccess: (novoPago) => {
                    if (w && novoPago) toast(`"${w.nome}" riscado da wishlist!`);
                  },
                });
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <span className="exp-label">
                {e.descricao}
                {w && <span className="chip wish" style={{ marginLeft: 6 }}><SparkIcon /> tier {w.tier}</span>}
              </span>
              <span className="exp-val">{fmtBRL(e.valor)}</span>
              <button className="icon-btn exp-x" onClick={() => deleteGasto.mutate(e.id)}><CloseIcon /></button>
            </div>
          );
        })}
      </div>
      {formOpen && (
        mod.fixa ? (
          <div className="inline-form">
            <select value={wishSel} onChange={(e) => setWishSel(e.target.value)}>
              <option value="">{availableWishItems.length ? "Selecione um desejo" : "(nenhum desejo disponível)"}</option>
              {availableWishItems.map((w) => <option key={w.id} value={w.id}>{w.nome} — {fmtBRL(w.valor)}</option>)}
            </select>
            <button className="btn" onClick={submitWish}>Alocar</button>
          </div>
        ) : (
          <div className="inline-form">
            <input type="text" maxLength={34} placeholder="Descrição do gasto" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <input type="number" min={0} step={10} placeholder="R$" value={val} onChange={(e) => setVal(e.target.value)} />
            <button className="btn" onClick={submitFree}>Ok</button>
          </div>
        )
      )}
    </div>
  );
}

export function FinancasTab() {
  const { rendas, modalidades, gastos, addRenda, deleteRenda, addModalidade } = useFinancas();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incName, setIncName] = useState("");
  const [incVal, setIncVal] = useState("");

  const totalIncome = rendas.reduce((s, i) => s + i.valor, 0);
  const totalSpent = gastos.filter((g) => g.pago).reduce((s, g) => s + g.valor, 0);
  const avail = Math.max(0, totalIncome - totalSpent);

  function submitIncome() {
    const v = Number(incVal);
    if (!incName.trim() || !v) return;
    addRenda.mutate({ fonte: incName.trim(), valor: v });
    setIncName(""); setIncVal(""); setIncomeOpen(false);
  }

  function novaModalidade() {
    const nome = prompt("Nome da modalidade (ex.: Transporte):");
    if (nome && nome.trim()) addModalidade.mutate(nome.trim());
  }

  const chartRows = modalidades.map((m) => ({
    nome: m.nome,
    total: gastos.filter((g) => g.modalidadeId === m.id).reduce((s, g) => s + g.valor, 0),
  }));

  return (
    <section className="tabpane sel">
      <div className="pane-head">
        <div>
          <div className="pane-title">Finanças</div>
          <div className="pane-sub">Marque um gasto como pago e veja o cofrinho reagir</div>
        </div>
        <button className="btn" onClick={novaModalidade}><PlusIcon /> Nova modalidade</button>
      </div>
      <div className="fin-grid">
        <div className="fin-left">
          <Piggy avail={avail} total={totalIncome} spent={totalSpent} />
          <div className="income-box">
            <div className="sec-label">
              Renda do mês
              <button className="icon-btn" onClick={() => setIncomeOpen((v) => !v)}><PlusIcon /></button>
            </div>
            <div id="incomeList">
              {rendas.map((inc) => (
                <div className={`income-row${inc.origemTarefaId ? " from-task" : ""}`} key={inc.id}>
                  <span className="in-name">{inc.origemTarefaId && <SparkIcon />}{inc.fonte}</span>
                  <span className="in-val">{fmtBRL(inc.valor)}</span>
                  <button className="icon-btn exp-x" onClick={() => deleteRenda.mutate(inc.id)}><CloseIcon /></button>
                </div>
              ))}
            </div>
            {incomeOpen && (
              <div className="inline-form">
                <input type="text" maxLength={30} placeholder="Fonte (ex: Emprego TI)" value={incName} onChange={(e) => setIncName(e.target.value)} />
                <input type="number" min={0} step={50} placeholder="R$" value={incVal} onChange={(e) => setIncVal(e.target.value)} />
                <button className="btn" onClick={submitIncome}>Ok</button>
              </div>
            )}
          </div>
          <DonutChart rows={chartRows} />
        </div>
        <div className="fin-right">
          {modalidades.map((m) => (
            <ModalityCard key={m.id} mod={m} gastos={gastos.filter((g) => g.modalidadeId === m.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
