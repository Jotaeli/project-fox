import { useEffect, useRef } from "react";
import type { ItemWishlist, OrdenacaoSecao, SecaoTarefas, Tarefa } from "@project-fox/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedRef,
} from "react-native-reanimated";
import { ClockIcon, CoinIcon, GripIcon, PlusIcon, SparkIcon } from "../../../icons/index";
import { deadlineUrgency, fmtBRL, fmtDeadlineShort } from "../../../lib/currentMonth";
import { colors, radius, spacing, typography } from "../../../theme/theme";
import { StageDots } from "./StageDots";
import { useTarefas } from "./useTarefas";

const URGENCY_COLOR: Record<string, string> = {
  atrasado: colors.danger,
  urgent: "#ff8f8f",
  warn: colors.gold,
  "": colors.muted,
};

const TAP_THRESHOLD = 8;

function TaskCard({
  tarefa,
  wish,
  draggable,
  orderedIds,
  sectionRefs,
  taskRefs,
  registerTaskRef,
  currentSectionId,
  onOpen,
  onMoveToSection,
  onReorder,
  onDragStateChange,
}: {
  tarefa: Tarefa;
  wish?: ItemWishlist;
  draggable: boolean;
  orderedIds: string[];
  sectionRefs: Record<string, AnimatedRef<View>>;
  taskRefs: Record<string, AnimatedRef<View>>;
  registerTaskRef: (id: string, ref: AnimatedRef<View>) => void;
  currentSectionId: string;
  onOpen: () => void;
  onMoveToSection: (taskId: string, secaoId: string) => void;
  onReorder: (ids: string[]) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const ref = useAnimatedRef<View>();
  useEffect(() => { registerTaskRef(tarefa.id, ref); }, [tarefa.id]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const stages = tarefa.etapas.slice().sort((a, b) => a.ordem - b.ordem);
  const done = stages.filter((s) => s.concluida).length;

  function handleReorderDrop(centerY: number) {
    "worklet";
    let bestId: string | null = null;
    let bestDist = Infinity;
    let bestBefore = false;
    for (const id of orderedIds) {
      if (id === tarefa.id) continue;
      const m = measure(taskRefs[id]);
      if (!m) continue;
      const otherCenter = m.pageY + m.height / 2;
      const dist = Math.abs(otherCenter - centerY);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = id;
        bestBefore = centerY < otherCenter;
      }
    }
    if (!bestId) return;
    const ids = orderedIds.filter((id) => id !== tarefa.id);
    let targetIdx = ids.indexOf(bestId);
    ids.splice(targetIdx + (bestBefore ? 0 : 1), 0, tarefa.id);
    runOnJS(onReorder)(ids);
  }

  const pan = Gesture.Pan()
    .enabled(draggable)
    .onStart(() => {
      scale.value = withSpring(1.03);
      zIndex.value = 10;
      runOnJS(onDragStateChange)(true);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const moved = Math.abs(e.translationX) > TAP_THRESHOLD || Math.abs(e.translationY) > TAP_THRESHOLD;
      if (moved) {
        let movedToSection = false;
        for (const key of Object.keys(sectionRefs)) {
          if (key === currentSectionId) continue;
          const m = measure(sectionRefs[key]);
          if (m && e.absoluteX >= m.pageX && e.absoluteX <= m.pageX + m.width && e.absoluteY >= m.pageY && e.absoluteY <= m.pageY + m.height) {
            runOnJS(onMoveToSection)(tarefa.id, key);
            movedToSection = true;
            break;
          }
        }
        if (!movedToSection) {
          handleReorderDrop(e.absoluteY);
        }
      } else {
        runOnJS(onOpen)();
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    zIndex: zIndex.value,
  }));

  const urgency = tarefa.prazo ? deadlineUrgency(tarefa.prazo) : "";

  return (
    <GestureDetector gesture={pan}>
      <Animated.View ref={ref} collapsable={false} style={[styles.card, style]}>
        {tarefa.prazo && (
          <View style={styles.deadline}>
            <ClockIcon size={11} color={URGENCY_COLOR[urgency]} />
            <Text style={[styles.deadlineText, { color: URGENCY_COLOR[urgency] }]}>{fmtDeadlineShort(tarefa.prazo)}</Text>
          </View>
        )}
        <View style={styles.titleRow}>
          {draggable && <GripIcon size={14} color={colors.muted} />}
          <Text style={typography.subtitle} numberOfLines={2}>{tarefa.titulo}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={typography.muted}>etapa {Math.min(done + 1, stages.length)}/{stages.length}</Text>
          <StageDots tarefa={tarefa} />
          {tarefa.financeira && (
            <View style={styles.chipMoney}>
              <CoinIcon size={10} color={colors.gold} />
              <Text style={styles.chipMoneyText}>{fmtBRL(tarefa.valorAlvo ?? 0)}</Text>
            </View>
          )}
          {wish && (
            <View style={styles.chipWish}>
              <SparkIcon size={10} color={colors.green} />
              <Text style={styles.chipWishText} numberOfLines={1}>{wish.nome}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function StackPanel({
  sec, tasks, wishById, sectionRefs, onOpenTask, onAddTask,
}: {
  sec: SecaoTarefas;
  tasks: Tarefa[];
  wishById: (id?: string) => ItemWishlist | undefined;
  sectionRefs: Record<string, AnimatedRef<View>>;
  onOpenTask: (id: string) => void;
  onAddTask: () => void;
}) {
  const { updateSecaoSort, reorderTasks, moveTaskToSection } = useTarefas();
  const taskRefs = useRef<Record<string, AnimatedRef<View>>>({}).current;
  const orderedIds = tasks.map((t) => t.id);

  function setOrdenacao(o: OrdenacaoSecao) {
    updateSecaoSort.mutate({ id: sec.id, ordenacao: o });
  }

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={typography.subtitle}>{sec.nome}</Text>
        <View style={styles.filter}>
          <Pressable style={[styles.filterBtn, sec.ordenacao === "personalizado" && styles.filterBtnSel]} onPress={() => setOrdenacao("personalizado")}>
            <Text style={typography.muted}>Personalizado</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, sec.ordenacao === "data" && styles.filterBtnSel]} onPress={() => setOrdenacao("data")}>
            <Text style={typography.muted}>Data</Text>
          </Pressable>
        </View>
        <Pressable style={styles.addBtn} onPress={onAddTask}>
          <PlusIcon size={14} color={colors.text} />
        </Pressable>
      </View>

      {tasks.length === 0 && <Text style={[typography.muted, styles.empty]}>Nenhuma tarefa aqui ainda.</Text>}

      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          tarefa={t}
          wish={wishById(t.wishlistRefId)}
          draggable={sec.ordenacao === "personalizado"}
          orderedIds={orderedIds}
          sectionRefs={sectionRefs}
          taskRefs={taskRefs}
          registerTaskRef={(id, ref) => { taskRefs[id] = ref; }}
          currentSectionId={sec.id}
          onOpen={() => onOpenTask(t.id)}
          onMoveToSection={(taskId, secaoId) => moveTaskToSection.mutate({ taskId, secaoId })}
          onReorder={(ids) => reorderTasks.mutate(ids)}
          onDragStateChange={() => {}}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  filter: { flexDirection: "row", gap: 4, marginLeft: "auto" },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line },
  filterBtnSel: { backgroundColor: "rgba(110,168,255,0.15)", borderColor: colors.accent },
  addBtn: { width: 30, height: 30, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  empty: { fontStyle: "italic", paddingVertical: spacing.lg, textAlign: "center" },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
  },
  deadline: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  deadlineText: { fontSize: 11 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  chipMoney: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderColor: "rgba(255,214,110,.35)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 },
  chipMoneyText: { color: colors.gold, fontSize: 10 },
  chipWish: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderColor: "rgba(74,222,128,.35)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 120 },
  chipWishText: { color: colors.green, fontSize: 10 },
});
