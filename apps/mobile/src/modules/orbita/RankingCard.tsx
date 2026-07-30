import type { RankingStreakItem } from "@project-fox/types";
import { StyleSheet, Text, View } from "react-native";
import { FlameIcon, TargetIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar } from "./Avatar";

export function RankingCard({ items, loading }: { items: RankingStreakItem[]; loading: boolean }) {
  const top = items.slice(0, 8);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <TargetIcon size={14} color={colors.text} />
        <Text style={typography.subtitle}>Ranking da órbita</Text>
        <Text style={typography.muted}>{items.length}</Text>
      </View>
      {loading ? (
        <Text style={typography.muted}>Calculando órbitas…</Text>
      ) : top.length ? (
        top.map((person, index) => (
          <View key={person.userId} style={[styles.row, person.eu && styles.rowMe]}>
            <Text style={styles.pos}>{index + 1}</Text>
            <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>{person.eu ? "Você" : person.nome}</Text>
              <Text style={typography.muted}>{person.ativos7d}/7 dias ativos</Text>
            </View>
            <View style={styles.scoreRow}>
              <FlameIcon size={12} color={colors.gold} />
              <Text style={typography.body}>{person.atual}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={[typography.muted, styles.empty]}>Ative seu streak e convide amigos para formar o ranking.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  rowMe: { backgroundColor: "rgba(110,168,255,0.08)", borderRadius: radius.sm, paddingHorizontal: 6 },
  pos: { width: 18, color: colors.muted, fontSize: 12, fontWeight: "700" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  empty: { textAlign: "center", paddingVertical: spacing.md, fontStyle: "italic" },
});
