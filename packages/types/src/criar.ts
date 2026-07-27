import type { ISODate, ISODateTime, UUID } from "./common.js";

export type TipoPlaneta = "rochoso" | "gasoso" | "anelado" | "gelado";
export type PapelMembroPlaneta = "dono" | "membro";
export type StatusMembroPlaneta = "pendente" | "aceito";

export interface MembroPlaneta {
  planetaId: UUID;
  userId: UUID;
  nome: string;
  handle?: string;
  avatarUrl?: string;
  papel: PapelMembroPlaneta;
  status: StatusMembroPlaneta;
  metaSemanal: number;
  convidadoPor?: UUID;
  respondidoEm?: ISODateTime;
  createdAt: ISODateTime;
}

export interface Planeta {
  id: UUID;
  userId: UUID;
  nome: string;
  cor: string;
  tipo: TipoPlaneta;
  objetivoPrincipal: string;
  descricao?: string;
  metaSemanal: number; // relatórios por semana, 1-7
  temRecursos: boolean;
  temFotos: boolean;
  membros: MembroPlaneta[];
  meuPapel: PapelMembroPlaneta;
  compartilhado: boolean;
  createdAt: ISODateTime;
}

export interface Relatorio {
  id: UUID;
  planetaId: UUID;
  autorId: UUID;
  conteudo: string;
  notaConectadaId?: UUID;
  createdAt: ISODateTime;
}

export interface Recurso {
  id: UUID;
  planetaId: UUID;
  autorId: UUID;
  nome: string;
  arquivoUrl: string;
  tipo: string;
  createdAt: ISODateTime;
}

export interface Foto {
  id: UUID;
  planetaId: UUID;
  autorId: UUID;
  url: string;
  createdAt: ISODateTime;
}

export type StatusEvento = "ativo" | "concluido" | "falha";

export interface ChecklistItemEvento {
  id: UUID;
  eventoId: UUID;
  autorId: UUID;
  titulo: string;
  relatorioAnexadoId?: UUID;
  comprovado: boolean;
}

export interface Evento {
  id: UUID;
  planetaId: UUID;
  autorId: UUID;
  titulo: string;
  icone: string;
  cor: string;
  prazo: ISODate;
  status: StatusEvento;
  checklist: ChecklistItemEvento[];
  concluidoEm?: ISODateTime;
  falhouEm?: ISODateTime;
  createdAt: ISODateTime;
}
