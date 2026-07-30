import { Circle, Group, Line } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { worldToScreen, type SimLink, type SimNode } from "./simulation";

const LINK_COLOR = "rgba(148,180,255,0.35)";

function GraphLink({
  link, simNodes, camX, camY, camScale, width, height,
}: {
  link: SimLink;
  simNodes: SharedValue<SimNode[]>;
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
}) {
  const p1 = useDerivedValue(() => {
    const n = simNodes.value.find((x) => x.id === link.a);
    if (!n) return { x: -1000, y: -1000 };
    return worldToScreen(n.x, n.y, camX.value, camY.value, camScale.value, width, height);
  });
  const p2 = useDerivedValue(() => {
    const n = simNodes.value.find((x) => x.id === link.b);
    if (!n) return { x: -1000, y: -1000 };
    return worldToScreen(n.x, n.y, camX.value, camY.value, camScale.value, width, height);
  });
  return <Line p1={p1} p2={p2} color={LINK_COLOR} strokeWidth={1.4} />;
}

export interface PulseSlot {
  active: boolean;
  a: string;
  b: string;
  t0: number;
}

export function makePulsePool(size: number): PulseSlot[] {
  return Array.from({ length: size }, () => ({ active: false, a: "", b: "", t0: 0 }));
}

function GraphPulse({
  index, slots, simNodes, camX, camY, camScale, width, height, now,
}: {
  index: number;
  slots: SharedValue<PulseSlot[]>;
  simNodes: SharedValue<SimNode[]>;
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
  now: SharedValue<number>;
}) {
  const DUR = 750;
  const cx = useDerivedValue(() => {
    const slot = slots.value[index];
    if (!slot.active) return -1000;
    const a = simNodes.value.find((x) => x.id === slot.a);
    const b = simNodes.value.find((x) => x.id === slot.b);
    if (!a || !b) return -1000;
    const t = Math.min(1, (now.value - slot.t0) / DUR);
    const wx = a.x + (b.x - a.x) * t;
    const wy = a.y + (b.y - a.y) * t;
    return worldToScreen(wx, wy, camX.value, camY.value, camScale.value, width, height).x;
  });
  const cy = useDerivedValue(() => {
    const slot = slots.value[index];
    if (!slot.active) return -1000;
    const a = simNodes.value.find((x) => x.id === slot.a);
    const b = simNodes.value.find((x) => x.id === slot.b);
    if (!a || !b) return -1000;
    const t = Math.min(1, (now.value - slot.t0) / DUR);
    const wy = a.y + (b.y - a.y) * t;
    return worldToScreen(a.x, wy, camX.value, camY.value, camScale.value, width, height).y;
  });
  const opacity = useDerivedValue(() => {
    const slot = slots.value[index];
    if (!slot.active) return 0;
    const t = Math.min(1, (now.value - slot.t0) / DUR);
    return t >= 1 ? 0 : 1 - t * 0.3;
  });

  return <Circle cx={cx} cy={cy} r={4} color="white" opacity={opacity} />;
}

export function GraphEdges({
  links, pulseSlots, poolSize, simNodes, camX, camY, camScale, width, height, now,
}: {
  links: SimLink[];
  pulseSlots: SharedValue<PulseSlot[]>;
  poolSize: number;
  simNodes: SharedValue<SimNode[]>;
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
  now: SharedValue<number>;
}) {
  return (
    <Group>
      {links.map((link, i) => (
        <GraphLink key={`${link.a}-${link.b}-${i}`} link={link} simNodes={simNodes} camX={camX} camY={camY} camScale={camScale} width={width} height={height} />
      ))}
      {Array.from({ length: poolSize }, (_, i) => (
        <GraphPulse key={i} index={i} slots={pulseSlots} simNodes={simNodes} camX={camX} camY={camY} camScale={camScale} width={width} height={height} now={now} />
      ))}
    </Group>
  );
}
