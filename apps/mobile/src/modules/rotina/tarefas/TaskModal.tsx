import { useState } from "react";
import type { SecaoTarefas } from "@project-fox/types";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { GradientButton } from "../../../components/GradientButton";
import { CloseIcon, PlusIcon } from "../../../icons/index";
import { fmtBRL } from "../../../lib/currentMonth";
import { colors, radius, shadow, spacing, typography } from "../../../theme/theme";
import { useWishlist } from "../wishlist/useWishlist";
import { useTarefas } from "./useTarefas";

export function TaskModal({
  visible, secoes, defaultSecaoId, onClose,
}: {
  visible: boolean;
  secoes: SecaoTarefas[];
  defaultSecaoId: string;
  onClose: () => void;
}) {
  const { addTarefa } = useTarefas();
  const { items } = useWishlist();
  const [titulo, setTitulo] = useState("");
  const [secaoId, setSecaoId] = useState(defaultSecaoId);
  const [prazo, setPrazo] = useState("");
  const [stages, setStages] = useState<string[]>([""]);
  const [financeira, setFinanceira] = useState(false);
  const [valor, setValor] = useState("");
  const [wishId, setWishId] = useState<string | null>(null);

  function setStage(i: number, v: string) {
    setStages((prev) => prev.map((s, idx) => (idx === i ? v : s)));
  }
  function removeStage(i: number) {
    if (stages.length > 1) setStages((prev) => prev.filter((_, idx) => idx !== i));
  }
  function reset() {
    setTitulo(""); setSecaoId(defaultSecaoId); setPrazo(""); setStages([""]);
    setFinanceira(false); setValor(""); setWishId(null);
  }

  function submit() {
    const title = titulo.trim();
    if (!title) { Alert.alert("Dê um título pra tarefa."); return; }
    const cleanStages = stages.map((s) => s.trim()).filter(Boolean);
    if (!cleanStages.length) { Alert.alert("Adicione pelo menos uma etapa."); return; }
    addTarefa.mutate(
      {
        titulo: title, secaoId: secaoId || defaultSecaoId, prazo: prazo || undefined, etapas: cleanStages,
        financeira, valorAlvo: financeira ? Number(valor) || 0 : undefined,
        wishlistRefId: financeira && wishId ? wishId : undefined,
      },
      { onSuccess: () => { reset(); onClose(); } },
    );
  }

  const availableWishItems = items.filter((w) => !w.comprado);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <Text style={typography.subtitle}>Nova tarefa</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                maxLength={50}
                placeholder="Ex.: Organizar o quarto"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Seção</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {secoes.map((s) => (
                  <Pressable
                    key={s.id}
                    style={[styles.secOpt, secaoId === s.id && styles.secOptSel]}
                    onPress={() => setSecaoId(s.id)}
                  >
                    <Text style={typography.body}>{s.nome}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Prazo (opcional, AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={prazo}
                onChangeText={setPrazo}
                placeholder="2026-08-15"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Etapas</Text>
              {stages.map((s, i) => (
                <View key={i} style={styles.stageRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={s}
                    onChangeText={(v) => setStage(i, v)}
                    maxLength={60}
                    placeholder="Ex.: Separar materiais"
                    placeholderTextColor={colors.muted}
                  />
                  <Pressable style={styles.iconBtn} onPress={() => removeStage(i)}>
                    <CloseIcon size={12} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addStageBtn} onPress={() => setStages((prev) => [...prev, ""])}>
                <PlusIcon size={13} color={colors.text} />
                <Text style={typography.body}>Adicionar etapa</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={typography.body}>Tarefa financeira</Text>
                <Switch value={financeira} onValueChange={setFinanceira} />
              </View>
              {financeira && (
                <View style={styles.cascade}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Valor a conquistar</Text>
                    <TextInput
                      style={styles.input}
                      value={valor}
                      onChangeText={setValor}
                      keyboardType="numeric"
                      placeholder="R$"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  {availableWishItems.length > 0 && (
                    <View style={styles.field}>
                      <Text style={styles.label}>Referenciar desejo da wishlist</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {availableWishItems.map((w) => (
                          <Pressable
                            key={w.id}
                            style={[styles.secOpt, wishId === w.id && styles.secOptSel]}
                            onPress={() => setWishId(wishId === w.id ? null : w.id)}
                          >
                            <Text style={typography.body} numberOfLines={1}>{w.nome} — {fmtBRL(w.valor)}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={onClose}>
                <Text style={typography.body}>Cancelar</Text>
              </Pressable>
              <GradientButton style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={addTarefa.isPending}>
                <Text style={[typography.body, { fontWeight: "600" }]}>Criar tarefa</Text>
              </GradientButton>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", justifyContent: "flex-end" },
  card: { ...shadow.modal,
    maxHeight: "90%",
    backgroundColor: colors.panelSolid,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  field: { gap: spacing.xs },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    backgroundColor: "rgba(8,14,32,0.8)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    color: colors.text,
    padding: 10,
  },
  secOpt: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: spacing.xs,
  },
  secOptSel: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
  stageRow: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  iconBtn: { width: 30, height: 30, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  addStageBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 9, marginTop: spacing.xs,
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cascade: { gap: spacing.md, marginTop: spacing.sm },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginBottom: spacing.lg },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { borderColor: "rgba(148,180,255,0.4)" },
});
