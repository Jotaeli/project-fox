import { Circle, Group } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { planetPosition, worldToScreen, type SimPlanet } from "./simulation";

const SPARK_COUNT = 5;

export function PlanetNode({
  id, hue, radius, health, excitement, simPlanets, camX, camY, camScale, width, height, nowShared,
}: {
  id: string;
  hue: number;
  radius: number;
  health: number;
  excitement: number;
  simPlanets: SharedValue<SimPlanet[]>;
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
  nowShared: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const p = simPlanets.value.find((x) => x.id === id);
    if (!p) return -1000;
    const pos = planetPosition(p.angle, p.dist);
    return worldToScreen(pos.x, pos.y, camX.value, camY.value, camScale.value, width, height).x;
  });
  const cy = useDerivedValue(() => {
    const p = simPlanets.value.find((x) => x.id === id);
    if (!p) return -1000;
    const pos = planetPosition(p.angle, p.dist);
    return worldToScreen(pos.x, pos.y, camX.value, camY.value, camScale.value, width, height).y;
  });
  const r = useDerivedValue(() => radius * camScale.value);
  const haloR = useDerivedValue(() => r.value * (2.2 + Math.max(0, health) * 0.6));
  const haloOpacity = useDerivedValue(() => {
    const pulse = excitement * (0.07 + 0.07 * Math.sin(nowShared.value / 1000 * 2.6));
    return 0.14 * (0.3 + health * 0.7) + pulse;
  });

  const color = `hsl(${hue}, 65%, ${40 + health * 20}%)`;
  const haloColor = `hsl(${hue}, 70%, 60%)`;

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={haloR} color={haloColor} opacity={haloOpacity} blendMode="plus" />
      <Circle cx={cx} cy={cy} r={r} color={color} />
      {excitement > 0.05 && Array.from({ length: SPARK_COUNT }, (_, i) => (
        <Spark key={i} index={i} cx={cx} cy={cy} r={r} excitement={excitement} nowShared={nowShared} />
      ))}
    </Group>
  );
}

function Spark({
  index, cx, cy, r, excitement, nowShared,
}: {
  index: number;
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  r: SharedValue<number>;
  excitement: number;
  nowShared: SharedValue<number>;
}) {
  const sx = useDerivedValue(() => {
    const t = nowShared.value / 1000;
    const angle = t * 1.1 + (index * Math.PI * 2) / SPARK_COUNT;
    const dist = r.value * (1.7 + 0.25 * Math.sin(t * 3 + index * 2.1));
    return cx.value + Math.cos(angle) * dist;
  });
  const sy = useDerivedValue(() => {
    const t = nowShared.value / 1000;
    const angle = t * 1.1 + (index * Math.PI * 2) / SPARK_COUNT;
    const dist = r.value * (1.7 + 0.25 * Math.sin(t * 3 + index * 2.1)) * 0.82;
    return cy.value + Math.sin(angle) * dist;
  });
  const opacity = useDerivedValue(() => {
    const t = nowShared.value / 1000;
    return excitement * (0.5 + 0.5 * Math.sin(t * 3 + index * 2.1));
  });

  return <Circle cx={sx} cy={sy} r={2} color="white" opacity={opacity} />;
}
