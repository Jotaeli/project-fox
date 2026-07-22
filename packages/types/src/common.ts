export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;

export interface User {
  id: UUID;
  email: string;
  nome: string;
  createdAt: ISODateTime;
}
