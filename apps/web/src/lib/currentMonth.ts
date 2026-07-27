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

export function fmtRelativeDay(iso: string): string {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const alvoDia = new Date(iso); alvoDia.setHours(0, 0, 0, 0);
  const dias = Math.round((hoje.getTime() - alvoDia.getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

export function capFirst(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function fmtDeadlineShort(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export type Urgencia = "atrasado" | "urgent" | "warn" | "";

export function deadlineUrgency(iso: string): Urgencia {
  const days = (new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86400000;
  if (days < 0) return "atrasado";
  if (days < 3) return "urgent";
  if (days < 7) return "warn";
  return "";
}
