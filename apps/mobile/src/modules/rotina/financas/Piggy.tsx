import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, spacing } from "../../../theme/theme";
import { BELLY, BELLY_PATH, PIG_PATHS } from "./pigArt";

const COIN_R = 26;
const FOX_D = "M4 4l5 4 3-2 3 2 5-4-2 9c-.6 3-3 5-6 5s-5.4-2-6-5L4 4z";

function buildCoinPositions() {
  const { cx, cy, rx, ry } = BELLY;
  const positions: { x: number; y: number }[] = [];
  for (let y = cy + ry - 24; y >= cy - ry + 24; y -= 52) {
    const off = Math.round((cy + ry - 24 - y) / 52) % 2 ? 30 : 0;
    for (let x = cx - rx + 18; x <= cx + rx - 18; x += 60) {
      const dx = (x + off - cx) / (rx - COIN_R);
      const dy = (y - cy) / (ry - COIN_R);
      if (dx * dx + dy * dy <= 1) positions.push({ x: x + off, y });
    }
  }
  positions.sort((a, b) => b.y - a.y || a.x - b.x);
  return positions;
}

const COIN_POSITIONS = buildCoinPositions();


export function Piggy({ avail, total, spent }: { avail: number; total: number; spent: number }) {
  const frac = total > 0 ? avail / total : 0;
  const shownCount = Math.round(frac * COIN_POSITIONS.length);
  const animAvail = useSharedValue(avail);

  useEffect(() => {
    animAvail.value = withTiming(avail, { duration: 600 });
  }, [avail]);

  const animatedProps = useAnimatedProps(() => ({
    text: fmtBRL(Math.round(animAvail.value)),
  })) as any;

  const pct = total ? Math.round((avail / total) * 100) : 0;

  return (
    <View style={styles.panel}>
      <View style={styles.tip}>
        <Text>
          <Text style={styles.tipGold}>{fmtBRL(avail)}</Text>
          <Text style={styles.tipMuted}> ainda no cofrinho</Text>
        </Text>
        <Text style={styles.tipMuted}>
          renda {fmtBRL(total)} · gasto {fmtBRL(spent)}
        </Text>
      </View>
      <Svg viewBox="60 180 1130 900" width={280} height={223}>
        <Defs>
          <RadialGradient id="windowG" cx="50%" cy="35%" r="75%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.16} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
          </RadialGradient>
          <ClipPath id="belly">
            <Path d={BELLY_PATH} />
          </ClipPath>
        </Defs>
        {PIG_PATHS.map((p, i) => (
          <Path key={i} fill={p.fill} d={p.d} />
        ))}
        <Path d={BELLY_PATH} fill="url(#windowG)" stroke="rgba(255,255,255,0.3)" strokeWidth={7} />
        <G clipPath="url(#belly)">
          {COIN_POSITIONS.slice(0, shownCount).map((p, i) => (
            <G key={i} transform={`translate(${p.x} ${p.y})`}>
              <Circle r={COIN_R} fill="#ffd66e" stroke="#b8893a" strokeWidth={3.5} />
              <G transform="scale(1.8) translate(-12,-11)">
                <Path
                  d={FOX_D}
                  fill="none"
                  stroke="#9c6d28"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
            </G>
          ))}
        </G>
        <Path d={BELLY_PATH} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={7} />
        <Ellipse
          cx={BELLY.cx}
          cy={BELLY.cy - BELLY.ry * 0.55}
          rx={BELLY.rx * 0.5}
          ry={BELLY.ry * 0.2}
          fill="rgba(255,255,255,0.1)"
        />
      </Svg>
      <Animated.Text style={styles.availText} animatedProps={animatedProps}>
        {fmtBRL(avail)}
      </Animated.Text>
      <Text style={styles.availSub}>
        disponíveis de {fmtBRL(total)} · {pct}% do cofrinho
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: "center", marginBottom: spacing.md },
  tip: { alignItems: "center", marginBottom: spacing.xs },
  tipGold: { color: colors.gold, fontWeight: "700" },
  tipMuted: { color: colors.muted, fontSize: 12 },
  availText: { color: colors.gold, fontSize: 24, fontWeight: "700", marginTop: spacing.xs },
  availSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
