import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { FoxIcon } from "../icons/index.js";
import { supabase } from "../lib/supabaseClient.js";
import "./auth.css";

type ModKey = "rotina" | "anotar" | "criar";

type Modulo = {
  key: ModKey;
  label: string;
  color: string;
  frase: string;
  ring: { size: number; dur: number; delay: number; rev?: boolean };
};

const MODULOS: Modulo[] = [
  {
    key: "rotina",
    label: "Rotina",
    color: "#ffd66e",
    frase: "Finanças, wishlist e tarefas no mesmo lugar.",
    ring: { size: 168, dur: 19, delay: -3 },
  },
  {
    key: "anotar",
    label: "Anotar",
    color: "#6ea8ff",
    frase: "Notas em grafo — as conexões são suas.",
    ring: { size: 248, dur: 27, delay: -14, rev: true },
  },
  {
    key: "criar",
    label: "Criar",
    color: "#f472b6",
    frase: "Cada área da vida vira um planeta pra cuidar.",
    ring: { size: 328, dur: 36, delay: -8 },
  },
];

const FRASES = [
  "Um lugar só pra organizar a vida inteira.",
  "Três módulos que conversam entre si.",
  "Feito pra abrir todo dia sem cansar os olhos.",
];

function ModIcon({ k }: { k: ModKey }) {
  if (k === "rotina") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 2.5l3.5 3.5L17 9.5" />
        <path d="M3.5 11V9.5a3.5 3.5 0 0 1 3.5-3.5h13.5" />
        <path d="M7 21.5L3.5 18 7 14.5" />
        <path d="M20.5 13v1.5a3.5 3.5 0 0 1-3.5 3.5H3.5" />
      </svg>
    );
  }
  if (k === "anotar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5.5" r="2.8" />
        <circle cx="6" cy="12" r="2.8" />
        <circle cx="18" cy="18.5" r="2.8" />
        <path d="M8.5 10.6l7-3.7M8.5 13.4l7 3.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="6" />
      <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-24 12 12)" />
    </svg>
  );
}

const ESTRELAS = Array.from({ length: 54 }, (_, i) => {
  const a = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const b = Math.sin((i + 1) * 78.233) * 12345.6789;
  const c = Math.sin((i + 1) * 39.425) * 5461.123;
  return {
    x: (a - Math.floor(a)) * 100,
    y: (b - Math.floor(b)) * 100,
    r: 0.7 + (c - Math.floor(c)) * 1.5,
    delay: ((c - Math.floor(c)) * 6).toFixed(2),
    camada: i % 3,
  };
});

type Faisca = { id: number; ang: number; dist: number; cor: string };

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const [ativo, setAtivo] = useState<ModKey | null>(null);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [faiscas, setFaiscas] = useState<Faisca[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const faiscaId = useRef(0);

  // rotação das frases — pausa enquanto o usuário explora um módulo
  useEffect(() => {
    if (ativo) return;
    const t = setInterval(() => setFraseIdx((i) => (i + 1) % FRASES.length), 4400);
    return () => clearInterval(t);
  }, [ativo]);

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    // Mantém o alvo orbital estável enquanto o usuário interage com ele.
    // Sem isso, o parallax desloca o botão sob o ponteiro e pode alternar
    // pointerenter/pointerleave rapidamente.
    if (ativo) return;
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  }

  function handleLeave() {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  }

  function estourar() {
    const cores = MODULOS.map((m) => m.color);
    const novas: Faisca[] = Array.from({ length: 14 }, (_, i) => ({
      id: faiscaId.current++,
      ang: (360 / 14) * i + Math.random() * 14,
      dist: 46 + Math.random() * 42,
      cor: cores[i % cores.length],
    }));
    setFaiscas((f) => [...f, ...novas]);
    const ids = new Set(novas.map((n) => n.id));
    setTimeout(() => setFaiscas((f) => f.filter((x) => !ids.has(x.id))), 900);
  }

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
          options: {
            data: { nome: nome || email },
            emailRedirectTo: `${window.location.origin}/login`,
          },
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

  const mod = ativo ? MODULOS.find((m) => m.key === ativo)! : null;
  const frase = mod ? mod.frase : FRASES[fraseIdx];
  const cor = mod ? mod.color : "var(--accent)";

  return (
    <div className="login-page">
      <div
        className="login-hero"
        ref={heroRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ ["--fox-c" as string]: cor }}
      >
        <div className="hero-glow" />
        <div className="stars">
          {ESTRELAS.map((s, i) => (
            <span
              key={i}
              className={`star l${s.camada}`}
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, animationDelay: `${s.delay}s` }}
            />
          ))}
        </div>
        <i className="shoot s1" />
        <i className="shoot s2" />

        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-tag">
              <FoxIcon />
              seu universo pessoal
            </span>
            <h1 className="hero-title">
              Project <em>Fox</em>
            </h1>
            <p className="hero-frase" key={frase}>
              {frase.split(" ").map((w, i, arr) => (
                <span key={i} style={{ animationDelay: `${i * 0.045}s` }}>
                  {i < arr.length - 1 ? `${w} ` : w}
                </span>
              ))}
            </p>
            <div className="mod-pills">
              {MODULOS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`mod-pill${ativo === m.key ? " on" : ""}`}
                  style={{ ["--c" as string]: m.color }}
                  onPointerEnter={() => setAtivo(m.key)}
                  onPointerLeave={() => setAtivo(null)}
                  onFocus={() => setAtivo(m.key)}
                  onBlur={() => setAtivo(null)}
                >
                  <ModIcon k={m.key} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-stage">
            {MODULOS.map((m) => (
              <div
                key={m.key}
                className={`ring${m.ring.rev ? " rev" : ""}${ativo === m.key ? " on" : ""}`}
                style={{
                  ["--s" as string]: `${m.ring.size}px`,
                  ["--dur" as string]: `${m.ring.dur}s`,
                  ["--d" as string]: `${m.ring.delay}s`,
                  ["--c" as string]: m.color,
                }}
              >
                <div className="spin">
                  <div className="slot">
                    <button
                      type="button"
                      className="sat"
                      aria-label={m.label}
                      onPointerEnter={() => setAtivo(m.key)}
                      onPointerLeave={() => setAtivo(null)}
                      onFocus={() => setAtivo(m.key)}
                      onBlur={() => setAtivo(null)}
                    >
                      <ModIcon k={m.key} />
                      <span className="sat-tip">{m.label}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="fox" onClick={estourar} aria-label="Project Fox">
              <FoxIcon draw />
              {faiscas.map((f) => (
                <i
                  key={f.id}
                  className="faisca"
                  style={{
                    ["--a" as string]: `${f.ang}deg`,
                    ["--dist" as string]: `${f.dist}px`,
                    background: f.cor,
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </div>

      <div className="login-side">
        <form className="auth-card" onSubmit={handleSubmit}>
          <span className="card-mark">
            <FoxIcon />
          </span>
          <h1>{mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}</h1>
          <p className="auth-sub">
            {mode === "login" ? "Entre pra continuar de onde parou." : "Leva menos de um minuto."}
          </p>

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

          <button className="btn primary auth-submit" type="submit" disabled={loading}>
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
    </div>
  );
}
