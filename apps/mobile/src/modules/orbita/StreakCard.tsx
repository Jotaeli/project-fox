import { useMemo } from "react";
import type { StreakResumo } from "@project-fox/types";
import { StyleSheet, Text, View } from "react-native";
import { CheckIcon, FlameIcon, ShieldIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";

export function StreakCard({ streak, activeDays, loading }: { streak?: StreakResumo; activeDays: string[]; loading: boolean }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - (6 - i));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "").slice(0, 3);
    return { key, label: i === 6 ? "Hoje" : weekday, active: activeDays.includes(key), today: i === 6 };
  }), [activeDays]);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.flameWrap, streak?.ativoHoje && styles.flameLit]}>
          <FlameIcon size={18} color={streak?.ativoHoje ? colors.gold : colors.muted} />
        </View>
        <View>
          <Text style={typography.muted}>SEQUÊNCIA ATUAL</Text>
          <Text style={typography.title}>{loading ? "—" : streak?.atual ?? 0} <Text style={typography.muted}>dias</Text></Text>
        </View>
      </View>

      <View style={styles.week}>
        {days.map((day) => (
          <View key={day.key} style={styles.dayCol}>
            <View style={[styles.dot, day.active && styles.dotActive, day.today && styles.dotToday]}>
              {day.active && <CheckIcon size={10} color={colors.bg0} />}
            </View>
            <Text style={typography.muted}>{day.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.freezeRow}>
        <ShieldIcon size={13} color={colors.muted} />
        <Text style={typography.muted}>
          {streak?.congelamentoDisponivel ? "1 congelamento disponível nesta semana" : "Congelamento da semana já utilizado"}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={typography.muted}>Recorde <Text style={{ color: colors.text, fontWeight: "700" }}>{streak?.recorde ?? 0}</Text></Text>
        <Text style={typography.muted}>Últimos 7 dias <Text style={{ color: colors.text, fontWeight: "700" }}>{streak?.ativos7d ?? 0}/7</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flameWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  flameLit: { borderColor: colors.gold, backgroundColor: "rgba(255,214,110,0.12)" },
  week: { flexDirection: "row", justifyContent: "space-between" },
  dayCol: { alignItems: "center", gap: 4 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  dotActive: { backgroundColor: colors.green, borderColor: colors.green },
  dotToday: { borderColor: colors.accent },
  freezeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
});
