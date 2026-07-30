export const colors = {
  bg0: "#04081a",
  bg1: "#0a1230",
  panel: "rgba(13, 22, 48, 0.92)",
  panelSolid: "#0d1630",
  line: "rgba(148, 180, 255, 0.16)",
  text: "#dce6ff",
  muted: "#8fa3c8",
  accent: "#6ea8ff",
  green: "#4ade80",
  blue: "#60a5fa",
  pink: "#f472b6",
  gold: "#ffd66e",
  danger: "#ff8f8f",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 22, fontWeight: "700" as const, color: colors.text },
  subtitle: { fontSize: 15, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  muted: { fontSize: 12.5, color: colors.muted },
};

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
