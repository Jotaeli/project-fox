import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { TipoReacao } from "@project-fox/types";
import { useAuth } from "../../auth/AuthContext.js";
import { useRegisterGuide } from "../../guides/GuideContext.js";
import {
  BellIcon, CheckIcon, CloseIcon, FlameIcon, OrbitIcon, PlanetIcon, RocketIcon,
  SearchIcon, SendIcon, ShieldIcon, SparkIcon, TargetIcon, UserIcon, UsersIcon,
} from "../../icons/index.js";
import { ConfirmDialog } from "../../lib/ConfirmDialog.js";
import { useToast } from "../../lib/toast.js";
import { getPublicProfile, searchProfiles, useOrbita, type FriendSummary, type PublicProfile } from "./useOrbita.js";
import { ChallengesPanel } from "./ChallengesPanel.js";
import "./orbita.css";

const reactions: { type: TipoReacao; label: string; Icon: typeof SparkIcon }[] = [
  { type: "faisca", label: "Faísca", Icon: SparkIcon },
  { type: "foguete", label: "Foguete", Icon: RocketIcon },
  { type: "chama", label: "Chama", Icon: FlameIcon },
  { type: "alvo", label: "Na mosca", Icon: TargetIcon },
];

function Avatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  return url
    ? <img className={`or-avatar ${size}`} src={url} alt="" />
    : <span className={`or-avatar fallback ${size}`}>{name.trim().charAt(0).toUpperCase() || "?"}</span>;
}

function since(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(iso));
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("amizades_par_unico")) return "Já existe uma solicitação ou amizade com essa pessoa.";
  if (message.includes("profiles_handle_formato")) return "O @ precisa ter 3 a 20 caracteres: letras minúsculas, números ou _.";
  if (message.includes("profiles_handle_key")) return "Esse @ já está em uso.";
  if (message.includes("cutucadas_de_id_para_id_dia_key")) return "Você já cutucou essa pessoa hoje.";
  return message;
}

