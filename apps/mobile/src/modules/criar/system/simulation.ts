export interface SimPlanet {
  id: string;
  angle: number;
  dist: number;
  baseSpeed: number;
  spin: number;
}

export function distFor(index: number): number {
  "worklet";
  return 150 + index * 72;
}

export function baseSpeedFor(dist: number): number {
  "worklet";
  return 22 / Math.pow(dist, 1.12);
}

export function planetPosition(angle: number, dist: number) {
  "worklet";
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
}

export function moonOrbit(index: number): { orbit: number; speed: number } {
  "worklet";
  return { orbit: 30 + index * 18, speed: 0.55 - index * 0.13 };
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

export const CONFETTI_HUES = [212, 48, 145, 330, 268];

export interface ConfettiParticle {
  active: boolean;
  x: number;
  y: number;
  angle: number;
  speed: number;
  rotation: number;
  spin: number;
  hue: number;
  age: number;
  life: number;
}

export function makeConfettiPool(size: number): ConfettiParticle[] {
  return Array.from({ length: size }, () => ({
    active: false, x: 0, y: 0, angle: 0, speed: 0, rotation: 0, spin: 0, hue: 0, age: 0, life: 1,
  }));
}
