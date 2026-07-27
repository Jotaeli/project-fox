// Passos interativos dos guias (Fase 4.6).
// Tudo aqui grava dado REAL — o que o usuário cria no card já nasce no módulo.

import { useState, type ReactNode } from "react";
import { CheckIcon } from "../icons/index.js";
import { useAnotar } from "../modules/anotar/useAnotar.js";
import { useCriar } from "../modules/criar/useCriar.js";
import { HUES, PLANET_TYPES, type TipoPlanetaKey } from "../modules/criar/criarConstants.js";
import { useFinancas } from "../modules/rotina/financas/useFinancas.js";
import { useTarefas } from "../modules/rotina/tarefas/useTarefas.js";
import { useWishlist } from "../modules/rotina/wishlist/useWishlist.js";
import { TIER_ORDER, TIERS } from "../modules/rotina/wishlist/wishConstants.js";
import type { TierWishlist } from "@project-fox/types";

function Done({ children }: { children: ReactNode }) {
  return (
    <div className="guide-done">
      <span className="guide-done-ic"><CheckIcon /></span>
      <span>{children}</span>
    </div>
  );
}

function Try({ children, onSubmit, disabled, pending, label = "Criar" }: {
  children: ReactNode; onSubmit: () => void; disabled?: boolean; pending?: boolean; label?: string;
}) {
  return (
    <form
      className="guide-try"
      onSubmit={(e) => { e.preventDefault(); if (!disabled && !pending) onSubmit(); }}
    >
      {children}
      <button type="submit" className="btn primary guide-try-submit" disabled={disabled || pending}>
        {pending ? "Salvando…" : label}
      </button>
    </form>
  );
}

export function RendaInteractive() {
  const { addRenda } = useFinancas();
  const [fonte, setFonte] = useState("");
  const [valor, setValor] = useState("");
  const [ok, setOk] = useState("");

  if (ok) return <Done>Renda de {ok} registrada — as moedas do cofrinho já contam com ela.</Done>;

  const num = Number(valor.replace(",", "."));
  return (
    <Try
      disabled={!fonte.trim() || !(num > 0)}
      pending={addRenda.isPending}
      label="Registrar renda"
      onSubmit={() =>
        addRenda.mutate(
          { fonte: fonte.trim(), valor: num },
          { onSuccess: () => setOk(num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })) },
        )
      }
    >
      <div className="guide-row">
        <label className="guide-f grow">
          <span>De onde vem</span>
          <input value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Salário, freela…" autoFocus />
        </label>
        <label className="guide-f">
          <span>Quanto</span>
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="3200" inputMode="decimal" />
        </label>
      </div>
    </Try>
  );
}

