import { useEffect, useMemo, useRef, useState } from "react";
import type { Evento, Planeta } from "@project-fox/types";
import {
  AwardIcon, BackIcon, BarChartIcon, CameraIcon, LibraryIcon, PlusIcon, ReportIcon, TargetIcon, TrashIcon,
} from "../../icons/index.js";
import { useToast } from "../../lib/toast.js";
import { useTarefas } from "../rotina/tarefas/useTarefas.js";
import { EventDetailModal } from "./EventDetailModal.js";
import { EventsPanel } from "./EventsPanel.js";
import { GoalModal } from "./GoalModal.js";
import { MoonDrawer } from "./MoonDrawer.js";
import { PlanetModal } from "./PlanetModal.js";
import { StatsModal } from "./StatsModal.js";
import { hueOf } from "./criarConstants.js";
import { derivedStatus, health, useCriar, weeklyCount } from "./useCriar.js";
import "./criar.css";

const TAU = Math.PI * 2;
const DAY = 86400000;

type TipoPlaneta = Planeta["tipo"];

interface SimFeature {
  fx?: number; fy: number; s?: number; light: boolean; band?: boolean; th?: number; a?: number; storm?: boolean;
}
interface SimPlanet {
  id: string; dist: number; size: number; angle: number; baseSpeed: number; spin: number; spinSpeed: number;
  features: SimFeature[]; partyUntil: number;
}
interface Burst { x: number; y: number; hue: number; r: number; t0: number; particles: { ang: number; speed: number; size: number }[]; }
interface Confetti { x: number; y: number; ang: number; speed: number; hue: number; w: number; h: number; rot: number; rotSpeed: number; t0: number; life: number; }

function buildFeatures(type: TipoPlaneta): SimFeature[] {
  const f: SimFeature[] = [];
  if (type === "rochoso" || type === "anelado") {
    const n = type === "rochoso" ? 9 : 5;
    for (let i = 0; i < n; i++) f.push({ fx: Math.random() * 2 - 1, fy: Math.random() * 1.5 - 0.75, s: 0.09 + Math.random() * 0.17, light: Math.random() < 0.3 });
  } else if (type === "gasoso") {
    let y = -0.85;
    while (y < 0.85) {
      const th = 0.13 + Math.random() * 0.2;
      f.push({ band: true, fy: y + th / 2, th, light: Math.random() < 0.45, a: 0.12 + Math.random() * 0.16 });
      y += th;
    }
    for (let i = 0; i < 3; i++) f.push({ fx: Math.random() * 2 - 1, fy: Math.random() * 1.2 - 0.6, s: 0.11 + Math.random() * 0.12, storm: true, light: Math.random() < 0.5 });
  } else if (type === "gelado") {
    for (let i = 0; i < 5; i++) f.push({ fx: Math.random() * 2 - 1, fy: Math.random() * 1.1 - 0.55, s: 0.08 + Math.random() * 0.13, light: true });
  }
  return f;
}

function hsla(h: number, s: number, l: number, a: number) { return `hsla(${h},${s}%,${l}%,${a})`; }

function moonsOf(p: Planeta) {
  const arr = [{ id: "relatorio" }];
  if (p.temRecursos) arr.push({ id: "recursos" });
  if (p.temFotos) arr.push({ id: "fotos" });
  return arr.map((m, i) => ({ id: m.id, orbit: 30 + i * 18, speed: 0.55 - i * 0.13, phase: i * 2.4 }));
}

interface Sim {
  planets: Map<string, SimPlanet>;
  cam: { x: number; y: number; s: number }; camTarget: { x: number; y: number; s: number };
  mode: "system" | "planet"; focusId: string | null;
  hover: { kind: "planet"; id: string } | { kind: "moon"; moonId: string } | null;
  bursts: Burst[]; confetti: Confetti[];
  W: number; H: number; DPR: number;
}
function makeSim(): Sim {
  return {
    planets: new Map(), cam: { x: 0, y: 0, s: 1 }, camTarget: { x: 0, y: 0, s: 1 },
    mode: "system", focusId: null, hover: null, bursts: [], confetti: [], W: 0, H: 0, DPR: 1,
  };
}

