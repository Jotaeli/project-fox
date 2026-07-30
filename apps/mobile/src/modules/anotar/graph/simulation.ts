export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

export interface SimLink {
  a: string;
  b: string;
}

export const REP = 5200;
export const SPRING = 0.012;
export const REST = 118;
export const CENTER = 0.004;
export const DAMP = 0.86;
export const MAX_VEL = 260;

export function physicsStep(nodes: SimNode[], links: SimLink[], dt: number) {
  "worklet";
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    if (a.pinned) continue;
    let fx = 0;
    let fy = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) {
        dx = (Math.random() - 0.5) * 2;
        dy = (Math.random() - 0.5) * 2;
        d2 = 1;
      }
      const f = REP / d2;
      const d = Math.sqrt(d2);
      fx += (dx / d) * f;
      fy += (dy / d) * f;
    }
    fx -= a.x * CENTER;
    fy -= a.y * CENTER;
    a.vx += fx * dt;
    a.vy += fy * dt;
  }

  for (const link of links) {
    const a = nodes.find((node) => node.id === link.a);
    const b = nodes.find((node) => node.id === link.b);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const f = (d - REST) * SPRING * 60;
    const fx = (dx / d) * f;
    const fy = (dy / d) * f;
    if (!a.pinned) { a.vx += fx * dt; a.vy += fy * dt; }
    if (!b.pinned) { b.vx -= fx * dt; b.vy -= fy * dt; }
  }

  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    if (a.pinned) { a.vx = 0; a.vy = 0; continue; }
    a.vx *= DAMP;
    a.vy *= DAMP;
    const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    if (speed > MAX_VEL) {
      a.vx = (a.vx / speed) * MAX_VEL;
      a.vy = (a.vy / speed) * MAX_VEL;
    }
    a.x += a.vx * dt;
    a.y += a.vy * dt;
  }
}

export function degreeOf(id: string, links: SimLink[]): number {
  "worklet";
  let d = 0;
  for (const link of links) if (link.a === id || link.b === id) d++;
  return d;
}

export function nodeRadius(degree: number): number {
  "worklet";
  return Math.min(17, 9 + degree * 1.15);
}

export function worldToScreen(
  wx: number, wy: number, camX: number, camY: number, camS: number, width: number, height: number
) {
  "worklet";
  return { x: width / 2 + (wx - camX) * camS, y: height / 2 + (wy - camY) * camS };
}

export function screenToWorld(
  sx: number, sy: number, camX: number, camY: number, camS: number, width: number, height: number
) {
  "worklet";
  return { x: (sx - width / 2) / camS + camX, y: (sy - height / 2) / camS + camY };
}

export function hashSeed(id: string): number {
  "worklet";
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000;
}
