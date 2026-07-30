import type { Tarefa } from "@project-fox/types";
import { StyleSheet, View } from "react-native";
import { colors } from "../../../theme/theme";

export function StageDots({ tarefa }: { tarefa: Tarefa }) {
  const stages = tarefa.etapas.slice().sort((a, b) => a.ordem - b.ordem);
  const doneCount = stages.filter((s) => s.concluida).length;

  return (
    <View style={styles.row}>
      {stages.map((s, i) => (
        <View key={s.id} style={styles.pair}>
          <View
            style={[
              styles.dot,
              s.concluida ? styles.dotDone : i === doneCount ? styles.dotCurrent : styles.dotEmpty,
            ]}
          />
          {i < stages.length - 1 && <View style={[styles.line, i < doneCount && styles.lineDone]} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  pair: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: colors.green },
  dotCurrent: { backgroundColor: colors.accent },
  dotEmpty: { backgroundColor: "rgba(148,180,255,0.25)" },
  line: { width: 10, height: 2, backgroundColor: "rgba(148,180,255,0.25)" },
  lineDone: { backgroundColor: colors.green },
});
