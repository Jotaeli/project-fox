import type { ISODate, ISODateTime, UUID } from "./common.js";

export type TierWishlist = "S" | "A" | "B" | "C";

export interface ItemWishlist {
  id: UUID;
  userId: UUID;
  nome: string;
  valor: number;
  foto?: string;
  planetaId?: UUID;
  descricao?: string;
  link?: string;
  tier: TierWishlist;
  comprado: boolean;
  createdAt: ISODateTime;
}

export interface RendaMensal {
  id: UUID;
  userId: UUID;
  fonte: string;
  valor: number;
  mes: string; // "YYYY-MM"
  origemTarefaId?: UUID;
  createdAt: ISODateTime;
}

export interface ModalidadeGasto {
  id: UUID;
  userId: UUID;
  nome: string;
  cor: string;
  fixa: boolean; // "Wishlist" é fixa e não pode ser excluída
  ordem: number;
}

export interface Gasto {
  id: UUID;
  userId: UUID;
  modalidadeId: UUID;
  descricao: string;
  valor: number;
  mes: string; // "YYYY-MM"
  pago: boolean;
  pagoEm?: ISODateTime;
  itemWishlistId?: UUID;
  createdAt: ISODateTime;
}

export type OrdenacaoSecao = "personalizado" | "data";

export interface SecaoTarefas {
  id: UUID;
  userId: UUID;
  nome: string;
  cor: string;
  ordem: number;
  fixa: boolean; // "Geral" é fixa e não pode ser excluída
  ordenacao: OrdenacaoSecao;
}

export interface EtapaTarefa {
  id: UUID;
  tarefaId: UUID;
  titulo: string;
  ordem: number;
  concluida: boolean;
}

export interface Tarefa {
  id: UUID;
  userId: UUID;
  secaoId: UUID;
  titulo: string;
  descricao?: string;
  ordem: number;
  prazo?: ISODate;
  etapas: EtapaTarefa[];
  financeira: boolean;
  valorAlvo?: number;
  wishlistRefId?: UUID;
  origemPlanetaId?: UUID; // tarefa criada a partir de Desenvolver/Criar
  concluidaAt?: ISODateTime;
  createdAt: ISODateTime;
}
