/**
 * Erros do Supabase (PostgrestError) são objetos simples, não instâncias de Error —
 * `String(e)` neles vira "[object Object]" na tela. Este helper puxa a mensagem real.
 */
export function errorMessage(e: unknown, fallback = "Algo deu errado. Tente de novo."): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    for (const key of ["message", "error_description", "hint", "details"]) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  if (typeof e === "string" && e.trim()) return e;
  return fallback;
}