export function OrbitaPage() {
  useRegisterGuide("orbita");
  const { session } = useAuth();
  const toast = useToast();
  const data = useOrbita(session?.user.id);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; nome: string; handle: string; avatarUrl: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<FriendSummary | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState<FriendSummary | null>(null);
  const [contentTab, setContentTab] = useState<"feed" | "desafios">("feed");

  const relations = data.relations.data ?? [];
  const friends = relations.filter((r) => r.direction === "friend");
  const incoming = relations.filter((r) => r.direction === "incoming");
  const knownIds = new Set(relations.map((r) => r.userId));
  const unread = (data.notifications.data ?? []).filter((n) => !n.lida).length;

  useEffect(() => {
    const term = search.trim().replace(/^@/, "").toLowerCase();
    if (term.length < 2) { setResults([]); return; }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try { setResults(await searchProfiles(term)); }
      catch (e) { toast(errorMessage(e)); }
      finally { setSearching(false); }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [search, toast]);

  async function openProfile(friend: FriendSummary) {
    setSelected(friend); setProfileLoading(true); setPublicProfile(null);
    try { setPublicProfile(await getPublicProfile(friend.userId)); }
    catch (e) { toast(errorMessage(e)); }
    finally { setProfileLoading(false); }
  }

  async function act(action: () => Promise<unknown>, success: string) {
    try { await action(); toast(success); return true; }
    catch (e) { toast(errorMessage(e)); return false; }
  }

  async function publish() {
    if (!text.trim()) return;
    await act(() => data.createPost.mutateAsync(text), "Compartilhado com sua órbita.");
    setText("");
  }

  return (
    <div className="orbita-page">
      <div className="or-aurora" aria-hidden="true" />

      <aside className="or-left">
        <section className="or-card or-self">
          <button className="or-self-main" onClick={() => setSettingsOpen(true)}>
            <Avatar name={data.profile.data?.nome ?? "Você"} url={data.profile.data?.avatarUrl} size="lg" />
            <span><strong>{data.profile.data?.nome ?? "Seu perfil"}</strong><small>{data.profile.data?.handle ? `@${data.profile.data.handle}` : "Escolha seu @"}</small></span>
          </button>
          <button className="or-edit-profile" onClick={() => setSettingsOpen(true)}>Editar perfil e privacidade</button>
        </section>

        <StreakCard streak={data.streak.data} activeDays={data.activityDays.data ?? []} loading={data.streak.isLoading} />

        {!!incoming.length && <section className="or-card">
          <header className="or-section-head"><span><UsersIcon /> Solicitações</span><b>{incoming.length}</b></header>
          <div className="or-people-list">
            {incoming.map((person) => <div className="or-person" key={person.friendshipId}>
              <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
              <button className="or-person-name" onClick={() => openProfile(person)}><strong>{person.nome}</strong><small>@{person.handle ?? "sem-handle"}</small></button>
              <button className="or-mini accept" title="Aceitar" onClick={() => act(() => data.answerFriendRequest.mutateAsync({ id: person.friendshipId, accept: true }), "Agora vocês estão na mesma órbita.")}><CheckIcon /></button>
              <button className="or-mini" title="Recusar" onClick={() => act(() => data.answerFriendRequest.mutateAsync({ id: person.friendshipId, accept: false }), "Solicitação recusada.")}><CloseIcon /></button>
            </div>)}
          </div>
        </section>}

        <section className="or-card or-friends-card">
          <header className="or-section-head"><span><OrbitIcon /> Sua órbita</span><b>{friends.length}</b></header>
          {friends.length ? <div className="or-people-list">
            {friends.map((person) => <button className="or-person clickable" key={person.friendshipId} onClick={() => openProfile(person)}>
              <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
              <span className="or-person-name"><strong>{person.nome}</strong><small>@{person.handle ?? "sem-handle"}</small></span>
              <span className="or-online-dot" />
            </button>)}
          </div> : <div className="or-empty-small"><UsersIcon /><span>Sua órbita começa quando você adiciona alguém.</span></div>}
        </section>
      </aside>

      <main className="or-feed">
        <header className="or-title">
          <div><span className="or-title-icon"><OrbitIcon /></span><span><h2>Órbita</h2><p>Conquistas ganham força quando circulam.</p></span></div>
          <nav className="or-content-tabs"><button className={contentTab === "feed" ? "active" : ""} onClick={() => setContentTab("feed")}>Feed</button><button className={contentTab === "desafios" ? "active" : ""} onClick={() => setContentTab("desafios")}>Desafios</button></nav>
        </header>

        {contentTab === "feed" ? <>
        <section className="or-card or-composer">
          <Avatar name={data.profile.data?.nome ?? "Você"} url={data.profile.data?.avatarUrl} />
          <div className="or-compose-body">
            <textarea maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="O que avançou hoje? Compartilhe somente o que você quiser." />
            <div className="or-compose-actions"><small>{text.length}/500 · visível para amigos</small><button className="btn primary" disabled={!text.trim() || data.createPost.isPending} onClick={publish}><SendIcon /> Compartilhar</button></div>
          </div>
        </section>

        {data.feed.isLoading ? <FeedSkeleton /> : data.feed.isError ? <ErrorState text="Não foi possível carregar o feed. A migration social pode ainda não estar aplicada." />
          : !data.feed.data?.length ? <section className="or-card or-empty-feed"><div className="or-empty-orbits"><i /><i /><i /><OrbitIcon /></div><h3>O espaço está quieto por enquanto</h3><p>Publique um avanço ou encontre alguém pelo @. Nenhum marco é compartilhado automaticamente.</p></section>
          : <div className="or-feed-list">{data.feed.data.map((post) => <article className="or-card or-post" key={post.id}>
              <header>
                <button className="or-author" onClick={() => {
                  const relation = relations.find((r) => r.userId === post.autorId);
                  if (relation) openProfile(relation);
                }}>
                  <Avatar name={post.autorNome} url={post.autorAvatar} />
                  <span><strong>{post.autorNome}</strong><small>{post.autorHandle ? `@${post.autorHandle}` : ""} · {since(post.createdAt)}</small></span>
                </button>
                <span className="or-post-type">{post.tipo === "texto" ? "AVANÇO" : post.tipo.replaceAll("_", " ").toUpperCase()}</span>
              </header>
              {post.texto && <p className="or-post-text">{post.texto}</p>}
              {post.tipo !== "texto" && <Milestone data={post.dados} />}
              <footer className="or-reactions">
                {reactions.map(({ type, label, Icon }) => <button key={type} className={post.minhaReacao === type ? "active" : ""} title={label}
                  onClick={() => act(() => data.react.mutateAsync({ postId: post.id, tipo: type, current: post.minhaReacao }), post.minhaReacao === type ? "Reação removida." : `${label} enviada.`)}>
                  <Icon /><span>{post.reacoes[type] || ""}</span>
                </button>)}
              </footer>
            </article>)}</div>}
        </> : <ChallengesPanel friends={friends} />}
      </main>

      <aside className="or-right">
        <RankingCard items={data.ranking.data ?? []} loading={data.ranking.isLoading} />

        <section className="or-card or-search">
          <header className="or-section-head"><span><SearchIcon /> Encontrar alguém</span></header>
          <div className="or-search-box"><SearchIcon /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pelo @" /></div>
          {searching && <small className="or-search-status">Procurando…</small>}
          {!!results.length && <div className="or-search-results">{results.map((person) => {
            const relation = relations.find((r) => r.userId === person.id);
            return <div className="or-person" key={person.id}>
              <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
              <span className="or-person-name"><strong>{person.nome}</strong><small>@{person.handle}</small></span>
              {relation ? <span className="or-relation-label">{relation.direction === "friend" ? "amigo" : relation.direction === "incoming" ? "responder" : "enviado"}</span>
                : <button className="or-add" onClick={() => act(() => data.sendFriendRequest.mutateAsync(person.id), "Solicitação enviada.")}>Adicionar</button>}
            </div>;
          })}</div>}
          {search.trim().length >= 2 && !searching && !results.length && <small className="or-search-status">Nenhum perfil descobrível encontrado.</small>}
          {search.trim().length < 2 && <p className="or-hint">Digite ao menos 2 caracteres do identificador.</p>}
        </section>

        <section className="or-card or-notifications">
          <header className="or-section-head"><span><BellIcon /> Notificações</span>{unread > 0 && <button onClick={() => act(() => data.markNotificationsRead.mutateAsync(), "Notificações marcadas como lidas.")}>Marcar lidas</button>}</header>
          {data.notifications.data?.length ? <div className="or-notification-list">{data.notifications.data.map((n) => <div className={`or-notification ${n.lida ? "" : "unread"}`} key={n.id}>
            <Avatar name={n.ator?.nome ?? "Fox"} url={n.ator?.avatarUrl} size="sm" />
            <span><p><strong>{n.ator?.nome ?? "Alguém"}</strong> {notificationText(n.tipo)}</p><small>{since(n.createdAt)}</small></span>
          </div>)}</div> : <div className="or-empty-small"><BellIcon /><span>Nenhuma novidade ainda.</span></div>}
        </section>

        <section className="or-privacy-note"><ShieldIcon /><p><strong>Você controla o que circula.</strong><br />Nada é publicado automaticamente.</p></section>
      </aside>

      {settingsOpen && data.profile.data && <ProfileSettings profile={data.profile.data} planets={data.planets.data ?? []} pending={data.updateProfile.isPending || data.uploadAvatar.isPending}
        onClose={() => setSettingsOpen(false)} onSave={(input) => act(() => data.updateProfile.mutateAsync(input), "Perfil atualizado.").then((ok) => { if (ok) setSettingsOpen(false); })}
        onAvatar={(file) => act(() => data.uploadAvatar.mutateAsync(file), "Foto de perfil atualizada.")} />}

      {selected && <PublicProfileModal friend={selected} profile={publicProfile} loading={profileLoading} onClose={() => { setSelected(null); setPublicProfile(null); }}
        onPoke={() => act(() => data.poke.mutateAsync({ targetId: selected.userId }), "Cutucada enviada.")}
        onRemove={() => act(() => data.removeFriend.mutateAsync(selected.friendshipId), "Pessoa removida da sua órbita.").then((ok) => { if (ok) setSelected(null); })}
        onBlock={() => setConfirmBlock(selected)} />}

      {confirmBlock && <ConfirmDialog title="Bloquear esta pessoa?" confirmLabel="Bloquear" message="Vocês deixarão de se ver, a amizade será removida e novas interações serão impedidas."
        onCancel={() => setConfirmBlock(null)} onConfirm={() => act(() => data.block.mutateAsync(confirmBlock.userId), "Pessoa bloqueada.").then((ok) => { if (ok) { setConfirmBlock(null); setSelected(null); } })} />}
    </div>
  );
}

function notificationText(type: string) {
  if (type === "amizade_pedido") return "quer entrar na sua órbita.";
  if (type === "amizade_aceita") return "aceitou sua solicitação.";
  if (type === "cutucada") return "deu uma cutucada para você voltar ao movimento.";
  if (type === "desafio_convite") return "convidou você para um desafio.";
  if (type === "desafio_aceito") return "aceitou seu desafio.";
  if (type === "desafio_concluido") return "ajudou a concluir um desafio.";
  if (type === "planeta_convite") return "convidou você para desenvolver um planeta em equipe.";
  if (type === "planeta_aceito") return "aceitou participar do seu planeta.";
  if (type === "espaco_notas_convite") return "convidou você para um espaço de notas.";
  if (type === "espaco_notas_aceito") return "aceitou participar do seu espaço de notas.";
  return "reagiu a uma publicação sua.";
}

function Milestone({ data }: { data: Record<string, unknown> }) {
  return <div className="or-milestone"><span><PlanetIcon /></span><div><strong>{String(data.titulo ?? data.nome ?? "Uma conquista")}</strong><small>{String(data.descricao ?? "Marco compartilhado")}</small></div></div>;
}

function FeedSkeleton() {
  return <div className="or-feed-list"><div className="or-card or-skeleton" /><div className="or-card or-skeleton short" /></div>;
}

function ErrorState({ text }: { text: string }) {
  return <section className="or-card or-error"><OrbitIcon /><p>{text}</p></section>;
}

function ProfileSettings({ profile, planets, pending, onClose, onSave, onAvatar }: {
  profile: ReturnType<typeof useOrbita>["profile"]["data"] & {}; planets: { id: string; nome: string; cor: string }[]; pending: boolean;
  onClose: () => void; onSave: (input: Record<string, unknown>) => void; onAvatar: (file: File) => void;
}) {
  const [form, setForm] = useState({ ...profile, handle: profile.handle ?? "", bio: profile.bio ?? "", planetaFavoritoId: profile.planetaFavoritoId ?? "" });
  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));
  const toggles = [
    ["descobrivel", "Permitir que encontrem meu @"], ["aceitaCutucadas", "Aceitar cutucadas"],
    ["mostrarPlanetaFavorito", "Mostrar planeta favorito"], ["mostrarMetaPrincipal", "Mostrar meta principal"],
    ["mostrarEventos", "Mostrar eventos ativos"], ["mostrarWishlist", "Mostrar destaque da wishlist"],
    ["mostrarStreak", "Aparecer no ranking de streak"],
  ] as const;
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal or-settings-modal">
      <header className="or-modal-head"><div><h2>Seu perfil na Órbita</h2><p>Escolha como seus amigos enxergam você.</p></div><button className="icon-btn" onClick={onClose}><CloseIcon /></button></header>
      <div className="or-avatar-edit"><Avatar name={profile.nome} url={profile.avatarUrl} size="lg" /><label className="btn">Trocar foto<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) onAvatar(file); e.target.value = ""; }} /></label></div>
      <div className="or-form-grid">
        <label>Nome<input type="text" maxLength={40} value={form.nome} onChange={(e) => set("nome", e.target.value)} /></label>
        <label>Identificador<div className="or-handle-input"><span>@</span><input type="text" maxLength={20} value={form.handle} onChange={(e) => set("handle", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} /></div></label>
      </div>
      <label className="or-form-label">Bio<textarea maxLength={160} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="O que você está colocando em movimento?" /></label>
      <label className="or-form-label">Planeta favorito<select value={form.planetaFavoritoId} onChange={(e) => set("planetaFavoritoId", e.target.value)}><option value="">Nenhum</option>{planets.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
      <div className="or-privacy-grid">{toggles.map(([key, label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} /></label>)}</div>
      <div className="actions"><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={pending || !form.nome.trim() || (!!form.handle && form.handle.length < 3)} onClick={() => onSave({ ...form, handle: form.handle || null, bio: form.bio || null, planetaFavoritoId: form.planetaFavoritoId || null })}>Salvar perfil</button></div>
    </div>
  </div>;
}

function StreakCard({ streak, activeDays, loading }: {
  streak?: { atual: number; recorde: number; ativos7d: number; congelamentoDisponivel: boolean; ativoHoje: boolean };
  activeDays: string[]; loading: boolean;
}) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - (6 - i));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "").slice(0, 3);
    return { key, label: i === 6 ? "Hoje" : weekday, active: activeDays.includes(key), today: i === 6 };
  }), [activeDays]);
  return <section className="or-card or-streak-card">
    <div className="or-streak-top"><span className={`or-streak-flame${streak?.ativoHoje ? " lit" : ""}`}><FlameIcon /></span><div><small>SEQUÊNCIA ATUAL</small><strong>{loading ? "—" : streak?.atual ?? 0} <em>dias</em></strong></div></div>
    <div className="or-week-dots">{days.map((day) => <span key={day.key} className={`${day.active ? "active" : ""}${day.today ? " today" : ""}`}><i>{day.active && <CheckIcon />}</i><small>{day.label}</small></span>)}</div>
    <div className="or-freeze-state"><ShieldIcon /><span>{streak?.congelamentoDisponivel ? "1 congelamento disponível nesta semana" : "Congelamento da semana já utilizado"}</span></div>
    <div className="or-streak-meta"><span>Recorde <b>{streak?.recorde ?? 0}</b></span><span>Últimos 7 dias <b>{streak?.ativos7d ?? 0}/7</b></span></div>
  </section>;
}

