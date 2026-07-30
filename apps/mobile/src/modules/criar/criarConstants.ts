import { AwardIcon, BookIcon, CameraIcon, FlameIcon, HeartIcon, LibraryIcon, MusicIcon, ReportIcon, RocketIcon, TargetIcon, ZapIcon } from "../../icons/index";
import { HUES } from "../rotina/wishlist/wishConstants";

export { HUES };
export const COLOR_NAMES: Record<number, string> = {
  145: "Verde", 212: "Azul", 330: "Rosa", 268: "Roxo", 26: "Laranja", 187: "Ciano", 48: "Amarelo",
};

export type TipoPlanetaKey = "rochoso" | "gasoso" | "anelado" | "gelado";
export const PLANET_TYPES: { id: TipoPlanetaKey; name: string }[] = [
  { id: "rochoso", name: "Rochoso" },
  { id: "gasoso", name: "Gasoso" },
  { id: "anelado", name: "Anelado" },
  { id: "gelado", name: "Gelado" },
];

export const MOON_STYLE: Record<string, { label: string; icon: typeof ReportIcon; col: string }> = {
  relatorio: { label: "Relatório", icon: ReportIcon, col: "#8fd0ff" },
  recursos: { label: "Recursos", icon: LibraryIcon, col: "#ffcf7d" },
  fotos: { label: "Fotos", icon: CameraIcon, col: "#d3a6ff" },
};

export const GOAL_ICONS: { id: string; icon: typeof ReportIcon }[] = [
  { id: "target", icon: TargetIcon },
  { id: "book", icon: BookIcon },
  { id: "flame", icon: FlameIcon },
  { id: "rocket", icon: RocketIcon },
  { id: "heart", icon: HeartIcon },
  { id: "zap", icon: ZapIcon },
  { id: "music", icon: MusicIcon },
  { id: "award", icon: AwardIcon },
];
export const GOAL_ICON_MAP: Record<string, typeof ReportIcon> = Object.fromEntries(GOAL_ICONS.map((g) => [g.id, g.icon]));

export const DEADLINES = [
  { d: 7, l: "1 semana" }, { d: 14, l: "2 semanas" }, { d: 21, l: "3 semanas" },
  { d: 30, l: "1 mês" }, { d: 60, l: "2 meses" }, { d: 90, l: "3 meses" },
];

export function hueOf(cor: string): number {
  return Number(cor) || 0;
}
