import { Circle, Group } from "@shopify/react-native-skia";
import type { BadgeNota } from "@project-fox/types";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { noteColors, rgbaStr } from "./badges";
import { degreeOf, nodeRadius, worldToScreen, type SimLink, type SimNode } from "./simulation";

export function GraphNode({
  id, badges, simNodes, simLinks, camX, camY, camScale, width, height, selected, dimmed,
}: {
  id: string;
  badges: BadgeNota[];
  simNodes: SharedValue<SimNode[]>;
  simLinks: SharedValue<SimLink[]>;
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
  selected: boolean;
  dimmed: boolean;
}) {
  const cx = useDerivedValue(() => {
    const n = simNodes.value.find((x) => x.id === id);
    if (!n) return -1000;
    return worldToScreen(n.x, n.y, camX.value, camY.value, camScale.value, width, height).x;
  });
  const cy = useDerivedValue(() => {
    const n = simNodes.value.find((x) => x.id === id);
    if (!n) return -1000;
    return worldToScreen(n.x, n.y, camX.value, camY.value, camScale.value, width, height).y;
  });
  const radius = useDerivedValue(() => nodeRadius(degreeOf(id, simLinks.value)) * camScale.value);
  const haloRadius = useDerivedValue(() => radius.value * 2.6);

  const colors = noteColors(badges);
  const alpha = dimmed ? 0.25 : 1;

  return (
    <Group>
      {colors.map((rgb, i) => (
        <Circle key={i} cx={cx} cy={cy} r={haloRadius} color={rgbaStr(rgb, 0.16 * alpha)} blendMode="plus" />
      ))}
      <Circle cx={cx} cy={cy} r={radius} color={rgbaStr(colors[0], alpha)} />
      {selected && <Circle cx={cx} cy={cy} r={radius} style="stroke" strokeWidth={2} color={rgbaStr([255, 255, 255], alpha)} />}
    </Group>
  );
}
