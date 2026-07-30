import { Circle, Group } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { moonOrbit, planetPosition, worldToScreen, type SimPlanet } from "./simulation";

export function MoonNode({
  planetId, index, color, simPlanets, camX, camY, camScale, width, height, nowShared,
}: {
  planetId: string;
  index: number;
  color: string;
  simPlanets: SharedValue<SimPlanet[]>;
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
  nowShared: SharedValue<number>;
}) {
  const { orbit, speed } = moonOrbit(index);
  const phase = index * 2.1;

  const cx = useDerivedValue(() => {
    const p = simPlanets.value.find((x) => x.id === planetId);
    if (!p) return -1000;
    const pos = planetPosition(p.angle, p.dist);
    const t = nowShared.value / 1000;
    const mx = pos.x + Math.cos(t * speed + phase) * orbit;
    const my = pos.y + Math.sin(t * speed + phase) * orbit;
    return worldToScreen(mx, my, camX.value, camY.value, camScale.value, width, height).x;
  });
  const cy = useDerivedValue(() => {
    const p = simPlanets.value.find((x) => x.id === planetId);
    if (!p) return -1000;
    const pos = planetPosition(p.angle, p.dist);
    const t = nowShared.value / 1000;
    const mx = pos.x + Math.cos(t * speed + phase) * orbit;
    const my = pos.y + Math.sin(t * speed + phase) * orbit;
    return worldToScreen(mx, my, camX.value, camY.value, camScale.value, width, height).y;
  });
  const r = useDerivedValue(() => 8 * camScale.value);

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r} color={color} />
    </Group>
  );
}
