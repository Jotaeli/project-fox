import { useState } from "react";
import type { ItemWishlist, TierWishlist } from "@project-fox/types";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAnimatedRef } from "react-native-reanimated";
import { PlusIcon } from "../../../icons/index";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, radius, spacing, typography } from "../../../theme/theme";
import { WishCard } from "./WishCard";
import { WishDetail } from "./WishDetail";
import { WishModal } from "./WishModal";
import { TIER_ORDER, TIERS } from "./wishConstants";
import { useWishlist } from "./useWishlist";

export function WishlistScreen() {
  const { items, updateTier } = useWishlist();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ItemWishlist | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const refS = useAnimatedRef<View>();
  const refA = useAnimatedRef<View>();
  const refB = useAnimatedRef<View>();
  const refC = useAnimatedRef<View>();
  const tierRefs = { S: refS, A: refA, B: refB, C: refC };

  function handleMoveTier(item: ItemWishlist, tier: TierWishlist) {
    updateTier.mutate({ id: item.id, tier });
  }

  const total = items.filter((w) => !w.comprado).reduce((s, w) => s + w.valor, 0);

  return (
    <View style={styles.screen}>
      <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <View>
            <Text style={typography.title}>Wishlist Consumista</Text>
            <Text style={typography.muted}>
              Arraste os desejos entre os tiers · total: {fmtBRL(total)}
            </Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setModalOpen(true)}>
            <PlusIcon size={14} color={colors.text} />
            <Text style={typography.body}>Adicionar</Text>
          </Pressable>
        </View>

        {items.length === 0 && (
          <Text style={[typography.muted, styles.empty]}>
            Sua wishlist está vazia. Adicione o primeiro desejo e organize por tier.
          </Text>
        )}

        {TIER_ORDER.map((key) => {
          const t = TIERS[key];
          const rowItems = items.filter((w) => w.tier === key);
          return (
            <View key={key} ref={tierRefs[key]} style={[styles.tier, { borderColor: `${t.c}55` }]} collapsable={false}>
              <View style={styles.tierLabel}>
                <Text style={[styles.tierLetter, { color: t.c }]}>{key}</Text>
                <Text style={typography.muted}>{t.name}</Text>
              </View>
              <View style={styles.tierBody}>
                {rowItems.length === 0 && <Text style={[typography.muted, styles.tierEmpty]}>Arraste desejos para cá</Text>}
                <View style={styles.cardsWrap}>
                  {rowItems.map((w) => (
                    <WishCard
                      key={w.id}
                      item={w}
                      tierRefs={tierRefs}
                      onOpen={() => setDetailItem(w)}
                      onMoveTier={(tier) => handleMoveTier(w, tier)}
                      onDragStateChange={(dragging) => setScrollEnabled(!dragging)}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <WishModal visible={modalOpen} onClose={() => setModalOpen(false)} />
      <WishDetail item={detailItem} onClose={() => setDetailItem(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  content: { padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3667c4",
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  empty: { textAlign: "center", paddingVertical: spacing.xl },
  tier: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.panel,
  },
  tierLabel: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs, marginBottom: spacing.sm },
  tierLetter: { fontSize: 18, fontWeight: "800" },
  tierBody: { minHeight: 60 },
  tierEmpty: { fontStyle: "italic" },
  cardsWrap: { flexDirection: "row", flexWrap: "wrap" },
});
