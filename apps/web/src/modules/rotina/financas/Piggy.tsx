import { useEffect, useRef } from "react";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { BELLY, BELLY_PATH, PIG_ART } from "./pigArt.js";

interface Coin { x: number; y: number }

const COIN_R = 26;

function buildCoinPositions(): Coin[] {
  const { cx, cy, rx, ry } = BELLY;
  const positions: Coin[] = [];
  for (let y = cy + ry - 24; y >= cy - ry + 24; y -= 52) {
    const off = Math.round((cy + ry - 24 - y) / 52) % 2 ? 30 : 0;
    for (let x = cx - rx + 18; x <= cx + rx - 18; x += 60) {
      const dx = (x + off - cx) / (rx - COIN_R);
      const dy = (y - cy) / (ry - COIN_R);
      if (dx * dx + dy * dy <= 1) positions.push({ x: x + off, y });
    }
  }
  positions.sort((a, b) => b.y - a.y || a.x - b.x);
  return positions;
}

export function Piggy({ avail, total, spent }: { avail: number; total: number; spent: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const coinsRef = useRef<SVGUseElement[]>([]);
  const shownRef = useRef(0);
  const dispAvailRef = useRef<number | null>(null);
  const availTextRef = useRef<HTMLDivElement>(null);

  // monta o SVG uma única vez
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { cx, cy, rx, ry } = BELLY;
    const positions = buildCoinPositions();

    svg.innerHTML = `
      <defs>
        <clipPath id="belly"><path d="${BELLY_PATH}"/></clipPath>
        <radialGradient id="coinG" cx="35%" cy="35%">
          <stop offset="0%" stop-color="#ffe9a8"/><stop offset="70%" stop-color="#ffd66e"/><stop offset="100%" stop-color="#d4a545"/>
        </radialGradient>
        <radialGradient id="windowG" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stop-color="rgba(255,255,255,.16)"/><stop offset="100%" stop-color="rgba(255,255,255,.02)"/>
        </radialGradient>
        <g id="coinFox">
          <circle r="${COIN_R}" fill="url(#coinG)" stroke="#b8893a" stroke-width="3.5"/>
          <g transform="scale(1.8) translate(-12,-11)" fill="none" stroke="#9c6d28" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4l5 4 3-2 3 2 5-4-2 9c-.6 3-3 5-6 5s-5.4-2-6-5L4 4z"/>
            <path d="M9 13c.8.8 1.9 1.2 3 1.2s2.2-.4 3-1.2"/>
          </g>
        </g>
      </defs>
      ${PIG_ART}
      <path d="${BELLY_PATH}" fill="url(#windowG)" stroke="rgba(255,255,255,.3)" stroke-width="7"/>
      <g clip-path="url(#belly)" id="coinLayer"></g>
      <path d="${BELLY_PATH}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="7"/>
      <ellipse cx="${cx}" cy="${cy - ry * .55}" rx="${rx * .5}" ry="${ry * .2}" fill="rgba(255,255,255,.1)"/>`;

    const layer = svg.querySelector("#coinLayer")!;
    const coins: SVGUseElement[] = [];
    positions.forEach((p) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "use");
      c.setAttribute("href", "#coinFox");
      c.setAttribute("x", String(p.x));
      c.setAttribute("y", String(p.y));
      c.classList.add("pig-coin", "hid");
      layer.appendChild(c);
      coins.push(c);
    });
    coinsRef.current = coins;
    shownRef.current = 0;
  }, []);

  // anima moedas + número disponível quando os valores mudam
  useEffect(() => {
    const coins = coinsRef.current;
    if (!coins.length) return;
    const frac = total > 0 ? avail / total : 0;
    const target = Math.round(frac * coins.length);
    const shown = shownRef.current;
    if (target !== shown) {
      const dir = target > shown ? 1 : -1;
      let idx = 0;
      for (let i = shown; i !== target; i += dir) {
        const coin = coins[dir > 0 ? i : i - 1];
        setTimeout(() => coin.classList.toggle("hid", dir < 0), idx * 28);
        idx++;
      }
      shownRef.current = target;
    }

    const from = dispAvailRef.current ?? avail;
    const to = avail;
    if (dispAvailRef.current === null) {
      dispAvailRef.current = to;
      if (availTextRef.current) availTextRef.current.textContent = fmtBRL(to);
      return;
    }
    const t0 = performance.now();
    const dur = 600;
    function step(now: number) {
      const k = Math.min(1, (now - t0) / dur);
      const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (availTextRef.current) availTextRef.current.textContent = fmtBRL(v);
      if (k < 1) requestAnimationFrame(step);
      else dispAvailRef.current = to;
    }
    requestAnimationFrame(step);
  }, [avail, total]);

  const pct = total ? Math.round((avail / total) * 100) : 0;

  return (
    <div className="piggy-panel" style={{ "--pig-glow": Math.min(0.6, 0.22 + (pct / 100) * 0.38) } as React.CSSProperties}>
      <div id="piggyWrap">
        <div id="piggyTip">
          <b style={{ color: "var(--gold)" }}>{fmtBRL(avail)}</b> ainda no cofrinho<br />
          <span style={{ color: "var(--muted)" }}>renda {fmtBRL(total)} · gasto {fmtBRL(spent)}</span>
        </div>
        <svg ref={svgRef} viewBox="60 180 1130 900" width={280} height={223} />
      </div>
      <div className="fin-avail" ref={availTextRef}>{fmtBRL(avail)}</div>
      <div className="fin-avail-sub">disponíveis de {fmtBRL(total)} · {pct}% do cofrinho</div>
    </div>
  );
}
