import { ArrowRightIcon, BellIcon, FlameIcon, OrbitIcon, ShieldIcon, TargetIcon, UsersIcon } from "../../icons/index.js";
import type { HomeSocialChallenge, HomeSocialPost } from "./useHomeSocial.js";

function since(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  return `${Math.floor(seconds / 86400)} d`;
}

function postLabel(post: HomeSocialPost) {
  if (post.texto) return post.texto;
  if (post.tipo === "evento_concluido") return "concluiu uma meta";
  if (post.tipo === "planeta_criado") return "criou um novo planeta";
  if (post.tipo === "marco_relatorios") return "alcançou um marco de relatórios";
  if (post.tipo === "wishlist_comprado") return "conquistou um item da wishlist";
  if (post.tipo === "marco_streak") return "alcançou um marco de sequência";
  if (post.tipo === "desafio_vencido") return "concluiu um desafio";
  return "compartilhou um avanço";
}

function challengeDue(challenge: HomeSocialChallenge) {
  const end = new Date(`${challenge.prazo}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return "termina hoje";
  if (days === 1) return "termina amanhã";
  return `${days} dias restantes`;
}

export function SocialStrip({ data, loading, onOpen }: {
  data?: {
    streak: { atual: number; ativoHoje: boolean; congelamentoDisponivel: boolean };
    latestPost?: HomeSocialPost;
    challenge?: HomeSocialChallenge;
    unread: number;
    friends: number;
  };
  loading: boolean;
  onOpen: () => void;
}) {
  return <section className="home-social-section">
    <header className="home-social-head">
      <div><OrbitIcon /><h2>Sua órbita</h2>{!loading && <span>{data?.friends ?? 0} conexões</span>}</div>
      <button onClick={onOpen}>Abrir Órbita <ArrowRightIcon /></button>
    </header>

    <div className={`home-social-strip${loading ? " loading" : ""}`}>
      <button className="home-social-card streak" onClick={onOpen}>
        <span className={`home-social-icon${data?.streak.ativoHoje ? " active" : ""}`}><FlameIcon /></span>
        <span className="home-social-copy"><small>SEQUÊNCIA</small><strong>{loading ? "—" : `${data?.streak.atual ?? 0} dias`}</strong><em>{data?.streak.ativoHoje ? "ritmo de hoje garantido" : data?.streak.congelamentoDisponivel ? "1 congelamento disponível" : "volte ao movimento hoje"}</em></span>
      </button>

      <button className="home-social-card pulse" onClick={onOpen}>
        {data?.latestPost ? <>
          {data.latestPost.autorAvatar ? <img src={data.latestPost.autorAvatar} alt="" /> : <span className="home-social-avatar">{data.latestPost.autorNome.charAt(0).toUpperCase()}</span>}
          <span className="home-social-copy"><small>PULSO RECENTE · {since(data.latestPost.createdAt)}</small><strong>{data.latestPost.autorNome}</strong><em>{postLabel(data.latestPost)}</em></span>
        </> : <><span className="home-social-icon"><UsersIcon /></span><span className="home-social-copy"><small>PULSO RECENTE</small><strong>A órbita está quieta</strong><em>Encontre alguém ou compartilhe um avanço.</em></span></>}
      </button>

      <button className="home-social-card challenge" onClick={onOpen} style={data?.challenge ? { "--social-color": data.challenge.cor } as React.CSSProperties : undefined}>
        <span className="home-social-icon"><TargetIcon /></span>
        <span className="home-social-copy"><small>DESAFIO ATIVO</small><strong>{data?.challenge?.titulo ?? "Crie uma meta em equipe"}</strong><em>{data?.challenge ? challengeDue(data.challenge) : "cada pessoa comprova o próprio avanço"}</em></span>
      </button>

      {!!data?.unread && <span className="home-social-alert"><BellIcon /> {data.unread > 9 ? "9+" : data.unread}</span>}
      <span className="home-social-private"><ShieldIcon /> nada é publicado sozinho</span>
    </div>
  </section>;
}
