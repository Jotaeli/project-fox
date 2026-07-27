import { useState } from "react";
import type { EspacoNotas } from "@project-fox/types";
import { CheckIcon, CloseIcon, PlusIcon, UsersIcon } from "../../icons/index.js";
import { useEscapeToClose } from "../../lib/useEscapeToClose.js";
import { useToast } from "../../lib/toast.js";
import { useAnotar } from "./useAnotar.js";

const COLORS = ["#7c72e8", "#4aa8d8", "#e174a7", "#52b98a", "#e0a855"];

function Avatar({ name, url }: { name: string; url?: string }) {
  return url ? <img className="note-space-avatar" src={url} alt="" /> : <span className="note-space-avatar">{name.charAt(0).toUpperCase()}</span>;
}

export function CreateNoteSpaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  useEscapeToClose(onClose);
  const data = useAnotar();
  const toast = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  async function create() {
    if (!name.trim()) return;
    try {
      const id = await data.createSpace.mutateAsync({ nome: name.trim(), cor: color });
      toast("Espaço compartilhado criado."); onCreated(id);
    } catch (error) { toast(error instanceof Error ? error.message : String(error)); }
  }
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal note-space-create-modal">
    <div className="note-space-modal-head"><div><span><UsersIcon /></span><div><h2>Novo espaço</h2><p>Um grafo separado para construir ideias em equipe.</p></div></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
    <div className="field"><label>Nome do espaço</label><input type="text" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Pesquisa do projeto" autoFocus /></div>
    <div className="field"><label>Cor</label><div className="note-space-colors">{COLORS.map((item) => <button key={item} className={item === color ? "selected" : ""} style={{ background: item }} onClick={() => setColor(item)} />)}</div></div>
    <div className="note-space-rule"><strong>Cada mapa é pessoal.</strong><span>Notas e conexões são compartilhadas; a posição dos nós é só sua.</span></div>
    <div className="actions"><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!name.trim() || data.createSpace.isPending} onClick={create}>Criar espaço</button></div>
  </div></div>;
}

export function NoteSpaceMembersModal({ space, onClose }: { space: EspacoNotas; onClose: () => void }) {
  useEscapeToClose(onClose);
  const data = useAnotar(space.id);
  const toast = useToast();
  const memberIds = new Set(space.membros.map((member) => member.userId));
  const available = data.friends.filter((friend) => !memberIds.has(friend.userId));
  async function invite(friendId: string) {
    try { await data.inviteMember.mutateAsync({ spaceId: space.id, friendId }); toast("Convite enviado."); }
    catch (error) { toast(error instanceof Error ? error.message : String(error)); }
  }
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal note-space-members-modal">
    <div className="note-space-modal-head"><div><span style={{ color: space.cor, background: `${space.cor}18` }}><UsersIcon /></span><div><h2>{space.nome}</h2><p>Conteúdo comum, organização visual individual.</p></div></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
    <section className="note-space-members"><h3>Membros</h3>{space.membros.map((member) => <div className={`note-space-person${member.status === "pendente" ? " pending" : ""}`} key={member.userId}>
      <Avatar name={member.nome} url={member.avatarUrl} /><span><strong>{member.userId === data.userId ? "Você" : member.nome}</strong><small>{member.status === "pendente" ? "Convite pendente" : member.papel === "dono" ? "Dono do espaço" : "Membro"}</small></span>{member.status === "aceito" && <CheckIcon />}
    </div>)}</section>
    {space.meuPapel === "dono" && <section className="note-space-members"><h3>Convidar da sua órbita</h3>{available.length ? available.map((friend) => <div className="note-space-person" key={friend.userId}>
      <Avatar name={friend.nome} url={friend.avatarUrl} /><span><strong>{friend.nome}</strong><small>{friend.handle ? `@${friend.handle}` : "Amigo"}</small></span><button className="btn" disabled={data.inviteMember.isPending} onClick={() => invite(friend.userId)}><PlusIcon /> Convidar</button>
    </div>) : <p className="note-space-empty">Todos os seus amigos já participam ou receberam convite.</p>}</section>}
    <div className="actions"><button className="btn" onClick={onClose}>Fechar</button></div>
  </div></div>;
}

export function NoteSpaceInvitesModal({ onClose, onAccepted }: { onClose: () => void; onAccepted: (id: string) => void }) {
  useEscapeToClose(onClose);
  const data = useAnotar();
  const toast = useToast();
  async function answer(id: string, accept: boolean) {
    try {
      await data.respondInvite.mutateAsync({ spaceId: id, accept });
      toast(accept ? "Espaço adicionado ao Anotar." : "Convite recusado.");
      if (accept) onAccepted(id); else if (data.spaceInvites.length <= 1) onClose();
    } catch (error) { toast(error instanceof Error ? error.message : String(error)); }
  }
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal note-space-invites-modal">
    <div className="note-space-modal-head"><div><span><UsersIcon /></span><div><h2>Convites para espaços</h2><p>Escolha os grafos colaborativos que entram no seu Anotar.</p></div></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
    {data.spaceInvites.map((invite) => <div className="note-space-invite" key={invite.id}><i style={{ background: invite.cor, boxShadow: `0 0 18px ${invite.cor}55` }} /><span><strong>{invite.nome}</strong><small>Espaço compartilhado de notas</small></span><button className="btn" onClick={() => answer(invite.id, false)}>Recusar</button><button className="btn primary" onClick={() => answer(invite.id, true)}>Aceitar</button></div>)}
    <div className="actions"><button className="btn" onClick={onClose}>Agora não</button></div>
  </div></div>;
}
