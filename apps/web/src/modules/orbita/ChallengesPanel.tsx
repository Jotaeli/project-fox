import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DesafioSocial } from "@project-fox/types";
import { AwardIcon, CheckIcon, ChecklistIcon, ClockIcon, CloseIcon, OrbitIcon, PlusIcon, TargetIcon, UsersIcon } from "../../icons/index.js";
import { useEstacao } from "../criar/useEstacao.js";
import { errorMessage } from "../../lib/errorMessage.js";
import { useToast } from "../../lib/toast.js";
import { useEscapeToClose } from "../../lib/useEscapeToClose.js";
import type { FriendSummary } from "./useOrbita.js";
import { useDesafios } from "./useDesafios.js";

const COLORS = ["#7c72e8", "#4aa8d8", "#e174a7", "#e0a855", "#52b98a"];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00`));
}

function daysUntil(date: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - today.getTime()) / 86400000);
}

export function ChallengesPanel({ friends }: { friends: FriendSummary[] }) {
  const data = useDesafios();
  const { estacao, ativar: ativarEstacao } = useEstacao();
  const navigate = useNavigate();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<DesafioSocial | null>(null);
  const [history, setHistory] = useState(false);
  const all = data.query.data;
  const myParticipants = all?.participantes.filter((p) => p.userId === data.userId) ?? [];
  const pending = myParticipants.filter((p) => p.status === "pendente");
  const visible = (all?.desafios ?? []).filter((d) => history ? d.status !== "ativo" : d.status === "ativo");

  async function act(action: () => Promise<unknown>, success: string) {
    try { await action(); toast(success); return true; }
    catch (e) { toast(errorMessage(e)); return false; }
  }

  if (data.query.isLoading) return <div className="challenge-loading">Preparando desafios…</div>;
  if (data.query.isError) return <div className="or-card or-error"><TargetIcon /><p>Não foi possível carregar os desafios.</p></div>;

  const estacaoAtiva = !!estacao?.ativa;

  async function ativar() {
    try {
      await ativarEstacao.mutateAsync();
      toast("Estação a caminho da sua órbita.");
      navigate("/criar?estacao=chegando");
    } catch (e) {
      toast(errorMessage(e));
    }
  }

  return <div className="challenge-panel">
    <div className="challenge-toolbar">
      <div className="challenge-filter"><button className={!history ? "active" : ""} onClick={() => setHistory(false)}>Ativos</button><button className={history ? "active" : ""} onClick={() => setHistory(true)}>Histórico</button></div>
      <button className="btn primary" onClick={() => setCreateOpen(true)} disabled={!friends.length || !estacaoAtiva}><PlusIcon /> Novo desafio</button>
    </div>

    {!estacaoAtiva && <section className="or-card station-gate">
      <span className="station-gate-icon"><OrbitIcon /></span>
      <h3>Ative sua estação</h3>
      <p>Os desafios são comprovados com relatórios escritos dentro da Estação Órbita — o corpo social do seu sistema solar. Ative para vê-la entrar em órbita no Criar.</p>
      <button className="btn primary" onClick={ativar} disabled={ativarEstacao.isPending}><OrbitIcon /> {ativarEstacao.isPending ? "Lançando…" : "Ativar estação"}</button>
    </section>}

    {!!pending.length && !history && <section className="challenge-invites">
      <header><UsersIcon /><span>Convites esperando você</span><b>{pending.length}</b></header>
      {pending.map((invite) => {
        const challenge = all?.desafios.find((d) => d.id === invite.desafioId);
        if (!challenge) return null;
        return <div className="challenge-invite" key={challenge.id}>
          <span className="challenge-symbol" style={{ color: challenge.cor, background: `${challenge.cor}18` }}><TargetIcon /></span>
          <span><strong>{challenge.titulo}</strong><small>até {formatDate(challenge.prazo)}</small></span>
          <button className="btn" onClick={() => act(() => data.respond.mutateAsync({ id: challenge.id, accept: false }), "Convite recusado.")}>Recusar</button>
          <button className="btn primary" onClick={() => act(() => data.respond.mutateAsync({ id: challenge.id, accept: true }), "Desafio aceito.")}>Aceitar</button>
        </div>;
      })}
    </section>}

    {!friends.length && !history && <section className="or-card challenge-no-friends"><UsersIcon /><h3>Desafios começam com companhia</h3><p>Adicione alguém à sua órbita para criar uma meta compartilhada.</p></section>}

    {visible.length ? <div className="challenge-grid">{visible.map((challenge) => {

      const participants = all?.participantes.filter((p) => p.desafioId === challenge.id && p.status === "aceito") ?? [];
      const objectives = all?.objetivos.filter((o) => o.desafioId === challenge.id) ?? [];
      const mine = all?.progresso.filter((p) => p.userId === data.userId && objectives.some((o) => o.id === p.objetivoId)).length ?? 0;
      const complete = participants.filter((p) => p.concluidoEm).length;
      return <button className="or-card challenge-card" key={challenge.id} onClick={() => setSelected(challenge)}>
        <span className="challenge-card-glow" style={{ background: challenge.cor }} />
        <header><span className="challenge-symbol" style={{ color: challenge.cor, background: `${challenge.cor}18` }}><TargetIcon /></span><span className={`challenge-status ${challenge.status}`}>{challenge.status}</span></header>
        <h3>{challenge.titulo}</h3>{challenge.descricao && <p>{challenge.descricao}</p>}
        <div className="challenge-deadline"><ClockIcon />{challenge.status === "ativo" ? `${Math.max(0, daysUntil(challenge.prazo))} dias restantes` : formatDate(challenge.prazo)}</div>
        <div className="challenge-progress"><div><span style={{ width: `${objectives.length ? mine / objectives.length * 100 : 0}%`, background: challenge.cor }} /></div><small>Você: {mine}/{objectives.length}</small></div>
        <footer><span><UsersIcon /> {participants.length} participantes</span><span><AwardIcon /> {complete}/{participants.length} concluíram</span></footer>
      </button>;
    })}</div> : !!friends.length && (estacaoAtiva || history) && <section className="or-card challenge-empty"><TargetIcon /><h3>{history ? "Nenhum desafio encerrado" : "Nenhum desafio ativo"}</h3><p>{history ? "Os concluídos e vencidos aparecerão aqui." : "Transforme uma meta em compromisso compartilhado."}</p>{!history && <button className="btn primary" onClick={() => setCreateOpen(true)}><PlusIcon /> Criar primeiro desafio</button>}</section>}

    {createOpen && <CreateChallengeModal friends={friends} pending={data.create.isPending} onClose={() => setCreateOpen(false)} onCreate={(input) => act(() => data.create.mutateAsync(input), "Desafio criado e convites enviados.").then((ok) => { if (ok) setCreateOpen(false); })} />}
    {selected && all && <ChallengeDetail challenge={selected} userId={data.userId!} participants={all.participantes.filter((p) => p.desafioId === selected.id)} objectives={all.objetivos.filter((o) => o.desafioId === selected.id)} progress={all.progresso} reports={data.reports.data ?? []} pending={data.prove.isPending} onClose={() => setSelected(null)} onProve={(objectiveId, reportId) => act(() => data.prove.mutateAsync({ objectiveId, reportId }), "Objetivo comprovado.")} />}
  </div>;
}

function CreateChallengeModal({ friends, pending, onClose, onCreate }: { friends: FriendSummary[]; pending: boolean; onClose: () => void; onCreate: (input: { titulo: string; descricao?: string; icone: string; cor: string; prazo: string; objetivos: string[]; convidados: string[] }) => void }) {
  useEscapeToClose(onClose);
  const min = new Date(); min.setDate(min.getDate() + 7);
  const max = new Date(); max.setDate(max.getDate() + 93);
  const initial = new Date(); initial.setDate(initial.getDate() + 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [deadline, setDeadline] = useState(iso(initial));
  const [color, setColor] = useState(COLORS[0]); const [objectives, setObjectives] = useState([""]); const [invited, setInvited] = useState<string[]>([]);
  const valid = title.trim() && objectives.some((o) => o.trim()) && invited.length && deadline >= iso(min) && deadline <= iso(max);
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal challenge-create-modal">
    <div className="or-modal-head"><div><h2>Novo desafio</h2><p>Todos recebem o mesmo checklist e comprovam o próprio progresso.</p></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
    <div className="field"><label>Título</label><input type="text" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: 30 dias colocando o projeto no ar" autoFocus /></div>
    <div className="field"><label>Descrição</label><textarea maxLength={240} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Por que vocês querem cumprir isso juntos?" /></div>
    <div className="challenge-form-row"><div className="field"><label>Prazo</label><input type="date" min={iso(min)} max={iso(max)} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div><div className="field"><label>Cor</label><div className="challenge-colors">{COLORS.map((c) => <button key={c} className={c === color ? "selected" : ""} style={{ background: c }} onClick={() => setColor(c)} />)}</div></div></div>
    <div className="field"><label>Checklist de cada participante</label><div className="challenge-objectives">{objectives.map((objective, i) => <div key={i}><span>{i + 1}</span><input type="text" maxLength={100} value={objective} onChange={(e) => setObjectives((list) => list.map((v, x) => x === i ? e.target.value : v))} placeholder="Objetivo comprovável" />{objectives.length > 1 && <button onClick={() => setObjectives((list) => list.filter((_, x) => x !== i))}><CloseIcon /></button>}</div>)}<button className="challenge-add-objective" onClick={() => setObjectives((list) => [...list, ""])}><PlusIcon /> Adicionar objetivo</button></div></div>
    <div className="field"><label>Convidar amigos</label><div className="challenge-friend-picker">{friends.map((friend) => <button key={friend.userId} className={invited.includes(friend.userId) ? "selected" : ""} onClick={() => setInvited((ids) => ids.includes(friend.userId) ? ids.filter((id) => id !== friend.userId) : [...ids, friend.userId])}><span>{friend.nome.charAt(0)}</span><strong>{friend.nome}</strong>{invited.includes(friend.userId) && <CheckIcon />}</button>)}</div></div>
    <div className="actions"><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!valid || pending} onClick={() => onCreate({ titulo: title.trim(), descricao: description.trim(), icone: "alvo", cor: color, prazo: deadline, objetivos: objectives.filter((o) => o.trim()).map((o) => o.trim()), convidados: invited })}>Criar e convidar</button></div>
  </div></div>;
}

function ChallengeDetail({ challenge, userId, participants, objectives, progress, reports, pending, onClose, onProve }: { challenge: DesafioSocial; userId: string; participants: any[]; objectives: any[]; progress: any[]; reports: any[]; pending: boolean; onClose: () => void; onProve: (objectiveId: string, reportId: string) => Promise<boolean> }) {
  useEscapeToClose(onClose);
  const [selectedReports, setSelectedReports] = useState<Record<string, string>>({});
  const accepted = participants.filter((p) => p.status === "aceito");
  const ownProgress = new Map(progress.filter((p) => p.userId === userId).map((p) => [p.objetivoId, p]));
  const totalProofs = (uid: string) => progress.filter((p) => p.userId === uid && objectives.some((o) => o.id === p.objetivoId)).length;
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal challenge-detail-modal">
    <div className="or-modal-head"><div><span className={`challenge-status ${challenge.status}`}>{challenge.status}</span><h2 style={{ marginTop: 9 }}>{challenge.titulo}</h2><p>{challenge.descricao || `Prazo: ${formatDate(challenge.prazo)}`}</p></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
    <section className="challenge-team-progress"><h3><UsersIcon /> Progresso do grupo</h3><div>{accepted.map((person) => <span key={person.userId} className={person.userId === userId ? "me" : ""}><i>{person.nome.charAt(0)}</i><strong>{person.userId === userId ? "Você" : person.nome}</strong><small>{totalProofs(person.userId)}/{objectives.length}</small>{person.concluidoEm && <CheckIcon />}</span>)}</div></section>
    <section className="challenge-my-list"><h3><ChecklistIcon /> Seu checklist</h3>{objectives.map((objective, i) => {
      const done = ownProgress.has(objective.id); const selected = selectedReports[objective.id] ?? "";
      return <div className={`challenge-proof-row${done ? " done" : ""}`} key={objective.id}><span className="challenge-proof-index">{done ? <CheckIcon /> : i + 1}</span><div><strong>{objective.titulo}</strong>{done ? <small>Comprovado com relatório</small> : reports.length ? <select value={selected} onChange={(e) => setSelectedReports((v) => ({ ...v, [objective.id]: e.target.value }))}><option value="">Escolha um relatório da estação</option>{reports.map((report) => <option key={report.id} value={report.id}>{report.conteudo.slice(0, 65)}</option>)}</select> : <small>Escreva um relatório dentro da estação, no Criar, para comprovar.</small>}</div>{!done && reports.length > 0 && <button className="btn" disabled={!selected || pending} onClick={() => onProve(objective.id, selected)}>Comprovar</button>}</div>;
    })}</section>
    <div className="challenge-detail-footer"><ClockIcon /> Prazo em {formatDate(challenge.prazo)} · cada pessoa comprova o próprio checklist.</div>
  </div></div>;
}
