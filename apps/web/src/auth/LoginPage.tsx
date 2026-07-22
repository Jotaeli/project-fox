import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient.js";
import "./auth.css";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: nome || email } },
        });
        if (err) throw err;
        setInfo("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Project Fox</h1>
        <p className="auth-sub">{mode === "login" ? "Entrar na sua conta" : "Criar uma conta"}</p>

        {mode === "signup" && (
          <div className="field">
            <label>Nome</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
          </div>
        )}
        <div className="field">
          <label>E-mail</label>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
        </div>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        <button className="btn primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 6 }}>
          {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setInfo(null); }}
        >
          {mode === "login" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}