function RankingCard({ items, loading }: { items: { userId: string; nome: string; avatarUrl?: string; atual: number; ativos7d: number; eu: boolean }[]; loading: boolean }) {
  return <section className="or-card or-ranking-card">
    <header className="or-section-head"><span><TargetIcon /> Ranking da órbita</span><b>{items.length}</b></header>
    {loading ? <div className="or-ranking-loading">Calculando órbitas…</div> : items.length ? <div className="or-ranking-list">{items.slice(0, 8).map((person, index) => <div className={`or-rank-row${person.eu ? " me" : ""}`} key={person.userId}>
      <span className={`or-rank-pos p${index + 1}`}>{index + 1}</span><Avatar name={person.nome} url={person.avatarUrl} size="sm" />
      <span className="or-rank-name"><strong>{person.eu ? "Você" : person.nome}</strong><small>{person.ativos7d}/7 dias ativos</small></span>
      <span className="or-rank-score"><FlameIcon />{person.atual}</span>
    </div>)}</div> : <div className="or-empty-small"><TargetIcon /><span>Ative seu streak e convide amigos para formar o ranking.</span></div>}
  </section>;
}

function PublicProfileModal({ friend, profile, loading, onClose, onPoke, onRemove, onBlock }: {
  friend: FriendSummary; profile: PublicProfile | null; loading: boolean; onClose: () => void; onPoke: () => void; onRemove: () => void; onBlock: () => void;
}) {
  const meta = profile?.metaPrincipal;
  const planet = profile?.planetaFavorito;
  return <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal or-public-modal">
    <button className="icon-btn or-modal-close" onClick={onClose}><CloseIcon /></button>
    <div className="or-profile-hero"><Avatar name={friend.nome} url={friend.avatarUrl} size="lg" /><h2>{profile?.nome ?? friend.nome}</h2><span>@{profile?.handle ?? friend.handle ?? "sem-handle"}</span>{profile?.bio && <p>{profile.bio}</p>}</div>
    {loading ? <div className="or-profile-loading">Carregando perfil…</div> : <div className="or-profile-showcase">
      {planet && <div className="or-showcase-card planet"><PlanetIcon /><span><small>PLANETA FAVORITO</small><strong>{String(planet.nome)}</strong><p>{String(planet.objetivo_principal ?? "Em desenvolvimento")}</p></span></div>}
      {meta && <div className="or-showcase-card"><TargetIcon /><span><small>META PRINCIPAL</small><strong>{String(meta.titulo)}</strong><p>{String(meta.comprovados ?? 0)} de {String(meta.total ?? 0)} objetivos comprovados</p></span></div>}
      {!planet && !meta && <p className="or-private-empty"><ShieldIcon /> Esta pessoa manteve os detalhes do perfil reservados.</p>}
    </div>}
    {friend.direction === "friend" && <div className="or-profile-actions"><button className="btn primary" onClick={onPoke}><SparkIcon /> Cutucar</button><button className="btn" onClick={onRemove}>Desfazer amizade</button><button className="btn danger" onClick={onBlock}><ShieldIcon /> Bloquear</button></div>}
  </div></div>;
}
