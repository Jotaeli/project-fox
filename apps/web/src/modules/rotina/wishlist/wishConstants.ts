import type { TierWishlist } from "@project-fox/types";

export const TIER_ORDER: TierWishlist[] = ["S", "A", "B", "C"];

export const TIERS: Record<TierWishlist, { name: string; c: string; bg1: string; bg2: string }> = {
  S: { name: "Obsessão", c: "#ffd66e", bg1: "rgba(255,214,110,.14)", bg2: "rgba(255,214,110,.03)" },
  A: { name: "Desejo", c: "#f472b6", bg1: "rgba(244,114,182,.13)", bg2: "rgba(244,114,182,.03)" },
  B: { name: "Curtiria", c: "#60a5fa", bg1: "rgba(96,165,250,.12)", bg2: "rgba(96,165,250,.03)" },
  C: { name: "Algum dia", c: "#8fa3c8", bg1: "rgba(143,163,200,.10)", bg2: "rgba(143,163,200,.02)" },
};

export const HUES = [145, 212, 330, 268, 26, 187, 48];

export function photoStyle(hue: number): React.CSSProperties {
  return { background: `linear-gradient(135deg, hsl(${hue},45%,32%), hsl(${(hue + 40) % 360},55%,18%))` };
}
