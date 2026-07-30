import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ConexaoNota, Nota } from "@project-fox/types";
import { Canvas } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { GraphEdges, makePulsePool, type PulseSlot } from "./GraphEdges";
import { GraphLabel } from "./GraphLabel";
import { GraphNode } from "./GraphNode";
import { degreeOf, hashSeed, nodeRadius, physicsStep, screenToWorld, type SimLink, type SimNode } from "./simulation";

const TAP_THRESHOLD = 8;
const POOL_SIZE = 8;

export interface GraphCanvasHandle {
  fitView: () => void;
  createAtCenter: () => { x: number; y: number };
  firePulse: (a: string, b: string) => void;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, {
  notas: Nota[];
  conexoes: ConexaoNota[];
  selectedId: string | null;
  connectFromId: string | null;
  onNodeTap: (id: string) => void;
  onEmptyTap: () => void;
  onNodeDragEnd: (id: string, x: number, y: number) => void;
}>(function GraphCanvas(
  { notas, conexoes, selectedId, connectFromId, onNodeTap, onEmptyTap, onNodeDragEnd },
  ref
) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const simNodes = useSharedValue<SimNode[]>([]);
  const simLinks = useSharedValue<SimLink[]>([]);
  const pulseSlots = useSharedValue<PulseSlot[]>(makePulsePool(POOL_SIZE));
  const nowShared = useSharedValue(0);

  const camX = useSharedValue(0);
  const camY = useSharedValue(0);
  const camScale = useSharedValue(1);
  const camTargetX = useSharedValue(0);
  const camTargetY = useSharedValue(0);
  const camTargetScale = useSharedValue(1);

  const draggingId = useSharedValue<string | null>(null);
  const startWorld = useSharedValue({ x: 0, y: 0 });
  const moved = useSharedValue(0);
  const baseScale = useSharedValue(1);
  const pinchFocalWorld = useSharedValue({ x: 0, y: 0 });
  const panStartCamX = useSharedValue(0);
  const panStartCamY = useSharedValue(0);

  // sincroniza os nós de simulação com as notas do servidor, preservando posição/velocidade dos existentes
  useEffect(() => {
    const current = simNodes.value;
    const byId = new Map(current.map((n) => [n.id, n]));
    const next: SimNode[] = notas.map((nota) => {
      const existing = byId.get(nota.id);
      if (existing) return existing;
      const seed = hashSeed(nota.id);
      const angle = (seed / 1000) * Math.PI * 2;
      const radius = 80 + (seed % 140);
      return {
        id: nota.id,
        x: nota.posX ?? Math.cos(angle) * radius,
        y: nota.posY ?? Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        pinned: false,
      };
    });
    simNodes.value = next;
  }, [notas]);

  useEffect(() => {
    simLinks.value = conexoes.map((c) => ({ a: c.notaOrigemId, b: c.notaDestinoId }));
  }, [conexoes]);

  useFrameCallback((frame) => {
    const dt = Math.min(0.033, (frame.timeSincePreviousFrame ?? 16) / 1000);
    nowShared.value = frame.timestamp;
    const nodes = simNodes.value;
    physicsStep(nodes, simLinks.value, dt);
    simNodes.value = nodes;
    const smooth = Math.min(1, dt * 4);
    camX.value += (camTargetX.value - camX.value) * smooth;
    camY.value += (camTargetY.value - camY.value) * smooth;
    camScale.value += (camTargetScale.value - camScale.value) * smooth;
  }, true);

  useImperativeHandle(ref, () => ({
    fitView() {
      const nodes = simNodes.value;
      if (!nodes.length) { camTargetX.value = 0; camTargetY.value = 0; camTargetScale.value = 1; return; }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      }
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const spanX = Math.max(200, maxX - minX + 160);
      const spanY = Math.max(200, maxY - minY + 160);
      const scale = Math.max(0.3, Math.min(2, Math.min(size.width / spanX, size.height / spanY)));
      camTargetX.value = cx; camTargetY.value = cy; camTargetScale.value = scale || 1;
    },
    createAtCenter() {
      return { x: camX.value, y: camY.value };
    },
    firePulse(a: string, b: string) {
      const slots = pulseSlots.value;
      const idx = slots.findIndex((s) => !s.active);
      const target = idx >= 0 ? idx : 0;
      slots[target] = { active: true, a, b, t0: nowShared.value };
      pulseSlots.value = [...slots];
      setTimeout(() => {
        const s = pulseSlots.value;
        if (s[target]) { s[target] = { ...s[target], active: false }; pulseSlots.value = [...s]; }
      }, 800);
    },
  }));

