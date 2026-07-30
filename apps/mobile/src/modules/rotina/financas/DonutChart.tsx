import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, spacing, typography } from "../../../theme/theme";

const SIZE = 140;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function DonutChart({ rows }: { rows: { nome: string; cor: string; total: number }[] }) {
  const active = rows.filter((r) => r.total > 0);
  const grandTotal = active.reduce((s, r) => s + r.total, 0);

  if (!grandTotal) {
    return (
      <View style={styles.panel}>
        <Text style={typography.muted}>Gastos por modalidade</Text>
        <View style={styles.row}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="rgba(148,180,255,0.12)"
              strokeWidth={STROKE}
              fill="none"
            />
          </Svg>
          <Text style={[typography.muted, styles.empty]}>Nenhum gasto planejado ainda.</Text>
        </View>
      </View>
    );
  }

  let acc = 0;
  const arcs = active.map((r) => {
    const frac = r.total / grandTotal;
    const dashOffset = CIRC * (1 - acc);
    acc += frac;
    return { ...r, dashArray: `${CIRC * frac} ${CIRC}`, dashOffset };
  });

  const legendRows = [...active].sort((a, b) => b.total - a.total);

  return (
    <View style={styles.panel}>
      <Text style={typography.muted}>Gastos por modalidade</Text>
      <View style={styles.row}>
        <View style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE}>
            <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
              {arcs.map((a) => (
                <Circle
                  key={a.nome}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={a.cor}
                  strokeWidth={STROKE}
                  strokeDasharray={a.dashArray}
                  strokeDashoffset={a.dashOffset}
                  fill="none"
                  strokeLinecap="butt"
                />
              ))}
            </G>
          </Svg>
          <View style={styles.hole}>
            <Text style={styles.holeText}>{fmtBRL(grandTotal)}</Text>
          </View>
        </View>
        <View style={styles.legend}>
          {legendRows.map((r) => (
            <View key={r.nome} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: r.cor }]} />
              <Text style={[typography.body, styles.legendName]} numberOfLines={1}>{r.nome}</Text>
              <Text style={typography.muted}>{Math.round((r.total / grandTotal) * 100)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  empty: { flex: 1 },
  hole: {
    position: "absolute",
    top: STROKE,
    left: STROKE,
    right: STROKE,
    bottom: STROKE,
    alignItems: "center",
    justifyContent: "center",
  },
  holeText: { color: colors.text, fontSize: 12, fontWeight: "600", textAlign: "center" },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1 },
});
