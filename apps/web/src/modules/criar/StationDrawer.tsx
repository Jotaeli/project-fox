import { useMemo, useState } from "react";
import type { Planeta, Relatorio } from "@project-fox/types";
import { AwardIcon, CheckIcon, ClockIcon, CloseIcon, OrbitIcon, SendIcon, TargetIcon, UsersIcon } from "../../icons/index.js";
import { capFirst } from "../../lib/currentMonth.js";
import { errorMessage } from "../../lib/errorMessage.js";
import { useToast } from "../../lib/toast.js";
import { useDesafios } from "../orbita/useDesafios.js";
import { useCriar } from "./useCriar.js";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return capFirst(d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })) + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtPrazo(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00`));
}
function diasAte(date: string) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - hoje.getTime()) / 86400000);
}

export function StationDrawer({ estacao, relatorios, onClose }: { estacao: Planeta; relatorios: Relatorio[]; onClose: () => void }) {
  const { userId, amigosPlaneta, addRelatorio } = useCriar();
  const desafios = useDesafios();
  const toast = useToast();

  const dados = desafios.query.data;
  const ativos = useMemo(() => (dados?.desafios ?? []).filter((d) => d.status === "ativo"), [dados]);
  const [abaId, setAbaId] = useState<string | null>(null);
  const aba = abaId ?? ativos[0]?.id ?? "orbita";
  const desafio = ativos.find((d) => d.id === aba) ?? null;

  const meusRelatorios = useMemo(
    () => relatorios.filter((r) => r.planetaId === estacao.id && r.autorId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [relatorios, estacao.id, userId],
  );

  const objetivos = dados?.objetivos.filter((o) => o.desafioId === desafio?.id) ?? [];
  const participantes = dados?.participantes.filter((p) => p.desafioId === desafio?.id && p.status === "aceito") ?? [];
  const meuProgresso = new Map((dados?.progresso ?? []).filter((p) => p.userId === userId).map((p) => [p.objetivoId, p]));
  const provasDe = (uid: string) => (dados?.progresso ?? []).filter((p) => p.userId === uid && objetivos.some((o) => o.id === p.objetivoId)).length;

  const [texto, setTexto] = useState("");
  const [objetivoAlvo, setObjetivoAlvo] = useState("");
  const [anexos, setAnexos] = useState<Record<string, string>>({});

  const pendentes = objetivos.filter((o) => !meuProgresso.has(o.id));
  const enviando = addRelatorio.isPending || desafios.prove.isPending;

  async function enviarRelatorio() {
    const conteudo = texto.trim();
    if (!conteudo) return;
    try {
      const relatorioId = await addRelatorio.mutateAsync({ planetaId: estacao.id, conteudo });
      if (objetivoAlvo) {
        await desafios.prove.mutateAsync({ objectiveId: objetivoAlvo, reportId: relatorioId });
        toast("Relatório enviado e objetivo comprovado.");
      } else {
        toast("Relatório registrado na estação.");
      }
      setTexto(""); setObjetivoAlvo("");
    } catch (e) {
      toast(errorMessage(e));
    }
  }

  async function comprovarComExistente(objetivoId: string) {
    const relatorioId = anexos[objetivoId];
    if (!relatorioId) return;
    try {
      await desafios.prove.mutateAsync({ objectiveId: objetivoId, reportId: relatorioId });
      toast("Objetivo comprovado.");
    } catch (e) {
      toast(errorMessage(e));
    }
  }

  return (
    <aside className="drawer station open">
      <div className="dr-head">
        <span className="dr-icon station-icon"><OrbitIcon /></span>
        <div>
          <div className="dr-title">Estação Órbita</div>
          <div className="dr-sub">{ativos.length ? `${ativos.length} ${ativos.length > 1 ? "desafios ativos" : "desafio ativo"}` : "Nenhum desafio ativo"}</div>
        </div>
        <button className="dr-close" onClick={onClose}><CloseIcon /></button>
      </div>

      <div className="station-body">
        <nav className="station-nav">
          <div className="station-nav-label">Desafios</div>
          {ativos.length === 0 && <p className="station-nav-empty">Crie um desafio na Órbita para usar a estação.</p>}
          {ativos.map((d) => {
            const objs = dados?.objetivos.filter((o) => o.desafioId === d.id) ?? [];
            const feitos = objs.filter((o) => meuProgresso.has(o.id)).length;
            return (
              <button key={d.id} className={`station-nav-item${aba === d.id ? " active" : ""}`} onClick={() => setAbaId(d.id)}>
                <span className="station-nav-dot" style={{ background: d.cor }} />
                <span className="station-nav-name">{d.titulo}</span>
                <span className="station-nav-count">{feitos}/{objs.length}</span>
              </button>
            );
          })}
          <div className="station-nav-label">Estação</div>
          <button className={`station-nav-item${aba === "orbita" ? " active" : ""}`} onClick={() => setAbaId("orbita")}>
            <span className="station-nav-icon"><UsersIcon /></span>
            <span className="station-nav-name">Na sua órbita</span>
            <span className="station-nav-count">{amigosPlaneta.length}</span>
          </button>
        </nav>

        <div className="station-main">
          {aba === "orbita" ? (
            <div className="station-orbit-view">
              <h4>Quem gira com você</h4>
              <p className="station-hint">Estas são as pessoas que você pode desafiar. Convites e novos amigos vivem na aba Órbita.</p>
              {!amigosPlaneta.length && <div className="empty">Sua órbita está vazia.<br />Adicione alguém na aba Órbita para começar a desafiar.</div>}
              <div className="station-friends">
                {amigosPlaneta.map((amigo) => {
                  const juntos = ativos.filter((d) => (dados?.participantes ?? []).some((p) => p.desafioId === d.id && p.userId === amigo.userId && p.status === "aceito")).length;
                  return (
                    <div className="station-friend" key={amigo.userId}>
                      <span className="station-friend-avatar">{amigo.avatarUrl ? <img src={amigo.avatarUrl} alt="" /> : amigo.nome.charAt(0)}</span>
                      <div>
                        <strong>{amigo.nome}</strong>
                        {amigo.handle && <small>@{amigo.handle}</small>}
                      </div>
                      <span className="station-friend-tag">{juntos ? `${juntos} junto${juntos > 1 ? "s" : ""}` : "livre"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : desafio ? (
            <>
              <div className="station-challenge-head">
                <span className="station-challenge-symbol" style={{ color: desafio.cor, background: `${desafio.cor}18` }}><TargetIcon /></span>
                <div>
                  <h4>{desafio.titulo}</h4>
                  <div className="station-challenge-meta">
                    <ClockIcon /> {Math.max(0, diasAte(desafio.prazo))} dias restantes · até {fmtPrazo(desafio.prazo)}
                  </div>
                </div>
              </div>
              {desafio.descricao && <p className="station-challenge-desc">{desafio.descricao}</p>}

              <div className="station-team">
                {participantes.map((p) => (
                  <span key={p.userId} className={p.userId === userId ? "me" : ""} title={`${p.nome}: ${provasDe(p.userId)}/${objetivos.length}`}>
                    <i>{p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : p.nome.charAt(0)}</i>
                    <b>{p.userId === userId ? "Você" : p.nome.split(" ")[0]}</b>
                    <small>{provasDe(p.userId)}/{objetivos.length}</small>
                    {p.concluidoEm && <CheckIcon />}
                  </span>
                ))}
              </div>

              <div className="station-sec-label">Seu checklist</div>
              {objetivos.map((o, i) => {
                const feito = meuProgresso.has(o.id);
                return (
                  <div className={`station-goal${feito ? " done" : ""}`} key={o.id}>
                    <span className="station-goal-index">{feito ? <CheckIcon /> : i + 1}</span>
                    <div>
                      <strong>{o.titulo}</strong>
                      {feito ? (
                        <small>Comprovado</small>
                      ) : meusRelatorios.length ? (
                        <select value={anexos[o.id] ?? ""} onChange={(e) => setAnexos((v) => ({ ...v, [o.id]: e.target.value }))}>
                          <option value="">Usar um relatório já feito</option>
                          {meusRelatorios.map((r) => <option key={r.id} value={r.id}>{r.conteudo.slice(0, 60)}</option>)}
                        </select>
                      ) : (
                        <small>Escreva um relatório abaixo para comprovar.</small>
                      )}
                    </div>
                    {!feito && !!meusRelatorios.length && (
                      <button className="btn" disabled={!anexos[o.id] || enviando} onClick={() => comprovarComExistente(o.id)}>Comprovar</button>
                    )}
                  </div>
                );
              })}

              {!!meusRelatorios.length && (
                <>
                  <div className="station-sec-label">Relatórios da estação</div>
                  {meusRelatorios.slice(0, 8).map((r) => (
                    <div className="entry" key={r.id}>
                      <div className="e-date">{fmtDate(r.createdAt)}</div>
                      <div className="e-text">{r.conteudo}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="empty"><AwardIcon /><br />Nenhum desafio ativo agora.<br />A estação sai de órbita quando o último desafio termina.</div>
          )}
        </div>
      </div>

      {desafio && (
        <div className="dr-foot">
          <textarea placeholder={`O que você avançou em "${desafio.titulo}"?`} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div className="station-compose-row">
            <select value={objetivoAlvo} onChange={(e) => setObjetivoAlvo(e.target.value)} disabled={!pendentes.length}>
              <option value="">{pendentes.length ? "Só registrar (sem comprovar)" : "Todos os objetivos comprovados"}</option>
              {pendentes.map((o) => <option key={o.id} value={o.id}>Comprova: {o.titulo}</option>)}
            </select>
            <button className="btn primary" onClick={enviarRelatorio} disabled={!texto.trim() || enviando}>
              <SendIcon /> Enviar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
