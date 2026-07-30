import type { ItemWishlist, TierWishlist } from "@project-fox/types";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  measure,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedRef,
} from "react-native-reanimated";
import { CoinIcon, ImageIcon, PlanetIcon } from "../../../icons/index";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, radius, spacing } from "../../../theme/theme";
import { hueFromId, photoColors, TIER_ORDER, TIERS } from "./wishConstants";

const TAP_THRESHOLD = 8;

export function WishCard({
  item,
  planetaNome,
  tierRefs,
  onOpen,
  onMoveTier,
  onDragStateChange,
}: {
  item: ItemWishlist;
  planetaNome?: string;
  tierRefs: Record<TierWishlist, AnimatedRef<View>>;
  onOpen: () => void;
  onMoveTier: (tier: TierWishlist) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const t = TIERS[item.tier];
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.06);
      zIndex.value = 10;
      runOnJS(onDragStateChange)(true);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const moved = Math.abs(e.translationX) > TAP_THRESHOLD || Math.abs(e.translationY) > TAP_THRESHOLD;
      if (!moved) {
        runOnJS(onOpen)();
      } else {
        for (const key of TIER_ORDER) {
          const m = measure(tierRefs[key]);
          if (m && e.absoluteY >= m.pageY && e.absoluteY <= m.pageY + m.height) {
            if (key !== item.tier) runOnJS(onMoveTier)(key);
            break;
          }
        }
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      runOnJS(onDragStateChange)(false);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  const [c1, c2] = photoColors(hueFromId(item.id));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, { borderColor: `${t.c}55` }, item.comprado && styles.bought, style]}>
        {item.foto ? (
          <View style={[styles.photo, { backgroundColor: colors.panelSolid }]}>
            <Text style={styles.photoPlaceholder}>{item.nome[0]}</Text>
          </View>
        ) : (
          <LinearGradient colors={[c1, c2]} style={styles.photo}>
            <ImageIcon size={18} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.nome}</Text>
          <View style={styles.priceRow}>
            <CoinIcon size={12} color={colors.gold} />
            <Text style={styles.price}>{fmtBRL(item.valor)}</Text>
          </View>
          {planetaNome && (
            <View style={styles.chip}>
              <PlanetIcon size={10} color="#c9b6ff" />
              <Text style={styles.chipText} numberOfLines={1}>{planetaNome}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 128,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
    overflow: "hidden",
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  bought: { opacity: 0.55 },
  photo: { height: 72, alignItems: "center", justifyContent: "center" },
  photoPlaceholder: { color: colors.text, fontSize: 22, fontWeight: "700" },
  info: { padding: spacing.sm, gap: 4 },
  name: { color: colors.text, fontSize: 12.5, fontWeight: "600" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  price: { color: colors.text, fontSize: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(160,130,255,.35)",
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  chipText: { color: "#c9b6ff", fontSize: 9.5 },
});
