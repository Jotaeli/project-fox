import type { ISODateTime, UUID } from "./common.js";

export type BadgeNota = "wishlist" | "tarefas" | "criar";
export type PapelMembroEspacoNotas = "dono" | "membro";
export type StatusMembroEspacoNotas = "pendente" | "aceito";

export interface MembroEspacoNotas {
  espacoId: UUID;
  userId: UUID;
  nome: string;
  handle?: string;
  avatarUrl?: string;
  papel: PapelMembroEspacoNotas;
  status: StatusMembroEspacoNotas;
  convidadoPor?: UUID;
  respondidoEm?: ISODateTime;
  createdAt: ISODateTime;
}

export interface EspacoNotas {
  id: UUID;
  ownerId: UUID;
  nome: string;
  cor: string;
  membros: MembroEspacoNotas[];
  meuPapel: PapelMembroEspacoNotas;
  createdAt: ISODateTime;
}

export interface Nota {
  id: UUID;
  userId: UUID;
  espacoId?: UUID;
  autorNome?: string;
  titulo: string;
  conteudo: string;
  badges: BadgeNota[];
  posX?: number;
  posY?: number;
  createdAt: ISODateTime;
}

export interface ConexaoNota {
  id: UUID;
  userId: UUID;
  espacoId?: UUID;
  notaOrigemId: UUID;
  notaDestinoId: UUID;
}
