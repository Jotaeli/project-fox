import { useState } from "react";
import type { ItemWishlist, TierWishlist } from "@project-fox/types";
import { LinearGradient } from "expo-linear-gradient";
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ExtIcon, ImageIcon, TrashIcon } from "../../../icons/index";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, radius, shadow, spacing, typography } from "../../../theme/theme";
import { hueFromId, photoColors, TIER_ORDER, TIERS } from "./wishConstants";
import { useWishlist } from "./useWishlist";

export function WishDetail({ item, onClose }: { item: ItemWishlist | null; onClose: () => void }) {
  const { updateTier, deleteItem } = useWishlist();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!item) return null;
  const [c1, c2] = photoColors(hueFromId(item.id));

  function confirmDelete() {
    Alert.alert("Excluir desejo?", `"${item!.nome}" será removido da wishlist. Essa ação não pode ser desfeita.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteItem.mutate(item!.id, { onSuccess: onClose }) },
    ]);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {item.foto ? (
            <View style={[styles.hero, { backgroundColor: colors.panelSolid }]} />
          ) : (
            <LinearGradient colors={[c1, c2]} style={styles.hero}>
              <ImageIcon size={26} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          )}

          <Text style={typography.title}>
            {item.nome} {item.comprado && <Text style={{ color: colors.green, fontSize: 12 }}>✓ comprado</Text>}
          </Text>
          <Text style={[typography.body, { fontWeight: "700" }]}>{fmtBRL(item.valor)}</Text>
          {item.descricao && <Text style={typography.body}>{item.descricao}</Text>}
          {item.link && (
            <Pressable style={styles.linkRow} onPress={() => Linking.openURL(item.link!)}>
              <ExtIcon size={14} color={colors.accent} />
              <Text style={{ color: colors.accent }}>Link de compra</Text>
            </Pressable>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Tier</Text>
            <View style={styles.tierSelect}>
              {TIER_ORDER.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => key !== item.tier && updateTier.mutate({ id: item.id, tier: key as TierWishlist })}
                  style={[
                    styles.tierOpt,
                    { borderColor: TIERS[key].c },
                    item.tier === key && { backgroundColor: TIERS[key].bg1 },
                  ]}
                >
                  <Text style={{ color: item.tier === key ? TIERS[key].c : colors.muted, fontWeight: "700" }}>{key}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.btnDanger} onPress={confirmDelete}>
              <TrashIcon size={14} color={colors.danger} />
              <Text style={{ color: colors.danger }}>Excluir</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={typography.body}>Fechar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: { ...shadow.modal,
    width: 380,
    maxWidth: "100%",
    backgroundColor: colors.panelSolid,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  hero: { height: 140, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  field: { gap: spacing.xs, marginTop: spacing.sm },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  tierSelect: { flexDirection: "row", gap: spacing.sm },
  tierOpt: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,120,120,.25)",
  },
});
