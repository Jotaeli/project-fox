import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { Evento, Planeta, Relatorio } from "@project-fox/types";
import { Canvas, Circle, RadialGradient, vec } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";
import { derivedStatus, health } from "../useCriar";
import { hueOf, MOON_STYLE } from "../criarConstants";
import { Confetti } from "./Confetti";
import { MoonNode } from "./MoonNode";
import { PlanetNode } from "./PlanetNode";
import { baseSpeedFor, distFor, makeConfettiPool, screenToWorld, worldToScreen, CONFETTI_HUES, type ConfettiParticle, type SimPlanet } from "./simulation";

const TAP_THRESHOLD = 8;
const CONFETTI_POOL = 40;

export interface SolarCanvasHandle {
  fitView: () => void;
  triggerParty: (planetId: string) => void;
}

export const SolarCanvas = forwardRef<SolarCanvasHandle, {
  planetas: Planeta[];
  relatorios: Relatorio[];
  eventos: Evento[];
  focusedPlanetId: string | null;
  onPlanetTap: (id: string) => void;
  onMoonTap: (planetId: string, moonId: string) => void;
  onEmptyTap: () => void;
}>(function SolarCanvas(
  { planetas, relatorios, eventos, focusedPlanetId, onPlanetTap, onMoonTap, onEmptyTap },
  ref
) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [partySet, setPartySet] = useState<Set<string>>(new Set());

  const simPlanets = useSharedValue<SimPlanet[]>([]);
  const nowShared = useSharedValue(0);
  const confettiPool = useSharedValue<ConfettiParticle[]>(makeConfettiPool(CONFETTI_POOL));

  const camX = useSharedValue(0);
  const camY = useSharedValue(0);
  const camScale = useSharedValue(1);
  const camTargetX = useSharedValue(0);
  const camTargetY = useSharedValue(0);
  const camTargetScale = useSharedValue(1);

  const moved = useSharedValue(0);
  const baseScale = useSharedValue(1);
  const pinchFocalWorld = useSharedValue({ x: 0, y: 0 });
  const panStartCamX = useSharedValue(0);
  const panStartCamY = useSharedValue(0);

  const healthById = new Map(planetas.map((p) => [p.id, health(p, relatorios)]));
  const activeEventByPlanet = new Map<string, boolean>();
  for (const ev of eventos) {
    if (derivedStatus(ev) === "ativo") activeEventByPlanet.set(ev.planetaId, true);
  }

  useEffect(() => {
    const current = simPlanets.value;
    const byId = new Map(current.map((p) => [p.id, p]));
    const next: SimPlanet[] = planetas.map((planeta, idx) => {
      const existing = byId.get(planeta.id);
      const dist = distFor(idx);
      if (existing) return { ...existing, dist, baseSpeed: baseSpeedFor(dist) };
      return { id: planeta.id, angle: Math.random() * Math.PI * 2, dist, baseSpeed: baseSpeedFor(dist), spin: 0 };
    });
    simPlanets.value = next;
  }, [planetas.map((p) => p.id).join(",")]);

  useFrameCallback((frame) => {
    const dt = Math.min(0.033, (frame.timeSincePreviousFrame ?? 16) / 1000);
    nowShared.value = frame.timestamp;
    const nodes = simPlanets.value;
    for (const node of nodes) {
      node.angle += node.baseSpeed * dt * 30;
    }
    simPlanets.value = nodes;

    const pool = confettiPool.value;
    let changed = false;
    for (const particle of pool) {
      if (!particle.active) continue;
      particle.age += dt * 1000;
      if (particle.age >= particle.life) { particle.active = false; changed = true; continue; }
      const ageS = particle.age / 1000;
      particle.x += Math.cos(particle.angle) * particle.speed * dt;
      particle.y += Math.sin(particle.angle) * particle.speed * dt + ageS * ageS * 40 * dt;
      particle.rotation += particle.spin * dt;
      changed = true;
    }
    if (changed) confettiPool.value = pool;

    const smooth = Math.min(1, dt * 4);
    camX.value += (camTargetX.value - camX.value) * smooth;
    camY.value += (camTargetY.value - camY.value) * smooth;
    camScale.value += (camTargetScale.value - camScale.value) * smooth;
  }, true);

  useEffect(() => {
    if (focusedPlanetId) {
      const p = simPlanets.value.find((x) => x.id === focusedPlanetId);
      if (p) { camTargetScale.value = 3; }
    } else {
      fitView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedPlanetId]);

  // enquanto focado, a câmera segue o planeta a cada frame (feito aqui via efeito leve, sem novo useFrameCallback)
  useFrameCallback(() => {
    if (!focusedPlanetId) return;
    const p = simPlanets.value.find((x) => x.id === focusedPlanetId);
    if (!p) return;
    const dist = p.dist, angle = p.angle;
    camTargetX.value = Math.cos(angle) * dist;
    camTargetY.value = Math.sin(angle) * dist;
  }, true);

  function fitView() {
    const nodes = simPlanets.value;
    if (!nodes.length) { camTargetX.value = 0; camTargetY.value = 0; camTargetScale.value = 1; return; }
    const maxDist = Math.max(...nodes.map((n) => n.dist));
    const span = maxDist * 2.4;
    const scale = Math.max(0.25, Math.min(1.4, Math.min(size.width, size.height) / span));
    camTargetX.value = 0; camTargetY.value = 0; camTargetScale.value = scale || 1;
  }

  useImperativeHandle(ref, () => ({
    fitView,
    triggerParty(planetId: string) {
      setPartySet((prev) => new Set(prev).add(planetId));
      setTimeout(() => setPartySet((prev) => { const next = new Set(prev); next.delete(planetId); return next; }), 4500);
      spawnConfettiBurst(planetId);
    },
  }));

  function spawnConfettiBurst(planetId: string) {
    const p = simPlanets.value.find((x) => x.id === planetId);
    if (!p) return;
    const pos = { x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist };
    const pool = confettiPool.value;
    let spawned = 0;
    for (const particle of pool) {
      if (spawned >= 32) break;
      if (particle.active) continue;
      particle.active = true;
      particle.x = pos.x; particle.y = pos.y;
      particle.angle = Math.random() * Math.PI * 2;
      particle.speed = 40 + Math.random() * 90;
      particle.rotation = 0;
      particle.spin = (Math.random() - 0.5) * 8;
      particle.hue = CONFETTI_HUES[Math.floor(Math.random() * CONFETTI_HUES.length)];
      particle.age = 0;
      particle.life = 2000 + Math.random() * 900;
      spawned++;
    }
    confettiPool.value = pool;
  }

  function hitTestPlanet(worldX: number, worldY: number): string | null {
    "worklet";
    let hitId: string | null = null;
    let bestDist = Infinity;
    for (const node of simPlanets.value) {
      const pos = { x: Math.cos(node.angle) * node.dist, y: Math.sin(node.angle) * node.dist };
      const dx = pos.x - worldX, dy = pos.y - worldY;
      const d = Math.sqrt(dx * dx + dy * dy);
      const rad = 18 + 10 / camScale.value;
      if (d < rad && d < bestDist) { bestDist = d; hitId = node.id; }
    }
    return hitId;
  }

  const pan = Gesture.Pan()
    .onBegin((e) => {
      moved.value = 0;
      panStartCamX.value = camX.value;
      panStartCamY.value = camY.value;
    })
    .onUpdate((e) => {
      moved.value = Math.max(moved.value, Math.abs(e.translationX), Math.abs(e.translationY));
      if (!focusedPlanetId) {
        camX.value = panStartCamX.value - e.translationX / camScale.value;
        camY.value = panStartCamY.value - e.translationY / camScale.value;
        camTargetX.value = camX.value;
        camTargetY.value = camY.value;
      }
    })
    .onEnd((e) => {
      if (moved.value < TAP_THRESHOLD) {
        const world = screenToWorld(e.x, e.y, camX.value, camY.value, camScale.value, size.width, size.height);
        const hitId = hitTestPlanet(world.x, world.y);
        if (hitId) runOnJS(onPlanetTap)(hitId);
        else runOnJS(onEmptyTap)();
      }
    });

  const pinch = Gesture.Pinch()
    .onBegin((e) => {
      baseScale.value = camScale.value;
      pinchFocalWorld.value = screenToWorld(e.focalX, e.focalY, camX.value, camY.value, camScale.value, size.width, size.height);
    })
    .onUpdate((e) => {
      const newScale = Math.max(0.2, Math.min(4, baseScale.value * e.scale));
      camScale.value = newScale;
      if (!focusedPlanetId) {
        camX.value = pinchFocalWorld.value.x - (e.focalX - size.width / 2) / newScale;
        camY.value = pinchFocalWorld.value.y - (e.focalY - size.height / 2) / newScale;
        camTargetX.value = camX.value;
        camTargetY.value = camY.value;
      }
      camTargetScale.value = newScale;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const focusedPlaneta = focusedPlanetId ? planetas.find((p) => p.id === focusedPlanetId) : null;
  const moonIds = focusedPlaneta
    ? ["relatorio", ...(focusedPlaneta.temRecursos ? ["recursos"] : []), ...(focusedPlaneta.temFotos ? ["fotos"] : [])]
    : [];

  return (
    <View style={styles.container} onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {size.width > 0 && (
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill}>
            <Canvas style={StyleSheet.absoluteFill}>
              <SunGlyph camX={camX} camY={camY} camScale={camScale} width={size.width} height={size.height} />
              {planetas.map((p, idx) => (
                <PlanetNode
                  key={p.id}
                  id={p.id}
                  hue={hueOf(p.cor)}
                  radius={14}
                  health={healthById.get(p.id) ?? 0}
                  excitement={partySet.has(p.id) ? 1 : activeEventByPlanet.get(p.id) ? 0.5 : 0}
                  simPlanets={simPlanets}
                  camX={camX} camY={camY} camScale={camScale}
                  width={size.width} height={size.height}
                  nowShared={nowShared}
                />
              ))}
              {focusedPlaneta && moonIds.map((moonId, i) => (
                <MoonNode
                  key={moonId}
                  planetId={focusedPlaneta.id}
                  index={i}
                  color={MOON_STYLE[moonId].col}
                  simPlanets={simPlanets}
                  camX={camX} camY={camY} camScale={camScale}
                  width={size.width} height={size.height}
                  nowShared={nowShared}
                />
              ))}
              <Confetti pool={confettiPool} size={CONFETTI_POOL} />
            </Canvas>
          </View>
        </GestureDetector>
      )}
    </View>
  );
});

function SunGlyph({
  camX, camY, camScale, width, height,
}: {
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
}) {
  const cx = useDerivedValue(() => worldToScreen(0, 0, camX.value, camY.value, camScale.value, width, height).x);
  const cy = useDerivedValue(() => worldToScreen(0, 0, camX.value, camY.value, camScale.value, width, height).y);
  const r = useDerivedValue(() => 28 * camScale.value);
  return (
    <Circle cx={cx} cy={cy} r={r}>
      <RadialGradient c={vec(0, 0)} r={40} colors={["#fff3c4", "#ffd66e", "#e08a2e"]} />
    </Circle>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
