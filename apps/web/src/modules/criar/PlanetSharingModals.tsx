import { useState } from "react";
import type { Planeta } from "@project-fox/types";
import { CheckIcon, CloseIcon, PlusIcon, UsersIcon } from "../../icons/index.js";
import { useEscapeToClose } from "../../lib/useEscapeToClose.js";
import { useToast } from "../../lib/toast.js";
import { memberHealth, useCriar } from "./useCriar.js";

function Avatar({ name, url }: { name: string; url?: string }) {
  return url ? <img className="planet-member-avatar" src={url} alt="" /> : <span className="planet-member-avatar">{name.charAt(0).toUpperCase()}</span>;
}

export function PlanetMembersModal({ planeta, onClose }: { planeta: Planeta; onClose: () => void }) {
  useEscapeToClose(onClose);
  const data = useCriar();
  const toast = useToast();
  const [meta, setMeta] = useState(planeta.metaSemanal);
  const accepted = planeta.membros.filter((m) => m.status === "aceito");
  const memberIds = new Set(planeta.membros.map((m) => m.userId));
  const available = data.amigosPlaneta.filter((friend) => !memberIds.has(friend.userId));

  async function act(action: () => Promise<unknown>, success: string) {
    try { await action(); toast(success); }
    catch (error) { toast(error instanceof Error ? error.message : String(error)); }
  }

  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal planet-sharing-modal">
      <div className="planet-sharing-head"><div><span><UsersIcon /></span><div><h2>{planeta.nome} em equipe</h2><p>A saúde do planeta é a média do ritmo de cada membro.</p></div></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>

      <section className="planet-members-list">
        <h3>Membros</h3>
        {accepted.map((member) => {
          const h = memberHealth(planeta, data.relatorios, member);
          return <div className="planet-member-row" key={member.userId}>
            <span className="planet-member-ring" style={{ background: `conic-gradient(hsl(${planeta.cor},65%,58%) ${h * 100}%, rgba(148,180,255,.12) 0)` }}><Avatar name={member.nome} url={member.avatarUrl} /></span>
            <span><strong>{member.userId === data.userId ? "Você" : member.nome}</strong><small>{member.papel === "dono" ? "Dono" : "Membro"} · meta {member.metaSemanal}×/semana</small></span>
            <b>{Math.round(h * 100)}%</b>
          </div>;
        })}
        {planeta.membros.filter((m) => m.status === "pendente").map((member) => <div className="planet-member-row pending" key={member.userId}>
          <Avatar name={member.nome} url={member.avatarUrl} /><span><strong>{member.nome}</strong><small>Convite pendente</small></span>
        </div>)}
      </section>

      <section className="planet-member-goal">
        <div><h3>Sua meta semanal</h3><p>Cada pessoa escolhe o próprio ritmo.</p></div><strong>{meta}×</strong>
        <input type="range" min={1} max={7} value={meta} onChange={(e) => setMeta(+e.target.value)} />
        <button className="btn" disabled={meta === planeta.metaSemanal || data.updateMemberGoal.isPending} onClick={() => act(() => data.updateMemberGoal.mutateAsync({ planetaId: planeta.id, meta }), "Sua meta foi atualizada.")}><CheckIcon /> Salvar meta</button>
      </section>

      {planeta.meuPapel === "dono" && <section className="planet-invite-list">
        <h3>Convidar da sua órbita</h3>
        {available.length ? available.map((friend) => <div className="planet-invite-row" key={friend.userId}>
          <Avatar name={friend.nome} url={friend.avatarUrl} /><span><strong>{friend.nome}</strong><small>{friend.handle ? `@${friend.handle}` : "Amigo"}</small></span>
          <button className="btn" disabled={data.inviteMember.isPending} onClick={() => act(() => data.inviteMember.mutateAsync({ planetaId: planeta.id, friendId: friend.userId }), "Convite enviado.")}><PlusIcon /> Convidar</button>
        </div>) : <p className="planet-sharing-empty">Todos os seus amigos já participam ou receberam convite.</p>}
      </section>}
      <div className="actions"><button className="btn" onClick={onClose}>Fechar</button></div>
    </div>
  </div>;
}

export function PlanetInvitesModal({ onClose }: { onClose: () => void }) {
  useEscapeToClose(onClose);
  const data = useCriar();
  const toast = useToast();
  async function answer(planetaId: string, accept: boolean) {
    try {
      await data.respondInvite.mutateAsync({ planetaId, accept });
      toast(accept ? "Planeta adicionado ao seu sistema." : "Convite recusado.");
      if (data.convitesPlaneta.length <= 1) onClose();
    } catch (error) { toast(error instanceof Error ? error.message : String(error)); }
  }
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal planet-invites-modal">
      <div className="planet-sharing-head"><div><span><UsersIcon /></span><div><h2>Convites para planetas</h2><p>Entre em sistemas criados com pessoas da sua órbita.</p></div></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
      {data.convitesPlaneta.map(({ planeta }) => <div className="planet-invite-card" key={planeta.id}>
        <i style={{ background: `hsl(${planeta.cor},65%,58%)`, boxShadow: `0 0 24px hsl(${planeta.cor} 65% 58% / .35)` }} />
        <span><strong>{planeta.nome}</strong><small>{planeta.objetivo_principal}</small></span>
        <button className="btn" onClick={() => answer(planeta.id, false)}>Recusar</button>
        <button className="btn primary" onClick={() => answer(planeta.id, true)}>Aceitar</button>
      </div>)}
      <div className="actions"><button className="btn" onClick={onClose}>Agora não</button></div>
    </div>
  </div>;
}