export function WishInteractive() {
  const { addItem } = useWishlist();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [tier, setTier] = useState<TierWishlist>("A");
  const [ok, setOk] = useState("");

  if (ok) return <Done>“{ok}” já está na sua tierlist. Você pode arrastar entre as tiers quando quiser.</Done>;

  const num = Number(valor.replace(",", "."));
  return (
    <Try
      disabled={!nome.trim() || !(num > 0)}
      pending={addItem.isPending}
      label="Adicionar à wishlist"
      onSubmit={() => {
        const n = nome.trim();
        addItem.mutate({ nome: n, valor: num, tier }, { onSuccess: () => setOk(n) });
      }}
    >
      <div className="guide-row">
        <label className="guide-f grow">
          <span>O que você quer</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Fone novo" autoFocus />
        </label>
        <label className="guide-f">
          <span>Valor</span>
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="450" inputMode="decimal" />
        </label>
      </div>
      <div className="guide-f">
        <span>Quanto você quer isso</span>
        <div className="tier-select">
          {TIER_ORDER.map((t) => (
            <button
              key={t} type="button"
              className={`tier-opt${tier === t ? " sel" : ""}`}
              style={{ "--to-c": TIERS[t].c, "--to-bg": TIERS[t].bg1 } as React.CSSProperties}
              onClick={() => setTier(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </Try>
  );
}

export function TarefaInteractive() {
  const { secoes, addTarefa } = useTarefas();
  const [titulo, setTitulo] = useState("");
  const [etapas, setEtapas] = useState(["", ""]);
  const [secaoId, setSecaoId] = useState("");
  const [prazo, setPrazo] = useState("");
  const [ok, setOk] = useState("");

  const secao = secaoId || secoes[0]?.id || "";
  if (ok) return <Done>“{ok}” está no topo da pilha. Assim que fechar o guia, ela aparece como AGORA.</Done>;

  const clean = etapas.map((e) => e.trim()).filter(Boolean);
  return (
    <Try
      disabled={!titulo.trim() || !clean.length || !secao}
      pending={addTarefa.isPending}
      label="Criar tarefa"
      onSubmit={() => {
        const t = titulo.trim();
        addTarefa.mutate(
          { titulo: t, secaoId: secao, prazo: prazo || undefined, etapas: clean, financeira: false },
          { onSuccess: () => setOk(t) },
        );
      }}
    >
      <label className="guide-f">
        <span>O que precisa ser feito</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Organizar o quarto" autoFocus />
      </label>
      <div className="guide-f">
        <span>Quebre em etapas (pelo menos uma)</span>
        {etapas.map((e, i) => (
          <div key={i} className="guide-step-row">
            <span className="guide-step-dot" />
            <input
              value={e}
              onChange={(ev) => setEtapas((prev) => prev.map((s, idx) => (idx === i ? ev.target.value : s)))}
              placeholder={i === 0 ? "Separar o que não uso" : "Doar o resto"}
            />
          </div>
        ))}
      </div>
      <div className="guide-row">
        <label className="guide-f grow">
          <span>Seção</span>
          <select value={secao} onChange={(e) => setSecaoId(e.target.value)}>
            {secoes.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </label>
        <label className="guide-f">
          <span>Prazo (opcional)</span>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </label>
      </div>
    </Try>
  );
}

export function NotaInteractive() {
  const { addNota } = useAnotar();
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [ok, setOk] = useState("");

  if (ok) return <Done>“{ok}” virou o primeiro nó do seu grafo.</Done>;

  return (
    <Try
      disabled={!titulo.trim()}
      pending={addNota.isPending}
      label="Criar nota"
      onSubmit={() => {
        const t = titulo.trim();
        addNota.mutate(
          {
            titulo: t, conteudo: conteudo.trim(), badges: [],
            posX: (Math.random() - 0.5) * 200, posY: (Math.random() - 0.5) * 200,
          },
          { onSuccess: () => setOk(t) },
        );
      }}
    >
      <label className="guide-f">
        <span>Título da nota</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ideia de projeto" autoFocus />
      </label>
      <label className="guide-f">
        <span>Conteúdo (opcional)</span>
        <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="O que você não quer esquecer…" />
      </label>
    </Try>
  );
}

export function PlanetaInteractive() {
  const { addPlaneta } = useCriar();
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tipo, setTipo] = useState<TipoPlanetaKey>("rochoso");
  const [hue, setHue] = useState(HUES[0]);
  const [ok, setOk] = useState("");

  if (ok) return <Done>{ok} está em órbita. Meta inicial: 3 relatórios por semana — dá pra mudar depois.</Done>;

  return (
    <Try
      disabled={!nome.trim() || !objetivo.trim()}
      pending={addPlaneta.isPending}
      label="Lançar planeta"
      onSubmit={() => {
        const n = nome.trim();
        addPlaneta.mutate(
          {
            nome: n, cor: String(hue), tipo, objetivoPrincipal: objetivo.trim(),
            metaSemanal: 3, temRecursos: false, temFotos: false,
          },
          { onSuccess: () => setOk(n) },
        );
      }}
    >
      <label className="guide-f">
        <span>Nome do planeta</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Violão" autoFocus />
      </label>
      <label className="guide-f">
        <span>Objetivo principal</span>
        <input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Tocar uma música inteira sem errar" />
      </label>
      <div className="guide-f">
        <span>Tipo</span>
        <div className="guide-pills">
          {PLANET_TYPES.map((p) => (
            <button key={p.id} type="button" className={`guide-pill${tipo === p.id ? " sel" : ""}`} onClick={() => setTipo(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="guide-f">
        <span>Cor</span>
        <div className="hue-swatches">
          {HUES.map((h) => (
            <button
              key={h} type="button" className={`hue-sw${hue === h ? " sel" : ""}`}
              style={{ background: `hsl(${h},60%,55%)` }} onClick={() => setHue(h)} aria-label={`cor ${h}`}
            />
          ))}
        </div>
      </div>
    </Try>
  );
}
