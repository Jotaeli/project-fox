import type { BadgeNota } from "@project-fox/types";

export const BADGES: Record<BadgeNota, { label: string; rgb: [number, number, number] }> = {
  wishlist: { label: "Wishlist", rgb: [74, 222, 128] },
  tarefas: { label: "Tarefas", rgb: [96, 165, 250] },
  criar: { label: "Criar", rgb: [244, 114, 182] },
};
export const INDEP_RGB: [number, number, number] = [205, 220, 255];
export const BADGE_ORDER: BadgeNota[] = ["wishlist", "tarefas", "criar"];

export function noteColors(badges: BadgeNota[]): [number, number, number][] {
  if (!badges.length) return [INDEP_RGB];
  return badges.map((b) => BADGES[b].rgb);
}

export function rgbaStr(rgb: [number, number, number], a: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}
