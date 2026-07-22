export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const M_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function currentMonthLabel(): string {
  const now = new Date();
  const name = M_NAMES[now.getMonth()];
  return `${name[0].toUpperCase()}${name.slice(1)} de ${now.getFullYear()}`;
}

export function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function fmtDeadlineShort(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function deadlineUrgency(iso: string): "urgent" | "warn" | "" {
  const days = (new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86400000;
  if (days < 3) return "urgent";
  if (days < 7) return "warn";
  return "";
}
