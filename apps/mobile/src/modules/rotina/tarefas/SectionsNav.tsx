import { useEffect, useState } from "react";
import type { SecaoTarefas } from "@project-fox/types";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAnimatedRef, type AnimatedRef } from "react-native-reanimated";
import { PlusIcon, TrashIcon } from "../../../icons/index";
import { colors, radius, spacing, typography } from "../../../theme/theme";
import { NovaSecaoModal } from "./NovaSecaoModal";
import { useTarefas } from "./useTarefas";

function hueOf(cor: string): string {
  const m = /hsl\((\d+)/.exec(cor);
  return m ? m[1] : "212";
}

function SectionChip({
  sec, active, count, onSelect, onDelete, registerRef,
}: {
  sec: SecaoTarefas; active: boolean; count: number; onSelect: () => void; onDelete: () => void;
  registerRef: (id: string, ref: AnimatedRef<View>) => void;
}) {
  const ref = useAnimatedRef<View>();
  useEffect(() => { registerRef(sec.id, ref); }, [sec.id]);
  const hue = hueOf(sec.cor);

  return (
    <View ref={ref} collapsable={false}>
      <Pressable
        onPress={onSelect}
        style={[styles.chip, active && { borderColor: `hsl(${hue},70%,60%)`, backgroundColor: `hsl(${hue},40%,18%)` }]}
      >
        <View style={[styles.dot, { backgroundColor: `hsl(${hue},65%,60%)` }]} />
        <Text style={typography.body}>{sec.nome}</Text>
        <View style={styles.count}><Text style={styles.countText}>{count}</Text></View>
        {!sec.fixa && (
          <Pressable hitSlop={8} onPress={onDelete}>
            <TrashIcon size={12} color={colors.muted} />
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

export function SectionsNav({
  secoes, taskCounts, activeSectionId, onSelect, registerRef,
}: {
  secoes: SecaoTarefas[];
  taskCounts: Map<string, number>;
  activeSectionId: string;
  onSelect: (id: string) => void;
  registerRef: (id: string, ref: AnimatedRef<View>) => void;
}) {
  const { deleteSecao } = useTarefas();
  const [modalOpen, setModalOpen] = useState(false);

  function handleDelete(sec: SecaoTarefas) {
    Alert.alert("Excluir seção?", `Tarefas de "${sec.nome}" serão movidas para Geral.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => deleteSecao.mutate(sec.id, {
          onSuccess: () => { if (activeSectionId === sec.id) onSelect(""); },
        }),
      },
    ]);
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {secoes.map((sec) => (
        <SectionChip
          key={sec.id}
          sec={sec}
          active={sec.id === activeSectionId}
          count={taskCounts.get(sec.id) ?? 0}
          onSelect={() => onSelect(sec.id)}
          onDelete={() => handleDelete(sec)}
          registerRef={registerRef}
        />
      ))}
      <Pressable style={styles.addChip} onPress={() => setModalOpen(true)}>
        <PlusIcon size={14} color={colors.text} />
        <Text style={typography.body}>Nova seção</Text>
      </Pressable>
      <NovaSecaoModal visible={modalOpen} onClose={() => setModalOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm, paddingBottom: spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  count: { backgroundColor: "rgba(148,180,255,0.15)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  countText: { color: colors.muted, fontSize: 11 },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
