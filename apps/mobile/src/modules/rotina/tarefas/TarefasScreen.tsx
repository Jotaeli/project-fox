import { useMemo, useRef, useState } from "react";
import type { SecaoTarefas, Tarefa } from "@project-fox/types";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { GradientButton } from "../../../components/GradientButton";
import { CheckIcon, ChevIcon, CoinIcon, PlusIcon } from "../../../icons/index";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, radius, spacing, typography } from "../../../theme/theme";
import { useWishlist } from "../wishlist/useWishlist";
import { SectionsNav } from "./SectionsNav";
import { StackPanel } from "./StackPanel";
import { TaskDetail } from "./TaskDetail";
import { TaskModal } from "./TaskModal";
import { isTarefaConcluida, useTarefas } from "./useTarefas";

function tasksForSection(sec: SecaoTarefas, tasks: Tarefa[]): Tarefa[] {
  const items = tasks.filter((t) => t.secaoId === sec.id && !isTarefaConcluida(t));
  if (sec.ordenacao === "data") {
    const withDl = items.filter((t) => t.prazo).sort((a, b) => (a.prazo! < b.prazo! ? -1 : 1));
    const withoutDl = items.filter((t) => !t.prazo);
    return [...withDl, ...withoutDl];
  }
  return items.slice().sort((a, b) => a.ordem - b.ordem);
}

export function TarefasScreen() {
  const { secoes, tarefas, isLoading } = useTarefas();
  const { items } = useWishlist();
  const [activeSectionId, setActiveSectionId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const sectionRefs = useRef<Record<string, AnimatedRef<View>>>({}).current;

  const geral = secoes.find((s) => s.fixa);
  const effectiveActiveId = secoes.find((s) => s.id === activeSectionId)?.id ?? geral?.id ?? "";
  const activeSec = secoes.find((s) => s.id === effectiveActiveId);

  const taskCounts = useMemo(() => {
    const m = new Map<string, number>();
    tarefas.filter((t) => !isTarefaConcluida(t)).forEach((t) => m.set(t.secaoId, (m.get(t.secaoId) ?? 0) + 1));
    return m;
  }, [tarefas]);

  const doneTasks = useMemo(
    () => tarefas.filter(isTarefaConcluida).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [tarefas]
  );
  const wishById = (id?: string) => (id ? items.find((w) => w.id === id) : undefined);
  const detailTarefa = detailId ? tarefas.find((t) => t.id === detailId) ?? null : null;

  if (isLoading || !activeSec) {
    return (
      <View style={styles.screen}>
        <Text style={typography.title}>Tarefas</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={typography.title}>Tarefas</Text>
          <Text style={typography.muted}>A pilha define a prioridade</Text>
        </View>
        <GradientButton style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <PlusIcon size={14} color={colors.text} />
          <Text style={typography.body}>Nova tarefa</Text>
        </GradientButton>
      </View>

      <SectionsNav
        secoes={secoes}
        taskCounts={taskCounts}
        activeSectionId={effectiveActiveId}
        onSelect={(id) => setActiveSectionId(id || geral?.id || "")}
        registerRef={(id, ref) => { sectionRefs[id] = ref; }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <StackPanel
          sec={activeSec}
          tasks={tasksForSection(activeSec, tarefas)}
          wishById={wishById}
          sectionRefs={sectionRefs}
          onOpenTask={setDetailId}
          onAddTask={() => setModalOpen(true)}
        />

        <Pressable style={styles.doneFold} onPress={() => setDoneOpen((v) => !v)}>
          <ChevIcon size={14} color={colors.muted} />
          <Text style={typography.muted}>Concluídas ({doneTasks.length})</Text>
        </Pressable>
        {doneOpen && (
          <View style={styles.doneList}>
            {doneTasks.map((t) => (
              <View key={t.id} style={styles.doneItem}>
                <CheckIcon size={12} color={colors.green} />
                <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{t.titulo}</Text>
                {t.financeira && (
                  <View style={styles.chipMoney}>
                    <CoinIcon size={10} color={colors.gold} />
                    <Text style={{ color: colors.gold, fontSize: 10 }}>{fmtBRL(t.valorAlvo ?? 0)}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TaskModal visible={modalOpen} secoes={secoes} defaultSecaoId={effectiveActiveId} onClose={() => setModalOpen(false)} />
      <TaskDetail tarefa={detailTarefa} wish={wishById(detailTarefa?.wishlistRefId)} onClose={() => setDetailId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headText: { flex: 1, marginRight: spacing.sm },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12,
  },
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  doneFold: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: spacing.sm },
  doneList: { gap: spacing.xs },
  doneItem: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: spacing.sm,
  },
  chipMoney: { flexDirection: "row", alignItems: "center", gap: 3 },
});
