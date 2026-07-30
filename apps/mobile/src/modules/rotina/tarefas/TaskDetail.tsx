import { useState } from "react";
import type { ItemWishlist, Tarefa } from "@project-fox/types";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckIcon, CoinIcon, SparkIcon, TrashIcon } from "../../../icons/index";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, radius, spacing, typography } from "../../../theme/theme";
import { useTarefas } from "./useTarefas";

export function TaskDetail({ tarefa, wish, onClose }: { tarefa: Tarefa | null; wish?: ItemWishlist; onClose: () => void }) {
  const { avancarEtapa, desfazerEtapa, deleteTarefa } = useTarefas();
  const [busy, setBusy] = useState(false);

  if (!tarefa) return null;
  const stages = tarefa.etapas.slice().sort((a, b) => a.ordem - b.ordem);
  const doneCount = stages.filter((s) => s.concluida).length;
  const finished = doneCount === stages.length;

  function handleAdvance() {
    setBusy(true);
    avancarEtapa.mutate(tarefa!, {
      onSuccess: (res) => {
        setBusy(false);
        if (res.finished) {
          const msg = tarefa!.financeira && tarefa!.valorAlvo
            ? `${fmtBRL(tarefa!.valorAlvo)} conquistados foram pro cofrinho!`
            : "Tarefa concluída!";
          Alert.alert(msg);
          setTimeout(onClose, 300);
        }
      },
      onError: () => setBusy(false),
    });
  }

  function confirmDelete() {
    Alert.alert("Excluir tarefa?", `A tarefa "${tarefa!.titulo}" e suas etapas serão perdidas.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteTarefa.mutate(tarefa!.id, { onSuccess: onClose }) },
    ]);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={typography.title}>{tarefa.titulo}</Text>
          <View style={styles.chips}>
            {tarefa.financeira && (
              <View style={styles.chipMoney}>
                <CoinIcon size={11} color={colors.gold} />
                <Text style={styles.chipMoneyText}>conquista {fmtBRL(tarefa.valorAlvo ?? 0)}</Text>
              </View>
            )}
            {wish && (
              <View style={styles.chipWish}>
                <SparkIcon size={11} color={colors.green} />
                <Text style={styles.chipWishText}>{wish.nome}</Text>
              </View>
            )}
          </View>

          <View style={styles.stages}>
            {stages.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.stageLine, s.concluida && styles.stageDone]}
                onPress={() => s.concluida && desfazerEtapa.mutate({ tarefa, etapaOrdem: s.ordem })}
              >
                <View style={[styles.stageDot, s.concluida && styles.stageDotDone]}>
                  {s.concluida && <CheckIcon size={11} color={colors.bg0} />}
                </View>
                <Text style={typography.body}>{s.titulo}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.advanceBtn, finished && styles.advanceBtnDone]} onPress={handleAdvance} disabled={finished || busy}>
            <Text style={[typography.body, { fontWeight: "600" }]}>
              {finished ? "Tarefa concluída" : "Concluir etapa"}
            </Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable style={styles.btnDanger} onPress={confirmDelete}>
              <TrashIcon size={14} color={colors.danger} />
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
  card: {
    width: 380,
    maxWidth: "100%",
    backgroundColor: colors.panelSolid,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chipMoney: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(255,214,110,.35)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  chipMoneyText: { color: colors.gold, fontSize: 11 },
  chipWish: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(74,222,128,.35)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  chipWishText: { color: colors.green, fontSize: 11 },
  stages: { gap: 6, marginTop: spacing.sm },
  stageLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  stageDone: { opacity: 0.75 },
  stageDot: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  stageDotDone: { backgroundColor: colors.green, borderColor: colors.green },
  advanceBtn: {
    backgroundColor: "#3667c4",
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  advanceBtnDone: { backgroundColor: "rgba(74,222,128,0.25)" },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnDanger: {
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,120,120,.25)",
  },
});
