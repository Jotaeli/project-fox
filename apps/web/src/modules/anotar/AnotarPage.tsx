import { useEffect, useMemo, useRef, useState } from "react";
import type { BadgeNota } from "@project-fox/types";
import { useRegisterGuide } from "../../guides/GuideContext.js";
import { CloseIcon, FitIcon, LinkIcon, PlusIcon, TrashIcon } from "../../icons/index.js";
import { useAnotar } from "./useAnotar.js";
import "./anotar.css";

const TAU = Math.PI * 2;

export const BADGES: Record<BadgeNota, { label: string; rgb: [number, number, number] }> = {
  wishlist: { label: "Wishlist", rgb: [74, 222, 128] },
  tarefas: { label: "Tarefas", rgb: [96, 165, 250] },
  criar: { label: "Criar", rgb: [244, 114, 182] },
};
export const INDEP_RGB: [number, number, number] = [205, 220, 255];
const BADGE_ORDER: BadgeNota[] = ["wishlist", "tarefas", "criar"];

export function rgba(rgb: [number, number, number], a: number) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}
function toggleBadge(arr: BadgeNota[], b: BadgeNota): BadgeNota[] {
  const has = arr.includes(b);
  const next = has ? arr.filter((x) => x !== b) : [...arr, b];
  return next.sort((x, y) => BADGE_ORDER.indexOf(x) - BADGE_ORDER.indexOf(y));
}

interface SimNote {
  id: string; title: string; body: string; badges: BadgeNota[];
  x: number; y: number; vx: number; vy: number; pinned: boolean; born: number; seed: number;
}
function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000;
}
interface SimLink { a: string; b: string; }
interface Pulse { a: string; b: string; t0: number; dur: number; }
interface BgNode { bx: number; by: number; x: number; y: number; ph: number; amp: number; sp: number; r: number; }
interface BgLink { a: number; b: number; }
interface BgPulse { l: BgLink; t0: number; dur: number; }

function noteColors(n: SimNote) {
  if (!n.badges.length) return [INDEP_RGB];
  return n.badges.map((b) => BADGES[b].rgb);
}
function dominantRGB(n: SimNote) { return noteColors(n)[0]; }

interface Sim {
  notes: Map<string, SimNote>;
  links: SimLink[];
  cam: { x: number; y: number; s: number };
  camTarget: { x: number; y: number; s: number };
  pulses: Pulse[];
  bg: { nodes: BgNode[]; links: BgLink[]; pulses: BgPulse[] };
  hovered: string | null;
  selected: string | null;
  connectFrom: string | null;
  dragNode: string | null;
  dragMoved: boolean;
  panning: boolean;
  lastPointer: { x: number; y: number };
  downPos: { x: number; y: number };
  pendingPos: { x: number; y: number } | null;
  seeded: boolean;
  W: number; H: number; DPR: number;
}

function makeSim(): Sim {
  return {
    notes: new Map(), links: [],
    cam: { x: 0, y: 0, s: 1 }, camTarget: { x: 0, y: 0, s: 1 },
    pulses: [], bg: { nodes: [], links: [], pulses: [] },
    hovered: null, selected: null, connectFrom: null,
    dragNode: null, dragMoved: false, panning: false,
    lastPointer: { x: 0, y: 0 }, downPos: { x: 0, y: 0 }, pendingPos: null,
    seeded: false, W: 0, H: 0, DPR: 1,
  };
}
function buildBg(sim: Sim) {
  const N = 54, R = 900;
  for (let i = 0; i < N; i++) {
    const bx = (Math.random() - 0.5) * R * 2, by = (Math.random() - 0.5) * R * 2;
    sim.bg.nodes.push({ bx, by, x: bx, y: by, ph: Math.random() * TAU, amp: 8 + Math.random() * 22, sp: 0.1 + Math.random() * 0.25, r: 0.8 + Math.random() * 1.4 });
  }
  for (let i = 0; i < sim.bg.nodes.length; i++) {
    const dists = sim.bg.nodes
      .map((m, j) => ({ j, d: Math.hypot(sim.bg.nodes[i].bx - m.bx, sim.bg.nodes[i].by - m.by) }))
      .filter((o) => o.j !== i).sort((a, b) => a.d - b.d).slice(0, 2 + ((Math.random() * 2) | 0));
    for (const o of dists) if (o.d < 340 && !sim.bg.links.some((l) => l.a === o.j && l.b === i)) sim.bg.links.push({ a: i, b: o.j });
  }
}

