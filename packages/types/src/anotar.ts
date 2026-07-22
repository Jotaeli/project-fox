import type { ISODateTime, UUID } from "./common.js";

export type BadgeNota = "wishlist" | "tarefas" | "criar";

export interface Nota {
  id: UUID;
  userId: UUID;
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
  notaOrigemId: UUID;
  notaDestinoId: UUID;
}