export function CriarPage() {
  const { planetas, relatorios, recursos, fotos, eventos, deletePlaneta } = useCriar();
  const { tarefas, secoes } = useTarefas();
  const showToast = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Sim>(makeSim());
  const rafRef = useRef<number>();

  const [focusId, setFocusId] = useState<string | null>(null);
  const [planetModalOpen, setPlanetModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [openMoonId, setOpenMoonId] = useState<string | null>(null);
  const [detailEvento, setDetailEvento] = useState<Evento | null>(null);

  const dataRef = useRef({ planetas, relatorios, eventos, tarefas });
  dataRef.current = { planetas, relatorios, eventos, tarefas };

  const focusPlaneta = useMemo(() => planetas.find((p) => p.id === focusId) ?? null, [planetas, focusId]);

  function setHint() {
    const el = hintRef.current;
    if (!el) return;
    el.textContent = simRef.current.mode === "planet" ? "Clique numa lua para abrir" : "Clique num planeta para se aproximar";
  }

  function focusOn(id: string) {
    simRef.current.mode = "planet"; simRef.current.focusId = id;
    setFocusId(id);
    setHint();
  }
  function backToSystem() {
    simRef.current.mode = "system"; simRef.current.focusId = null;
    setFocusId(null); setOpenMoonId(null);
    setHint();
  }

  function spawnBurst(sp: SimPlanet, hue: number) {
    const pp = { x: Math.cos(sp.angle) * sp.dist, y: Math.sin(sp.angle) * sp.dist };
    simRef.current.bursts.push({
      x: pp.x, y: pp.y, hue, r: sp.size, t0: performance.now(),
      particles: Array.from({ length: 16 }, () => ({ ang: Math.random() * TAU, speed: 26 + Math.random() * 34, size: 1.3 + Math.random() * 1.8 })),
    });
  }
  function spawnParty(sp: SimPlanet, hue: number) {
    sp.partyUntil = Date.now() + 4500;
    const pp = { x: Math.cos(sp.angle) * sp.dist, y: Math.sin(sp.angle) * sp.dist };
    const hues = [hue, (hue + 40) % 360, 48, 200, 330];
    spawnBurst(sp, hue);
    setTimeout(() => spawnBurst(sp, hue), 300);
    for (let i = 0; i < 48; i++) {
      simRef.current.confetti.push({
        x: pp.x, y: pp.y, ang: Math.random() * TAU, speed: 18 + Math.random() * 58,
        hue: hues[(Math.random() * hues.length) | 0], w: 2 + Math.random() * 2.6, h: 1.2 + Math.random() * 1.6,
        rot: Math.random() * TAU, rotSpeed: (Math.random() - 0.5) * 9, t0: performance.now(), life: 2000 + Math.random() * 900,
      });
    }
  }

  function handleGoalCompleted(planetaId: string, titulo: string) {
    const sp = simRef.current.planets.get(planetaId);
    const p = dataRef.current.planetas.find((x) => x.id === planetaId);
    if (sp && p) spawnParty(sp, hueOf(p.cor));
    showToast(`Meta concluída: ${titulo}!`);
    setDetailEvento(null);
  }

  /* ---------------- mount: canvas + physics-free orbit loop ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const ctx = canvas.getContext("2d")!;
    const sim = simRef.current;

    function resize() {
      sim.DPR = Math.min(window.devicePixelRatio || 1, 2);
      sim.W = container.clientWidth; sim.H = container.clientHeight;
      canvas.width = sim.W * sim.DPR; canvas.height = sim.H * sim.DPR;
      canvas.style.width = sim.W + "px"; canvas.style.height = sim.H + "px";
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function worldToScreen(wx: number, wy: number) { return { x: (wx - sim.cam.x) * sim.cam.s + sim.W / 2, y: (wy - sim.cam.y) * sim.cam.s + sim.H / 2 }; }
    function screenToWorld(sx: number, sy: number) { return { x: (sx - sim.W / 2) / sim.cam.s + sim.cam.x, y: (sy - sim.H / 2) / sim.cam.s + sim.cam.y }; }
    function planetPos(sp: SimPlanet) { return { x: Math.cos(sp.angle) * sp.dist, y: Math.sin(sp.angle) * sp.dist }; }
    function moonPos(sp: SimPlanet, m: { orbit: number; speed: number; phase: number }, t: number) {
      const pp = planetPos(sp);
      const a = t * m.speed + m.phase;
      return { x: pp.x + Math.cos(a) * m.orbit, y: pp.y + Math.sin(a) * m.orbit };
    }
    function fitScale() {
      const dists = [...sim.planets.values()].map((p) => p.dist);
      const maxD = dists.length ? Math.max(...dists) + 90 : 260;
      return Math.min(1.05, (Math.min(sim.W, sim.H) / 2 / maxD) * 0.95);
    }

    function weeklyCountOf(id: string) { return weeklyCount(id, dataRef.current.relatorios); }
    function healthOf(p: Planeta) { return health(p, dataRef.current.relatorios); }
    function monthlyTaskCountOf(id: string) {
      const cut = Date.now() - 30 * DAY;
      return dataRef.current.tarefas.filter((t) => t.origemPlanetaId === id && t.concluidaAt && +new Date(t.concluidaAt) > cut).length;
    }
    function excitementOf(sp: SimPlanet) {
      if (Date.now() < sp.partyUntil) return 1;
      const n = dataRef.current.eventos.filter((e) => e.planetaId === sp.id && derivedStatus(e) === "ativo").length;
      return Math.min(1, n * 0.5);
    }

    const stars = Array.from({ length: 240 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() < 0.85 ? 0.7 + Math.random() * 0.8 : 1.6 + Math.random() * 0.9,
      a: 0.25 + Math.random() * 0.55, ph: Math.random() * TAU, w: 0.3 + Math.random() * 1.2,
    }));

    function drawStars(t: number) {
      for (const s of stars) {
        const px = (((s.x * sim.W - sim.cam.x * sim.cam.s * 0.06) % sim.W) + sim.W) % sim.W;
        const py = (((s.y * sim.H - sim.cam.y * sim.cam.s * 0.06) % sim.H) + sim.H) % sim.H;
        const tw = s.a * (0.65 + 0.35 * Math.sin(t * s.w + s.ph));
        ctx.fillStyle = `rgba(210,225,255,${tw})`;
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, TAU); ctx.fill();
      }
    }
    function drawSun(t: number) {
      const r = 42 * (1 + 0.015 * Math.sin(t * 1.2));
      let g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 3.6);
      g.addColorStop(0, "rgba(255,214,130,.32)"); g.addColorStop(0.5, "rgba(255,170,90,.10)"); g.addColorStop(1, "rgba(255,170,90,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 3.6, 0, TAU); ctx.fill();
      g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      g.addColorStop(0, "#fff9e8"); g.addColorStop(0.55, "#ffd98a"); g.addColorStop(1, "#ff9d4d");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    }
    function ringPath(x: number, y: number, r: number, full: boolean) {
      ctx.beginPath();
      if (full) ctx.ellipse(x, y, r * 1.85, r * 0.52, -0.42, 0, TAU);
      else ctx.ellipse(x, y, r * 1.85, r * 0.52, -0.42, 0, Math.PI);
    }
    function drawPlanet(p: Planeta, sp: SimPlanet, t: number) {
      const { x, y } = planetPos(sp);
      const hval = healthOf(p);
      const hue = hueOf(p.cor);
      const sat = 12 + 68 * hval;
      const r = sp.size;
      const exc = excitementOf(sp);
      const pulse = exc > 0 ? exc * (0.07 + 0.07 * Math.sin(t * 2.6)) : 0;
      let g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.5);
      g.addColorStop(0, hsla(hue, sat, 62, 0.08 + 0.28 * hval + pulse)); g.addColorStop(1, hsla(hue, sat, 62, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, TAU); ctx.fill();

      if (p.tipo === "anelado") { ctx.strokeStyle = hsla(hue, sat, 74, 0.18 + 0.25 * hval); ctx.lineWidth = r * 0.22; ringPath(x, y, r, true); ctx.stroke(); }

      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
      g = ctx.createRadialGradient(x - r * 0.45, y - r * 0.5, r * 0.15, x, y, r * 1.3);
      g.addColorStop(0, hsla(hue, sat, 64, 1)); g.addColorStop(1, hsla(hue, Math.max(8, sat * 0.85), 28, 1));
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);

      if (p.tipo === "gelado") {
        ctx.fillStyle = `rgba(240,248,255,${0.45 + 0.3 * hval})`;
        ctx.beginPath(); ctx.ellipse(x, y - r * 0.82, r * 0.6, r * 0.28, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.52, r * 0.24, 0, 0, TAU); ctx.fill();
      }
      for (const f of sp.features) {
        if (!f.band) continue;
        ctx.fillStyle = f.light ? `rgba(255,255,255,${f.a! * (0.4 + 0.6 * hval)})` : `rgba(4,8,22,${f.a})`;
        ctx.fillRect(x - r, y + (f.fy - f.th! / 2) * r, r * 2, f.th! * r);
      }
      const spinFrac = (sp.spin / Math.PI) % 2;
      for (const f of sp.features) {
        if (f.band) continue;
        const u = ((f.fx! + spinFrac + 3) % 2) - 1;
        const limb = Math.sqrt(Math.max(0, 1 - u * u));
        if (limb < 0.08) continue;
        const fx = x + u * r * 0.92, fy = y + f.fy * r;
        ctx.globalAlpha = limb * (f.storm ? 0.55 : 0.45);
        ctx.fillStyle = f.light ? "rgba(255,255,255,.55)" : "rgba(3,7,20,.6)";
        ctx.beginPath(); ctx.ellipse(fx, fy, f.s! * r * Math.max(0.25, limb), f.s! * r * (f.storm ? 0.55 : 0.85), 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
      g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
      g.addColorStop(0, "rgba(255,255,255,.09)"); g.addColorStop(0.4, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(2,6,18,.55)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();

      if (p.tipo === "anelado") { ctx.strokeStyle = hsla(hue, sat, 76, 0.35 + 0.35 * hval); ctx.lineWidth = r * 0.22; ringPath(x, y, r, false); ctx.stroke(); }
    }
    function drawMoonsFor(p: Planeta, sp: SimPlanet, t: number) {
      const alpha = Math.min(1, Math.max(0, (sim.cam.s - 1.5) / 1.1));
      if (alpha <= 0) return;
      for (const m of moonsOf(p)) {
        const pp = planetPos(sp);
        ctx.strokeStyle = `rgba(148,180,255,${0.1 * alpha})`; ctx.lineWidth = 1 / sim.cam.s;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, m.orbit, 0, TAU); ctx.stroke();
        const mp = moonPos(sp, m, t);
        const mr = 7.5;
        const col = m.id === "relatorio" ? "#8fd0ff" : m.id === "recursos" ? "#ffcf7d" : "#d3a6ff";
        let g = ctx.createRadialGradient(mp.x, mp.y, mr * 0.3, mp.x, mp.y, mr * 2);
        g.addColorStop(0, col + "55"); g.addColorStop(1, col + "00");
        ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mp.x, mp.y, mr * 2, 0, TAU); ctx.fill();
        g = ctx.createRadialGradient(mp.x - 2, mp.y - 2, 1, mp.x, mp.y, mr);
        g.addColorStop(0, "#f2f7ff"); g.addColorStop(1, col);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mp.x, mp.y, mr, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    function drawExcitement(t: number) {
      for (const sp of sim.planets.values()) {
        const p = dataRef.current.planetas.find((x) => x.id === sp.id);
        if (!p) continue;
        const e = excitementOf(sp);
        if (e <= 0) continue;
        const pp = planetPos(sp);
        const n = Math.round(3 + 4 * e);
        const hue = hueOf(p.cor);
        for (let i = 0; i < n; i++) {
          const ang = t * 1.1 + (i * TAU) / n + sp.spin;
          const rad = sp.size * (1.7 + 0.25 * Math.sin(t * 2.2 + i * 1.7));
          const sx = pp.x + Math.cos(ang) * rad, sy = pp.y + Math.sin(ang) * rad * 0.82;
          const a = e * (0.25 + 0.3 * Math.max(0, Math.sin(t * 3 + i * 2.1)));
          ctx.fillStyle = hsla(hue, 80, 82, a); ctx.beginPath(); ctx.arc(sx, sy, 1.1 + 0.5 * e, 0, TAU); ctx.fill();
        }
      }
    }
    function drawBursts() {
      const now = performance.now();
      for (let i = sim.bursts.length - 1; i >= 0; i--) {
        const b = sim.bursts[i];
        const age = (now - b.t0) / 1000;
        if (age > 1.3) { sim.bursts.splice(i, 1); continue; }
        const k = age / 1.3;
        ctx.lineWidth = 2 / sim.cam.s;
        ctx.strokeStyle = hsla(b.hue, 75, 72, (1 - k) * 0.6);
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + k * 50, 0, TAU); ctx.stroke();
        for (const pt of b.particles) {
          const dist = pt.speed * age;
          const px = b.x + Math.cos(pt.ang) * dist, py = b.y + Math.sin(pt.ang) * dist;
          ctx.fillStyle = hsla(b.hue, 85, 82, Math.max(0, 1 - k));
          ctx.beginPath(); ctx.arc(px, py, pt.size * (1 - k * 0.5), 0, TAU); ctx.fill();
        }
      }
    }
    function drawConfetti() {
      const now = performance.now();
      for (let i = sim.confetti.length - 1; i >= 0; i--) {
        const c = sim.confetti[i];
        const age = (now - c.t0) / 1000;
        const k = (now - c.t0) / c.life;
        if (k > 1) { sim.confetti.splice(i, 1); continue; }
        const px = c.x + Math.cos(c.ang) * c.speed * age;
        const py = c.y + Math.sin(c.ang) * c.speed * age + age * age * 6;
        ctx.save(); ctx.translate(px, py); ctx.rotate(c.rot + c.rotSpeed * age);
        ctx.fillStyle = hsla(c.hue, 85, 70, Math.max(0, 1 - k));
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }
    }
    function drawOverlay() {
      const lbA = Math.min(1, Math.max(0, (1.7 - sim.cam.s) / 0.7));
      if (lbA <= 0) return;
      ctx.textAlign = "center"; ctx.font = '12px -apple-system, "Segoe UI", sans-serif';
      for (const sp of sim.planets.values()) {
        const p = dataRef.current.planetas.find((x) => x.id === sp.id);
        if (!p) continue;
        const hval = healthOf(p);
        const pp = planetPos(sp), sc = worldToScreen(pp.x, pp.y);
        ctx.fillStyle = hsla(hueOf(p.cor), 12 + 60 * hval, 82, 0.92 * lbA);
        ctx.fillText(p.nome, sc.x, sc.y + sp.size * sim.cam.s + 17);
      }
    }

    let last = performance.now();
    function frame(now: number) {
      const t = now / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      for (const sp of sim.planets.values()) {
        const p = dataRef.current.planetas.find((x) => x.id === sp.id);
        const hval = p ? healthOf(p) : 1;
        sp.angle += sp.baseSpeed * (0.25 + 0.75 * hval) * (1 + 0.2 * excitementOf(sp)) * dt;
        sp.spin += sp.spinSpeed * dt;
      }

      if (sim.mode === "planet" && sim.focusId) {
        const sp = sim.planets.get(sim.focusId);
        if (sp) { const pp = planetPos(sp); sim.camTarget.x = pp.x; sim.camTarget.y = pp.y; sim.camTarget.s = 3; }
      } else { sim.camTarget.x = 0; sim.camTarget.y = 0; sim.camTarget.s = fitScale(); }
      const k = Math.min(1, dt * 3.5);
      sim.cam.x += (sim.camTarget.x - sim.cam.x) * k; sim.cam.y += (sim.camTarget.y - sim.cam.y) * k; sim.cam.s += (sim.camTarget.s - sim.cam.s) * k;

      ctx.setTransform(sim.DPR, 0, 0, sim.DPR, 0, 0);
      ctx.clearRect(0, 0, sim.W, sim.H);
      drawStars(t);
      ctx.save(); ctx.translate(sim.W / 2, sim.H / 2); ctx.scale(sim.cam.s, sim.cam.s); ctx.translate(-sim.cam.x, -sim.cam.y);

      ctx.lineWidth = 1 / sim.cam.s;
      for (const sp of sim.planets.values()) { ctx.strokeStyle = "rgba(140,170,255,.08)"; ctx.beginPath(); ctx.arc(0, 0, sp.dist, 0, TAU); ctx.stroke(); }
      drawSun(t);
      for (const sp of sim.planets.values()) {
        const p = dataRef.current.planetas.find((x) => x.id === sp.id);
        if (p) drawPlanet(p, sp, t);
      }
      drawExcitement(t);
      if (sim.mode === "planet" && sim.focusId) {
        const sp = sim.planets.get(sim.focusId);
        const p = dataRef.current.planetas.find((x) => x.id === sim.focusId);
        if (sp && p) drawMoonsFor(p, sp, t);
      }
      drawBursts(); drawConfetti();
      ctx.restore();
      drawOverlay();
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    function hitTest(sx: number, sy: number): Sim["hover"] {
      const w = screenToWorld(sx, sy);
      const tNow = performance.now() / 1000;
      if (sim.mode === "planet" && sim.focusId && sim.cam.s > 2) {
        const sp = sim.planets.get(sim.focusId);
        const p = dataRef.current.planetas.find((x) => x.id === sim.focusId);
        if (sp && p) {
          for (const m of moonsOf(p)) {
            const mp = moonPos(sp, m, tNow);
            if (Math.hypot(w.x - mp.x, w.y - mp.y) < 14) return { kind: "moon", moonId: m.id };
          }
        }
        return null;
      }
      if (sim.mode === "system") {
        for (const sp of sim.planets.values()) {
          const pp = planetPos(sp);
          if (Math.hypot(w.x - pp.x, w.y - pp.y) < sp.size + 10 / sim.cam.s) return { kind: "planet", id: sp.id };
        }
      }
      return null;
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const hit = hitTest(sx, sy);
      sim.hover = hit;
      canvas.style.cursor = hit ? "pointer" : "default";
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      if (hit?.kind === "planet") {
        const p = dataRef.current.planetas.find((x) => x.id === hit.id);
        if (p) {
          const hval = healthOf(p);
          tooltip.innerHTML = `<b>${p.nome}</b> <span style="color:var(--muted)">· saúde ${Math.round(hval * 100)}%</span><br><span style="color:var(--muted)">${weeklyCountOf(p.id)}/${p.metaSemanal} relatórios nesta semana</span>`;
          tooltip.style.display = "block";
          tooltip.style.left = Math.min(sim.W - 220, sx + 16) + "px"; tooltip.style.top = sy + 16 + "px";
        }
      } else if (hit?.kind === "moon") {
        const label = hit.moonId === "relatorio" ? "Relatório" : hit.moonId === "recursos" ? "Recursos" : "Fotos";
        tooltip.innerHTML = `<b>${label}</b>`;
        tooltip.style.display = "block";
        tooltip.style.left = Math.min(sim.W - 220, sx + 16) + "px"; tooltip.style.top = sy + 16 + "px";
      } else tooltip.style.display = "none";
    }
    function onClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (!hit) return;
      if (hit.kind === "planet") focusOn(hit.id);
      else openMoonRef.current(hit.moonId);
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMoonRef = useRef((id: string) => setOpenMoonId(id));
  openMoonRef.current = (id: string) => setOpenMoonId(id);

  /* ---------------- sync planetas -> sim ---------------- */
  useEffect(() => {
    const sim = simRef.current;
    const ids = new Set(planetas.map((p) => p.id));
    for (const id of [...sim.planets.keys()]) if (!ids.has(id)) sim.planets.delete(id);
    planetas.forEach((p) => {
      if (sim.planets.has(p.id)) return;
      const idx = sim.planets.size;
      const dist = 150 + idx * 72;
      sim.planets.set(p.id, {
        id: p.id, dist, size: 14 + Math.random() * 7, angle: Math.random() * TAU,
        baseSpeed: 22 / Math.pow(dist, 1.12), spin: Math.random() * TAU, spinSpeed: 0.22 + Math.random() * 0.25,
        features: buildFeatures(p.tipo), partyUntil: 0,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetas]);

  useEffect(() => { setHint(); }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (planetModalOpen) setPlanetModalOpen(false);
      else if (goalModalOpen) setGoalModalOpen(false);
      else if (detailEvento) setDetailEvento(null);
      else if (statsOpen) setStatsOpen(false);
      else if (confirmDeleteOpen) setConfirmDeleteOpen(false);
      else if (openMoonId) setOpenMoonId(null);
      else if (focusId) backToSystem();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const hval = focusPlaneta ? health(focusPlaneta, relatorios) : 0;
  const weekly = focusPlaneta ? weeklyCount(focusPlaneta.id, relatorios) : 0;
  const monthlyTasks = focusPlaneta
    ? tarefas.filter((t) => t.origemPlanetaId === focusPlaneta.id && t.concluidaAt && +new Date(t.concluidaAt) > Date.now() - 30 * DAY).length
    : 0;
  function statusText(h: number): [string, string] {
    if (h >= 0.99) return ["Órbita estável", "#7ef0b2"];
    if (h >= 0.6) return ["Órbita regular", "#9fc3ff"];
    if (h > 0.25) return ["Desacelerando…", "#ffd27d"];
    if (h > 0) return ["Perdendo a cor", "#ff9d7d"];
    return ["Órbita quase parada", "#8fa3c8"];
  }
  const [statusTxt, statusCol] = statusText(hval);

  return (
    <div className="criar-page" ref={containerRef}>
      <canvas ref={canvasRef} />

      <header className="criar-topbar">
        <div className="brand"><h1>Project Fox <span>· Desenvolver / Criar</span></h1></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => setStatsOpen(true)}><BarChartIcon /> Estatísticas</button>
          <button className="btn primary" onClick={() => setPlanetModalOpen(true)}><PlusIcon /> Adicionar planeta</button>
        </div>
      </header>

      {focusId && <button className="btn" id="criarBackBtn" onClick={backToSystem}><BackIcon /> Voltar ao sistema</button>}
      <div className="criar-hint" ref={hintRef} />

      {focusPlaneta && (
        <div className="focus-card">
          <div className="fc-name"><span className="fc-dot" style={{ background: `hsl(${hueOf(focusPlaneta.cor)},${12 + 68 * hval}%,60%)` }} /><span>{focusPlaneta.nome}</span></div>
          <div className="fc-type">
            {focusPlaneta.tipo[0].toUpperCase() + focusPlaneta.tipo.slice(1)} · {moonsOf(focusPlaneta).length} {moonsOf(focusPlaneta).length > 1 ? "luas" : "lua"}
          </div>
          <div className="fc-barwrap"><div className="fc-bar" style={{ width: `${hval * 100}%`, background: `hsl(${hueOf(focusPlaneta.cor)},${12 + 68 * hval}%,58%)` }} /></div>
          <div className="fc-meta">{weekly}/{focusPlaneta.metaSemanal} relatórios nesta semana</div>
          <div className="fc-ach"><AwardIcon /> {monthlyTasks} tarefas concluídas este mês</div>
          <div className="fc-status" style={{ color: statusCol }}>{statusTxt}</div>
          {focusPlaneta.objetivoPrincipal && <div className="fc-obj"><TargetIcon /><span>{focusPlaneta.objetivoPrincipal}</span></div>}
          {focusPlaneta.descricao && <div className="fc-desc">{focusPlaneta.descricao}</div>}
          <button className="btn fc-goal" onClick={() => setGoalModalOpen(true)}><TargetIcon /> Nova meta</button>
          <button className="fc-delete" onClick={() => setConfirmDeleteOpen(true)}><TrashIcon /> Excluir planeta</button>
        </div>
      )}

      <div className="criar-tooltip" ref={tooltipRef} />

      <EventsPanel planetas={planetas} eventos={eventos} onSelect={(planetaId, ev) => { focusOn(planetaId); setDetailEvento(ev); }} />

      {planetModalOpen && <PlanetModal onClose={() => setPlanetModalOpen(false)} onCreated={(id) => { setPlanetModalOpen(false); focusOn(id); }} />}

      {goalModalOpen && focusPlaneta && (
        <GoalModal planetaId={focusPlaneta.id} planetaNome={focusPlaneta.nome} onClose={() => setGoalModalOpen(false)} />
      )}

      {detailEvento && (
        <EventDetailModal
          evento={eventos.find((e) => e.id === detailEvento.id) ?? detailEvento}
          relatorios={relatorios}
          onClose={() => setDetailEvento(null)}
          onCompleted={() => handleGoalCompleted(detailEvento.planetaId, detailEvento.titulo)}
        />
      )}

      {statsOpen && <StatsModal planetas={planetas} tarefas={tarefas} onClose={() => setStatsOpen(false)} />}

      {confirmDeleteOpen && focusPlaneta && (
        <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteOpen(false); }}>
          <div className="modal" style={{ width: 340 }}>
            <h2 style={{ marginBottom: 10 }}>Excluir planeta?</h2>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, marginBottom: 22 }}>
              Todos os relatórios, recursos, fotos e metas de "{focusPlaneta.nome}" serão perdidos. Essa ação não pode ser desfeita.
            </p>
            <div className="actions">
              <button className="btn" onClick={() => setConfirmDeleteOpen(false)}>Cancelar</button>
              <button className="btn danger" onClick={() => deletePlaneta.mutate(focusPlaneta.id, { onSuccess: () => { setConfirmDeleteOpen(false); backToSystem(); } })}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {openMoonId && focusPlaneta && (
        <MoonDrawer
          planeta={focusPlaneta} moonId={openMoonId} relatorios={relatorios} recursos={recursos} fotos={fotos}
          tarefas={tarefas} secoes={secoes} onClose={() => setOpenMoonId(null)}
        />
      )}
    </div>
  );
}
