import { Group, Rect } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import type { ConfettiParticle } from "./simulation";

export function ConfettiPiece({ index, pool }: { index: number; pool: SharedValue<ConfettiParticle[]> }) {
  const x = useDerivedValue(() => {
    const p = pool.value[index];
    return p.active ? p.x - 4 : -1000;
  });
  const y = useDerivedValue(() => {
    const p = pool.value[index];
    return p.active ? p.y - 4 : -1000;
  });
  const opacity = useDerivedValue(() => {
    const p = pool.value[index];
    return p.active ? Math.max(0, 1 - p.age / p.life) : 0;
  });
  const color = useDerivedValue(() => `hsl(${pool.value[index].hue}, 75%, 65%)`);
  const transform = useDerivedValue(() => [{ rotate: pool.value[index].rotation }]);

  return (
    <Rect x={x} y={y} width={8} height={8} color={color} opacity={opacity} transform={transform} origin={{ x: 4, y: 4 }} />
  );
}

export function Confetti({ pool, size }: { pool: SharedValue<ConfettiParticle[]>; size: number }) {
  return (
    <Group>
      {Array.from({ length: size }, (_, i) => (
        <ConfettiPiece key={i} index={i} pool={pool} />
      ))}
    </Group>
  );
}
