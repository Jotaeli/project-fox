import type { ISODate, ISODateTime, UUID } from "./common.js";
import type { TipoPlaneta } from "./criar.js";
import type { TierWishlist } from "./rotina.js";

export type StatusAmizade = "pendente" | "aceita" | "recusada";

export interface Amizade {
  id: UUID;
  solicitanteId: UUID;
  destinatarioId: UUID;
  status: StatusAmizade;
  createdAt: ISODateTime;
  respondidaEm?: ISODateTime;
}

/** Cartão mínimo devolvido pela busca por handle. */
export interface PerfilResumo {
  id: UUID;
  nome: string;
  handle?: string;
  avatarUrl?: string;
}

/** Flags de privacidade — tudo é opt-in, nada vaza por padrão. */
export interface PreferenciasPerfil {
  descobrivel: boolean;
  aceitaCutucadas: boolean;
  planetaFavoritoId?: UUID;
  mostrarPlanetaFavorito: boolean;
  mostrarMetaPrincipal: boolean;
  mostrarEventos: boolean;
  mostrarWishlist: boolean;
  mostrarStreak: boolean;
}

export interface MetaPrincipal {
  id: UUID;
  titulo: string;
  icone: string;
  cor: string;
  prazo: ISODate;
  planetaNome: string;
  planetaCor: string;
  total: number;
  comprovados: number;
}

export interface EventoResumo {
  id: UUID;
  titulo: string;
  icone: string;
  cor: string;
  prazo: ISODate;
  planetaNome: string;
}

export interface PlanetaFavorito {
  id: UUID;
  nome: string;
  cor: string;
  tipo: TipoPlaneta;
  objetivoPrincipal: string;
  descricao?: string;
  metaSemanal: number;
}

export interface WishlistDestaque {
  id: UUID;
  nome: string;
  valor: number;
  foto?: string;
  tier: TierWishlist;
  descricao?: string;
  link?: string;
}

/** Retorno da RPC `perfil_publico` — campos opcionais conforme as flags do dono. */
export interface PerfilPublico extends PerfilResumo {
  bio?: string;
  desde: ISODateTime;
  ehAmigo: boolean;
  aceitaCutucadas: boolean;
  planetaFavorito?: PlanetaFavorito;
  metaPrincipal?: MetaPrincipal;
  eventosAtivos?: EventoResumo[];
  wishlistDestaque?: WishlistDestaque;
}

export type VisibilidadePostagem = "privado" | "amigos" | "publico";

export type TipoPostagem =
  | "texto"
  | "evento_concluido"
  | "planeta_criado"
  | "marco_relatorios"
  | "wishlist_comprado"
  | "marco_streak"
  | "desafio_vencido";

export interface Postagem {
  id: UUID;
  userId: UUID;
  tipo: TipoPostagem;
  texto?: string;
  visibilidade: VisibilidadePostagem;
  planetaId?: UUID;
  eventoId?: UUID;
  notaId?: UUID;
  itemWishlistId?: UUID;
  /** Snapshot do marco no momento da publicação — não muda se o planeta for editado depois. */
  dados: Record<string, unknown>;
  createdAt: ISODateTime;
}

export type TipoReacao = "faisca" | "foguete" | "chama" | "alvo" | "aplauso";

export interface Reacao {
  id: UUID;
  postagemId: UUID;
  userId: UUID;
  tipo: TipoReacao;
  createdAt: ISODateTime;
}

/** Linha do feed (RPC `feed`) — postagem já enriquecida com autor e contagem de reações. */
export interface ItemFeed {
  id: UUID;
  autorId: UUID;
  autorNome: string;
  autorHandle?: string;
  autorAvatar?: string;
  tipo: TipoPostagem;
  texto?: string;
  dados: Record<string, unknown>;
  createdAt: ISODateTime;
  reacoes: Partial<Record<TipoReacao, number>>;
  minhaReacao?: TipoReacao;
}

export type ContextoCutucada = "perfil" | "planeta" | "evento" | "streak";

export interface Cutucada {
  id: UUID;
  deId: UUID;
  paraId: UUID;
  contexto: ContextoCutucada;
  planetaId?: UUID;
  eventoId?: UUID;
  /** Motivo gerado pelo app ("3 dias sem relatório"), congelado no envio. */
  motivo?: string;
  createdAt: ISODateTime;
}

export type TipoNotificacao =
  | "amizade_pedido"
  | "amizade_aceita"
  | "cutucada"
  | "reacao";

export interface Notificacao {
  id: UUID;
  userId: UUID;
  atorId?: UUID;
  tipo: TipoNotificacao;
  payload: Record<string, unknown>;
  lida: boolean;
  createdAt: ISODateTime;
}

export interface Bloqueio {
  bloqueadorId: UUID;
  bloqueadoId: UUID;
  createdAt: ISODateTime;
}