  function hitTest(worldX: number, worldY: number): string | null {
    "worklet";
    let hitId: string | null = null;
    let bestDist = Infinity;
    for (const node of simNodes.value) {
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rad = nodeRadius(degreeOf(node.id, simLinks.value)) + 10 / camScale.value;
      if (dist < rad && dist < bestDist) { bestDist = dist; hitId = node.id; }
    }
    return hitId;
  }

  const pan = Gesture.Pan()
    .onBegin((e) => {
      const world = screenToWorld(e.x, e.y, camX.value, camY.value, camScale.value, size.width, size.height);
      const hitId = hitTest(world.x, world.y);
      draggingId.value = hitId;
      startWorld.value = world;
      moved.value = 0;
      panStartCamX.value = camX.value;
      panStartCamY.value = camY.value;
      if (hitId) {
        const nodes = simNodes.value;
        const idx = nodes.findIndex((n) => n.id === hitId);
        if (idx >= 0) { nodes[idx].pinned = true; simNodes.value = nodes; }
      }
    })
    .onUpdate((e) => {
      moved.value = Math.max(moved.value, Math.abs(e.translationX), Math.abs(e.translationY));
      if (draggingId.value) {
        const nodes = simNodes.value;
        const idx = nodes.findIndex((n) => n.id === draggingId.value);
        if (idx >= 0) {
          nodes[idx].x = startWorld.value.x + e.translationX / camScale.value;
          nodes[idx].y = startWorld.value.y + e.translationY / camScale.value;
          simNodes.value = nodes;
        }
      } else {
        camX.value = panStartCamX.value - e.translationX / camScale.value;
        camY.value = panStartCamY.value - e.translationY / camScale.value;
        camTargetX.value = camX.value;
        camTargetY.value = camY.value;
      }
    })
    .onEnd(() => {
      if (draggingId.value) {
        const id = draggingId.value;
        const nodes = simNodes.value;
        const idx = nodes.findIndex((n) => n.id === id);
        let fx = 0, fy = 0;
        if (idx >= 0) {
          nodes[idx].pinned = false;
          fx = nodes[idx].x; fy = nodes[idx].y;
          simNodes.value = nodes;
        }
        if (moved.value < TAP_THRESHOLD) {
          runOnJS(onNodeTap)(id!);
        } else {
          runOnJS(onNodeDragEnd)(id!, fx, fy);
        }
      } else if (moved.value < TAP_THRESHOLD) {
        runOnJS(onEmptyTap)();
      }
      draggingId.value = null;
    });

  const pinch = Gesture.Pinch()
    .onBegin((e) => {
      baseScale.value = camScale.value;
      pinchFocalWorld.value = screenToWorld(e.focalX, e.focalY, camX.value, camY.value, camScale.value, size.width, size.height);
    })
    .onUpdate((e) => {
      const newScale = Math.max(0.25, Math.min(3.5, baseScale.value * e.scale));
      camScale.value = newScale;
      camX.value = pinchFocalWorld.value.x - (e.focalX - size.width / 2) / newScale;
      camY.value = pinchFocalWorld.value.y - (e.focalY - size.height / 2) / newScale;
      camTargetX.value = camX.value;
      camTargetY.value = camY.value;
      camTargetScale.value = newScale;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  return (
    <View style={styles.container} onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {size.width > 0 && (
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill}>
            <Canvas style={StyleSheet.absoluteFill}>
              <GraphEdges
                links={conexoes.map((c) => ({ a: c.notaOrigemId, b: c.notaDestinoId }))}
                pulseSlots={pulseSlots}
                poolSize={POOL_SIZE}
                simNodes={simNodes}
                camX={camX} camY={camY} camScale={camScale}
                width={size.width} height={size.height}
                now={nowShared}
              />
              {notas.map((n) => (
                <GraphNode
                  key={n.id}
                  id={n.id}
                  badges={n.badges}
                  simNodes={simNodes}
                  simLinks={simLinks}
                  camX={camX} camY={camY} camScale={camScale}
                  width={size.width} height={size.height}
                  selected={n.id === selectedId || n.id === connectFromId}
                  dimmed={!!selectedId && selectedId !== n.id && !conexoes.some((c) => (c.notaOrigemId === selectedId && c.notaDestinoId === n.id) || (c.notaDestinoId === selectedId && c.notaOrigemId === n.id))}
                />
              ))}
            </Canvas>
            {notas.map((n) => (
              <GraphLabel
                key={n.id}
                id={n.id}
                title={n.titulo}
                simNodes={simNodes}
                camX={camX} camY={camY} camScale={camScale}
                width={size.width} height={size.height}
              />
            ))}
          </View>
        </GestureDetector>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});
