import { useEffect, useRef } from "react";
import { fmtBRL } from "../../../lib/currentMonth.js";
import { BELLY, PIG_ART } from "./pigArt.js";

interface Coin { x: number; y: number }

function buildCoinPositions(): Coin[] {
  const { cx, cy, rx, ry } = BELLY;
  const coinR = 30;
  const positions: Coin[] = [];
  for (let y = cy + ry - 28; y >= cy - ry + 28; y -= 60) {
    const off = Math.round((cy + ry - 28 - y) / 60) % 2 ? 34 : 0;
    for (let x = cx - rx + 20; x <= cx + rx - 20; x += 68) {
      const dx = (x + off - cx) / (rx - coinR);
      const dy = (y - cy) / (ry - coinR);
      if (dx * dx + dy * dy <= 1) positions.push({ x: x + off, y });
    }
  }
  positions.sort((a, b) => b.y - a.y || a.x - b.x);
  return positions;
}

export function Piggy({ avail, total, spent }: { avail: number; total: number; spent: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const coinsRef = useRef<SVGCircleElement[]>([]);
  const shownRef = useRef(0);
  const dispAvailRef = useRef<number | null>(null);
  const availTextRef = useRef<HTMLDivElement>(null);

  // monta o SVG uma única vez
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { cx, cy, rx, ry } = BELLY;
    const coinR = 30;
    const positions = buildCoinPositions();

    svg.innerHTML = `
      <defs>
        <clipPath id="belly"><ellipse cx="${cx}" cy="${cy}" rx="${rx - 6}" ry="${ry - 6}"/></clipPath>
        <radialGradient id="coinG" cx="35%" cy="35%">
          <stop offset="0%" stop-color="#ffe9a8"/><stop offset="70%" stop-color="#ffd66e"/><stop offset="100%" stop-color="#d4a545"/>
        </radialGradient>
        <radialGradient id="windowG" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stop-color="rgba(255,255,255,.16)"/><stop offset="100%" stop-color="rgba(255,255,255,.02)"/>
        </radialGradient>
      </defs>
      ${PIG_ART}
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#windowG)" stroke="rgba(255,255,255,.3)" stroke-width="7"/>
      <g clip-path="url(#belly)" id="coinLayer"></g>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="7"/>
      <ellipse cx="${cx}" cy="${cy - ry * .55}" rx="${rx * .5}" ry="${ry * .2}" fill="rgba(255,255,255,.1)"/>`;

    const layer = svg.querySelector("#coinLayer")!;
    const coins: SVGCircleElement[] = [];
    positions.forEach((p) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", String(p.x));
      c.setAttribute("cy", String(p.y));
      c.setAttribute("r", String(coinR));
      c.setAttribute("fill", "url(#coinG)");
      c.setAttribute("stroke", "#b8893a");
      c.setAttribute("stroke-width", "4");
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
    <div className="piggy-panel">
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
