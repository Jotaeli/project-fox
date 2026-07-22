import type { ISODate, ISODateTime, UUID } from "./common.js";

export type TipoPlaneta = "rochoso" | "gasoso" | "anelado" | "gelado";

export interface Planeta {
  id: UUID;
  userId: UUID;
  nome: string;
  cor: string;
  tipo: TipoPlaneta;
  objetivoPrincipal: string;
  descricao?: string;
  metaSemanal: number; // relatórios por semana, 1-7
  createdAt: ISODateTime;
}

export interface Relatorio {
  id: UUID;
  planetaId: UUID;
  conteudo: string;
  notaConectadaId?: UUID;
  createdAt: ISODateTime;
}

export interface Recurso {
  id: UUID;
  planetaId: UUID;
  nome: string;
  arquivoUrl: string;
  tipo: string;
  createdAt: ISODateTime;
}

export interface Foto {
  id: UUID;
  planetaId: UUID;
  url: string;
  createdAt: ISODateTime;
}

export type StatusEvento = "ativo" | "concluido" | "falha";

export interface ChecklistItemEvento {
  id: UUID;
  eventoId: UUID;
  titulo: string;
  relatorioAnexadoId?: UUID;
  comprovado: boolean;
}

export interface Evento {
  id: UUID;
  planetaId: UUID;
  titulo: string;
  icone: string;
  cor: string;
  prazo: ISODate;
  status: StatusEvento;
  checklist: ChecklistItemEvento[];
  createdAt: ISODateTime;
}
