import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { FinancasScreen } from "./financas/FinancasScreen";
import { TarefasScreen } from "./tarefas/TarefasScreen";
import { WishlistScreen } from "./wishlist/WishlistScreen";

type Tab = "financas" | "wishlist" | "tarefas";

const TABS: { key: Tab; label: string }[] = [
  { key: "financas", label: "Finanças" },
  { key: "wishlist", label: "Wishlist" },
  { key: "tarefas", label: "Tarefas" },
];

export function RotinaScreen() {
  const [tab, setTab] = useState<Tab>("financas");

  return (
    <View style={styles.screen}>
      <View style={styles.segmented}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.segment, tab === t.key && styles.segmentSel]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[typography.body, tab === t.key && { color: colors.text, fontWeight: "600" }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "financas" && <FinancasScreen />}
      {tab === "wishlist" && <WishlistScreen />}
      {tab === "tarefas" && <TarefasScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  segmented: {
    flexDirection: "row",
    margin: spacing.lg,
    marginBottom: 0,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm },
  segmentSel: { backgroundColor: "rgba(110,168,255,0.18)" },
});
