import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { StyleSheet, Text } from "react-native";
import { worldToScreen, type SimNode } from "./simulation";
import { colors } from "../../../theme/theme";

export function GraphLabel({
  id, title, simNodes, camX, camY, camScale, width, height,
}: {
  id: string;
  title: string;
  simNodes: SharedValue<SimNode[]>;
  camX: SharedValue<number>;
  camY: SharedValue<number>;
  camScale: SharedValue<number>;
  width: number;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const n = simNodes.value.find((x) => x.id === id);
    if (!n) return { opacity: 0, transform: [{ translateX: -1000 }, { translateY: -1000 }] };
    const p = worldToScreen(n.x, n.y, camX.value, camY.value, camScale.value, width, height);
    return {
      opacity: camScale.value > 0.55 ? 1 : 0,
      transform: [{ translateX: p.x - 60 }, { translateY: p.y + 14 }],
    };
  });

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents="none">
      <Text style={styles.text} numberOfLines={1}>{title}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", width: 120, alignItems: "center" },
  text: { color: colors.text, fontSize: 10.5, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 3, textAlign: "center" },
});