export function AnotarPage() {
  useRegisterGuide("anotar");
  const { notas, conexoes, addNota, updateNota, deleteNota, addConexao, deleteConexao } = useAnotar();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Sim>(makeSim());
  const rafRef = useRef<number>();

  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newBadges, setNewBadges] = useState<BadgeNota[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drTitle, setDrTitle] = useState("");
  const [drBody, setDrBody] = useState("");
  const [drBadges, setDrBadges] = useState<BadgeNota[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const selectedNota = useMemo(() => notas.find((n) => n.id === selectedId) ?? null, [notas, selectedId]);
  const neighbors = useMemo(() => {
    if (!selectedId) return [];
    const ids = new Set<string>();
    for (const c of conexoes) {
      if (c.notaOrigemId === selectedId) ids.add(c.notaDestinoId);
      if (c.notaDestinoId === selectedId) ids.add(c.notaOrigemId);
    }
    return [...ids].map((id) => notas.find((n) => n.id === id)).filter((n): n is NonNullable<typeof n> => !!n);
  }, [selectedId, conexoes, notas]);

  function setHint() {
    const el = hintRef.current;
    if (!el) return;
    if (simRef.current.connectFrom) {
      el.textContent = "Clique noutra nota para conectar · Esc para cancelar";
      el.classList.add("connect");
    } else {
      el.textContent = "Clique numa nota para abrir · arraste para reposicionar · role para dar zoom";
      el.classList.remove("connect");
    }
  }

  function selectNote(id: string) {
    simRef.current.selected = id;
    setSelectedId(id);
    const n = notas.find((x) => x.id === id);
    setDrTitle(n?.titulo ?? "");
    setDrBody(n?.conteudo ?? "");
    setDrBadges(n?.badges ?? []);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedId(null);
    simRef.current.selected = null;
  }

  function firePulse(a: string, b: string) {
    simRef.current.pulses.push({ a, b, t0: performance.now(), dur: 750 });
  }

  function handleClick(note: SimNote | null) {
    const sim = simRef.current;
    if (sim.connectFrom) {
      const from = sim.connectFrom;
      if (note && note.id !== from) {
        const already = sim.links.some((l) => (l.a === from && l.b === note.id) || (l.a === note.id && l.b === from));
        if (!already) {
          sim.links.push({ a: from, b: note.id });
          firePulse(from, note.id);
          addConexao.mutate({ origemId: from, destinoId: note.id });
        }
      }
      sim.connectFrom = null;
      setHint();
      if (note) selectNote(from);
      return;
    }
    if (note) selectNote(note.id);
    else closeDrawer();
  }
  const handleClickRef = useRef(handleClick);
  handleClickRef.current = handleClick;
  const updateNotaRef = useRef(updateNota);
  updateNotaRef.current = updateNota;

  /* ---------------- initial mount: canvas setup, physics loop, listeners ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const ctx = canvas.getContext("2d")!;
    const sim = simRef.current;
    buildBg(sim);

    function resize() {
      sim.DPR = Math.min(window.devicePixelRatio || 1, 2);
      sim.W = container.clientWidth; sim.H = container.clientHeight;
      canvas.width = sim.W * sim.DPR; canvas.height = sim.H * sim.DPR;
      canvas.style.width = sim.W + "px"; canvas.style.height = sim.H + "px";
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function worldToScreen(wx: number, wy: number) {
      return { x: (wx - sim.cam.x) * sim.cam.s + sim.W / 2, y: (wy - sim.cam.y) * sim.cam.s + sim.H / 2 };
    }
    function screenToWorld(sx: number, sy: number) {
      return { x: (sx - sim.W / 2) / sim.cam.s + sim.cam.x, y: (sy - sim.H / 2) / sim.cam.s + sim.cam.y };
    }
    function fitView(animated: boolean) {
      const notes = [...sim.notes.values()];
      if (!notes.length) return;
      let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      for (const n of notes) { minx = Math.min(minx, n.x); miny = Math.min(miny, n.y); maxx = Math.max(maxx, n.x); maxy = Math.max(maxy, n.y); }
      const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
      const spanX = (maxx - minx) + 160, spanY = (maxy - miny) + 160;
      const s = Math.min(1.3, Math.min(sim.W / spanX, sim.H / spanY) || 1);
      sim.camTarget.x = cx; sim.camTarget.y = cy; sim.camTarget.s = s;
      if (!animated) { sim.cam.x = cx; sim.cam.y = cy; sim.cam.s = s; }
    }
    (containerRef.current as any)._fitView = fitView;

    function degree(id: string) { let d = 0; for (const l of sim.links) if (l.a === id || l.b === id) d++; return d; }
    function nodeRadius(n: SimNote) { return Math.min(17, 9 + degree(n.id) * 1.15); }
    function neighborsOf(id: string) {
      const s = new Set<string>();
      for (const l of sim.links) { if (l.a === id) s.add(l.b); if (l.b === id) s.add(l.a); }
      return s;
    }

    function physicsStep(dt: number) {
      const notes = [...sim.notes.values()];
      const REP = 5200, SPRING = 0.012, REST = 118, CENTER = 0.004, DAMP = 0.86;
      for (let i = 0; i < notes.length; i++) {
        const a = notes[i];
        if (a.pinned) continue;
        let fx = 0, fy = 0;
        for (let j = 0; j < notes.length; j++) {
          if (i === j) continue;
          const b = notes[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) { d2 = 1; dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
          const d = Math.sqrt(d2);
          const f = REP / d2;
          fx += (dx / d) * f; fy += (dy / d) * f;
        }
        fx -= a.x * CENTER; fy -= a.y * CENTER;
        (a as any).fx = fx; (a as any).fy = fy;
      }
      for (const l of sim.links) {
        const a = sim.notes.get(l.a), b = sim.notes.get(l.b);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - REST) * SPRING;
        const ux = dx / d, uy = dy / d;
        if (!a.pinned) { (a as any).fx += ux * f * 60; (a as any).fy += uy * f * 60; }
        if (!b.pinned) { (b as any).fx -= ux * f * 60; (b as any).fy -= uy * f * 60; }
      }
      for (const a of notes) {
        if (a.pinned) continue;
        a.vx = (a.vx + (a as any).fx * dt) * DAMP;
        a.vy = (a.vy + (a as any).fy * dt) * DAMP;
        const max = 260;
        a.vx = Math.max(-max, Math.min(max, a.vx));
        a.vy = Math.max(-max, Math.min(max, a.vy));
        a.x += a.vx * dt; a.y += a.vy * dt;
      }
    }
    (containerRef.current as any)._physicsStep = physicsStep;
    (containerRef.current as any)._fitViewNoAnim = () => fitView(false);

    function nodeAt(sx: number, sy: number): SimNote | null {
      const w = screenToWorld(sx, sy);
      let best: SimNote | null = null, bestD = 1e9;
      for (const n of sim.notes.values()) {
        const r = nodeRadius(n) + 6 / sim.cam.s;
        const d = Math.hypot(w.x - n.x, w.y - n.y);
        if (d < r && d < bestD) { best = n; bestD = d; }
      }
      return best;
    }

    function drawBg(t: number) {
      ctx.save();
      ctx.translate(sim.W / 2, sim.H / 2);
      ctx.scale(sim.cam.s, sim.cam.s);
      ctx.translate(-sim.cam.x * 0.35, -sim.cam.y * 0.35);
      for (const n of sim.bg.nodes) {
        n.x = n.bx + Math.cos(t * n.sp + n.ph) * n.amp;
        n.y = n.by + Math.sin(t * n.sp * 1.1 + n.ph) * n.amp;
      }
      ctx.lineWidth = 1 / sim.cam.s;
      for (const l of sim.bg.links) {
        const a = sim.bg.nodes[l.a], b = sim.bg.nodes[l.b];
        ctx.strokeStyle = "rgba(120,150,230,.05)";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (const n of sim.bg.nodes) {
        ctx.fillStyle = "rgba(150,175,240,.10)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, TAU); ctx.fill();
      }
      const now = performance.now();
      for (let i = sim.bg.pulses.length - 1; i >= 0; i--) {
        const p = sim.bg.pulses[i]; const k = (now - p.t0) / p.dur;
        if (k > 1) { sim.bg.pulses.splice(i, 1); continue; }
        const a = sim.bg.nodes[p.l.a], b = sim.bg.nodes[p.l.b];
        const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
        ctx.fillStyle = `rgba(150,190,255,${(1 - k) * 0.4})`;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    function drawGraph(t: number) {
      ctx.save();
      ctx.translate(sim.W / 2, sim.H / 2);
      ctx.scale(sim.cam.s, sim.cam.s);
      ctx.translate(-sim.cam.x, -sim.cam.y);

      const hiId = sim.hovered || sim.selected;
      const hi = hiId ? sim.notes.get(hiId) ?? null : null;
      const hiNeighbors = hi ? neighborsOf(hi.id) : null;
      const dimmed = (id: string) => !!hi && id !== hi.id && !hiNeighbors!.has(id);

      ctx.lineCap = "round";
      for (const l of sim.links) {
        const a = sim.notes.get(l.a), b = sim.notes.get(l.b);
        if (!a || !b) continue;
        const active = !!hi && (l.a === hi.id || l.b === hi.id);
        const dim = !!hi && !active;
        const ca = dominantRGB(a), cb = dominantRGB(b);
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        const la = dim ? 0.05 : active ? 0.5 : 0.18;
        grad.addColorStop(0, rgba(ca, la));
        grad.addColorStop(1, rgba(cb, la));
        ctx.strokeStyle = grad;
        ctx.lineWidth = (active ? 2.1 : 1.3) / sim.cam.s;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      const now = performance.now();
      for (let i = sim.pulses.length - 1; i >= 0; i--) {
        const p = sim.pulses[i]; const k = (now - p.t0) / p.dur;
        if (k > 1) { sim.pulses.splice(i, 1); continue; }
        const a = sim.notes.get(p.a), b = sim.notes.get(p.b);
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
        const c = dominantRGB(a);
        ctx.fillStyle = rgba(c, (1 - k) * 0.9);
        ctx.beginPath(); ctx.arc(x, y, 2.6 / sim.cam.s + 1.2, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(c, (1 - k) * 0.25);
        ctx.beginPath(); ctx.arc(x, y, 6 / sim.cam.s, 0, TAU); ctx.fill();
      }

      if (sim.connectFrom) {
        const a = sim.notes.get(sim.connectFrom);
        if (a) {
          const w = screenToWorld(sim.lastPointer.x, sim.lastPointer.y);
          ctx.strokeStyle = "rgba(110,168,255,.6)";
          ctx.lineWidth = 1.6 / sim.cam.s;
          ctx.setLineDash([5 / sim.cam.s, 5 / sim.cam.s]);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(w.x, w.y); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      for (const n of sim.notes.values()) {
        const r = nodeRadius(n);
        const colors = noteColors(n);
        const isHi = hi === n;
        const isNb = !!hi && hiNeighbors!.has(n.id);
        const dim = dimmed(n.id);
        const appear = Math.min(1, (now - n.born) / 400);
        const baseA = (dim ? 0.32 : 1) * appear;
        const boost = isHi ? 1.5 : isNb ? 1.15 : 1;

        ctx.globalCompositeOperation = "lighter";
        const perA = (0.42 / Math.sqrt(colors.length)) * baseA * boost;
        for (const c of colors) {
          const gR = r * (3.0 + 0.25 * Math.sin(t * 1.4 + n.seed));
          const g = ctx.createRadialGradient(n.x, n.y, r * 0.3, n.x, n.y, gR);
          g.addColorStop(0, rgba(c, perA));
          g.addColorStop(1, rgba(c, 0));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(n.x, n.y, gR, 0, TAU); ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";

        const dom = colors[0];
        const core = ctx.createRadialGradient(n.x - r * 0.25, n.y - r * 0.25, r * 0.1, n.x, n.y, r);
        core.addColorStop(0, `rgba(255,255,255,${0.95 * baseA})`);
        core.addColorStop(0.55, rgba(n.badges.length ? dom : INDEP_RGB, 0.95 * baseA));
        core.addColorStop(1, rgba(n.badges.length ? dom : INDEP_RGB, 0.35 * baseA));
        ctx.fillStyle = core;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU); ctx.fill();

        if (isHi) {
          ctx.strokeStyle = "rgba(255,255,255,.5)";
          ctx.lineWidth = 1.5 / sim.cam.s;
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 4 / sim.cam.s, 0, TAU); ctx.stroke();
        }
      }
      ctx.restore();

      ctx.textAlign = "center";
      for (const n of sim.notes.values()) {
        const r = nodeRadius(n);
        const sc = worldToScreen(n.x, n.y);
        const isHi = hi === n, isNb = !!hi && hiNeighbors!.has(n.id);
        const dim = dimmed(n.id);
        const showLabel = isHi || isNb || sim.cam.s > 0.72;
        if (!showLabel) continue;
        const a = (dim ? 0.3 : isHi ? 1 : 0.82) * Math.min(1, (performance.now() - n.born) / 400);
        ctx.font = `${isHi ? "600 " : ""}12px -apple-system, "Segoe UI", sans-serif`;
        const y = sc.y + r * sim.cam.s + 15;
        ctx.fillStyle = `rgba(6,10,24,${a * 0.6})`;
        ctx.fillText(n.title, sc.x + 0.5, y + 0.5);
        ctx.fillStyle = `rgba(220,230,255,${a})`;
        ctx.fillText(n.title, sc.x, y);
      }
    }

    let last = performance.now();
    function frame(now: number) {
      const t = now / 1000;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      physicsStep(dt);

      sim.cam.x += (sim.camTarget.x - sim.cam.x) * Math.min(1, dt * 4);
      sim.cam.y += (sim.camTarget.y - sim.cam.y) * Math.min(1, dt * 4);
      sim.cam.s += (sim.camTarget.s - sim.cam.s) * Math.min(1, dt * 4);

      ctx.setTransform(sim.DPR, 0, 0, sim.DPR, 0, 0);
      ctx.clearRect(0, 0, sim.W, sim.H);
      drawBg(t);
      drawGraph(t);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    function onMouseDown(e: MouseEvent) {
      sim.downPos = { x: e.clientX, y: e.clientY };
      sim.lastPointer = { x: e.clientX, y: e.clientY };
      const rect = canvas.getBoundingClientRect();
      const n = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (n && !sim.connectFrom) { sim.dragNode = n.id; sim.dragMoved = false; n.pinned = true; }
      else if (!n) { sim.panning = true; }
    }
    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const dx = sx - sim.lastPointer.x, dy = sy - sim.lastPointer.y;
      sim.lastPointer = { x: sx, y: sy };
      if (sim.dragNode) {
        const n = sim.notes.get(sim.dragNode);
        if (n) {
          const w = screenToWorld(sx, sy);
          n.x = w.x; n.y = w.y; n.vx = n.vy = 0;
          if (Math.hypot(e.clientX - sim.downPos.x, e.clientY - sim.downPos.y) > 4) sim.dragMoved = true;
        }
        return;
      }
      if (sim.panning) {
        sim.cam.x -= dx / sim.cam.s; sim.cam.y -= dy / sim.cam.s;
        sim.camTarget.x = sim.cam.x; sim.camTarget.y = sim.cam.y;
        return;
      }
      const n = nodeAt(sx, sy);
      sim.hovered = n ? n.id : null;
      canvas.style.cursor = sim.connectFrom ? "crosshair" : n ? "pointer" : "grab";
      const tooltip = tooltipRef.current;
      if (tooltip) {
        if (n) {
          const badgeTxt = n.badges.length ? n.badges.map((b) => BADGES[b].label).join(" · ") : "Independente";
          tooltip.innerHTML = `<b>${n.title}</b><br><span style="color:var(--muted)">${badgeTxt} · ${degree(n.id)} conexões</span>`;
          tooltip.classList.add("show");
          tooltip.style.left = Math.min(sim.W - 250, sx + 15) + "px";
          tooltip.style.top = sy + 15 + "px";
        } else tooltip.classList.remove("show");
      }
    }
    function onMouseUp(e: MouseEvent) {
      if (sim.dragNode) {
        const n = sim.notes.get(sim.dragNode);
        if (n) {
          n.pinned = false;
          if (!sim.dragMoved) handleClickRef.current(n);
          else updateNotaRef.current.mutate({ id: n.id, posX: n.x, posY: n.y });
        }
        sim.dragNode = null; sim.panning = false; return;
      }
      if (sim.panning) {
        sim.panning = false;
        if (Math.hypot(e.clientX - sim.downPos.x, e.clientY - sim.downPos.y) < 4) handleClickRef.current(null);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const n = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (sim.connectFrom && n) handleClickRef.current(n);
    }
    function onDblClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      if (nodeAt(sx, sy)) return;
      sim.pendingPos = screenToWorld(sx, sy);
      openAddModalRef.current();
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const before = screenToWorld(sx, sy);
      const factor = Math.exp(-e.deltaY * 0.0012);
      sim.cam.s = Math.max(0.25, Math.min(2.6, sim.cam.s * factor));
      const after = screenToWorld(sx, sy);
      sim.cam.x += before.x - after.x; sim.cam.y += before.y - after.y;
      sim.camTarget.x = sim.cam.x; sim.camTarget.y = sim.cam.y; sim.camTarget.s = sim.cam.s;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("dblclick", onDblClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("dblclick", onDblClick);
      canvas.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModalRef = useRef<() => void>(() => {});
  openAddModalRef.current = () => {
    setNewBadges([]); setNewTitle(""); setNewBody(""); setModalOpen(true);
  };

  /* ---------------- sync query data into the sim graph ---------------- */
  useEffect(() => {
    const sim = simRef.current;
    const ids = new Set(notas.map((n) => n.id));
    for (const id of [...sim.notes.keys()]) if (!ids.has(id)) sim.notes.delete(id);

    let addedAny = false;
    notas.forEach((n, i) => {
      const existing = sim.notes.get(n.id);
      if (existing) {
        existing.title = n.titulo; existing.body = n.conteudo; existing.badges = n.badges;
        return;
      }
      addedAny = true;
      const ang = (i / Math.max(1, notas.length)) * TAU;
      sim.notes.set(n.id, {
        id: n.id, title: n.titulo, body: n.conteudo, badges: n.badges,
        x: n.posX ?? Math.cos(ang) * 220 + (Math.random() - 0.5) * 60,
        y: n.posY ?? Math.sin(ang) * 220 + (Math.random() - 0.5) * 60,
        vx: 0, vy: 0, pinned: false, born: n.id === selectedId ? performance.now() : performance.now() - 10000,
        seed: hashSeed(n.id),
      });
    });

    sim.links = conexoes.map((c) => ({ a: c.notaOrigemId, b: c.notaDestinoId }));

    const container = containerRef.current as any;
    if (!sim.seeded && sim.notes.size && container?._physicsStep) {
      sim.seeded = true;
      for (let i = 0; i < 260; i++) container._physicsStep(1 / 60);
      container._fitViewNoAnim();
    } else if (addedAny && container?._physicsStep) {
      for (let i = 0; i < 40; i++) container._physicsStep(1 / 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notas, conexoes]);

  useEffect(() => { setHint(); }, []);

  /* ---------------- UI handlers ---------------- */
  function handleCreateNote() {
    const sim = simRef.current;
    const title = newTitle.trim() || "Nova nota";
    const pos = sim.pendingPos ?? { x: sim.cam.x + (Math.random() - 0.5) * 60, y: sim.cam.y + (Math.random() - 0.5) * 60 };
    addNota.mutate(
      { titulo: title, conteudo: newBody.trim(), badges: newBadges, posX: pos.x, posY: pos.y },
      { onSuccess: (n) => { setModalOpen(false); sim.pendingPos = null; selectNote(n.id); } },
    );
  }

  function handleDrTitleChange(v: string) {
    setDrTitle(v);
    if (!selectedId) return;
    const n = simRef.current.notes.get(selectedId);
    if (n) n.title = v || "Sem título";
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateNota.mutate({ id: selectedId, titulo: v.trim() || "Sem título" }), 500);
  }
  function handleDrBodyChange(v: string) {
    setDrBody(v);
    if (!selectedId) return;
    const n = simRef.current.notes.get(selectedId);
    if (n) n.body = v;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateNota.mutate({ id: selectedId, conteudo: v }), 500);
  }
  function handleDrBadgeToggle(b: BadgeNota) {
    if (!selectedId) return;
    const next = toggleBadge(drBadges, b);
    setDrBadges(next);
    const n = simRef.current.notes.get(selectedId);
    if (n) n.badges = next;
    updateNota.mutate({ id: selectedId, badges: next });
  }

  function handleConnectClick() {
    if (!selectedId) return;
    simRef.current.connectFrom = selectedId;
    setDrawerOpen(false);
    setHint();
  }
  function handleRemoveConn(neighborId: string) {
    if (!selectedId) return;
    simRef.current.links = simRef.current.links.filter(
      (l) => !((l.a === selectedId && l.b === neighborId) || (l.a === neighborId && l.b === selectedId)),
    );
    deleteConexao.mutate({ a: selectedId, b: neighborId });
  }
  function handleGoToNeighbor(id: string) {
    selectNote(id);
    const n = simRef.current.notes.get(id);
    if (n) { simRef.current.camTarget.x = n.x; simRef.current.camTarget.y = n.y; }
  }
  function handleDelete() {
    if (!selectedId) return;
    deleteNota.mutate(selectedId);
    setConfirmOpen(false);
    setDrawerOpen(false);
    simRef.current.selected = null;
    setSelectedId(null);
  }
  function handleFit() {
    (containerRef.current as any)?._fitView?.(true);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (modalOpen) setModalOpen(false);
      else if (confirmOpen) setConfirmOpen(false);
      else if (simRef.current.connectFrom) { simRef.current.connectFrom = null; setHint(); }
      else if (drawerOpen) closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const drNodeColor = useMemo(() => {
    if (!drBadges.length) return `rgb(${INDEP_RGB.join(",")})`;
    const c = BADGES[drBadges[0]].rgb;
    return `rgb(${c.join(",")})`;
  }, [drBadges]);

  return (
    <div className="anotar-page" ref={containerRef}>
      <canvas ref={canvasRef} />

      <div className="anotar-topbar">
        <button className="btn" onClick={handleFit}><FitIcon /> Centralizar</button>
        <button className="btn primary" onClick={() => { simRef.current.pendingPos = null; openAddModalRef.current(); }}>
          <PlusIcon /> Nova nota
        </button>
      </div>

      <div className="anotar-stats">{notas.length} notas · {conexoes.length} conexões</div>
      <div className="anotar-hint" ref={hintRef} />

      <div className="anotar-legend">
        <div className="lg-row"><span className="lg-dot" style={{ background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} /> Wishlist</div>
        <div className="lg-row"><span className="lg-dot" style={{ background: "var(--blue)", boxShadow: "0 0 8px var(--blue)" }} /> Tarefas</div>
        <div className="lg-row"><span className="lg-dot" style={{ background: "var(--pink)", boxShadow: "0 0 8px var(--pink)" }} /> Criar</div>
        <div className="lg-row"><span className="lg-dot" style={{ background: "#dce6ff", boxShadow: "0 0 8px #dce6ff" }} /> Independente</div>
      </div>

      <div className="anotar-tooltip" ref={tooltipRef} />

      {modalOpen && (
        <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal">
            <h2>Nova nota</h2>
            <div className="field">
              <label>Título</label>
              <input type="text" maxLength={40} placeholder="Ex.: Ideia para um canal" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Conteúdo</label>
              <textarea maxLength={400} placeholder="Escreva livremente…" value={newBody} onChange={(e) => setNewBody(e.target.value)} />
            </div>
            <div className="field">
              <label>Badges — com o que essa nota tem a ver?</label>
              <div className="badge-toggles">
                {BADGE_ORDER.map((b) => (
                  <div key={b} className={`badge-tog${newBadges.includes(b) ? " sel" : ""}`} data-b={b}
                    onClick={() => setNewBadges(toggleBadge(newBadges, b))}>
                    <span className="bt-dot" style={{ background: `rgb(${BADGES[b].rgb.join(",")})` }} /> {BADGES[b].label}
                  </div>
                ))}
              </div>
            </div>
            <div className="actions">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn primary" onClick={handleCreateNote}>Criar nota</button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="modal-wrap open" onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}>
          <div className="modal" style={{ width: 340 }}>
            <h2 style={{ marginBottom: 10 }}>Excluir nota?</h2>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, marginBottom: 22 }}>
              A nota "{selectedNota?.titulo}" e suas conexões serão removidas da rede. Essa ação não pode ser desfeita.
            </p>
            <div className="actions">
              <button className="btn" onClick={() => setConfirmOpen(false)}>Cancelar</button>
              <button className="btn warn-btn" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`anotar-drawer${drawerOpen ? " open" : ""}`}>
        <div className="dr-head">
          <span className="dr-node" style={{ background: drNodeColor, boxShadow: `0 0 10px ${drNodeColor}` }} />
          <input className="dr-title-input" maxLength={40} placeholder="Sem título" value={drTitle}
            onChange={(e) => handleDrTitleChange(e.target.value)} />
          <button className="dr-close" onClick={closeDrawer}><CloseIcon /></button>
        </div>
        <div className="dr-body">
          <div className="dr-sec">
            <div className="dr-sec-label">Conteúdo</div>
            <textarea maxLength={400} placeholder="Escreva livremente…" value={drBody} onChange={(e) => handleDrBodyChange(e.target.value)} />
          </div>
          <div className="dr-sec">
            <div className="dr-sec-label">Badges</div>
            <div className="badge-toggles">
              {BADGE_ORDER.map((b) => (
                <div key={b} className={`badge-tog${drBadges.includes(b) ? " sel" : ""}`} data-b={b} onClick={() => handleDrBadgeToggle(b)}>
                  <span className="bt-dot" style={{ background: `rgb(${BADGES[b].rgb.join(",")})` }} /> {BADGES[b].label}
                </div>
              ))}
            </div>
          </div>
          <div className="dr-sec">
            <div className="dr-sec-label">Conexões</div>
            {neighbors.length === 0 && (
              <div className="conn-empty">Sem conexões ainda. Ligue esta nota a outras para formar a rede.</div>
            )}
            {neighbors.map((m) => {
              const c = m.badges.length ? BADGES[m.badges[0]].rgb : INDEP_RGB;
              const rgb = `rgb(${c.join(",")})`;
              return (
                <div key={m.id} className="conn-item" onClick={() => handleGoToNeighbor(m.id)}>
                  <span className="conn-dot" style={{ background: rgb, boxShadow: `0 0 7px ${rgb}` }} />
                  <span className="conn-name">{m.titulo}</span>
                  <button className="conn-x" onClick={(e) => { e.stopPropagation(); handleRemoveConn(m.id); }}><CloseIcon /></button>
                </div>
              );
            })}
            <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={handleConnectClick}>
              <LinkIcon /> Conectar a outra nota
            </button>
          </div>
        </div>
        <div className="dr-foot">
          <button className="btn danger" onClick={() => setConfirmOpen(true)}><TrashIcon /> Excluir</button>
        </div>
      </aside>
    </div>
  );
}
