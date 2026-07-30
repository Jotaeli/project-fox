import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { CloseIcon } from "../../icons/index";
import { colors, radius, shadow, spacing, typography } from "../../theme/theme";
import { DEADLINES, GOAL_ICONS, HUES } from "./criarConstants";
import { useCriar } from "./useCriar";

export function GoalModal({
  visible, planetaId, planetaNome, onClose,
}: {
  visible: boolean;
  planetaId: string | null;
  planetaNome: string;
  onClose: () => void;
}) {
  const { addEvento } = useCriar();
  const [titulo, setTitulo] = useState("");
  const [icone, setIcone] = useState(GOAL_ICONS[0].id);
  const [hue, setHue] = useState(HUES[0]);
  const [dias, setDias] = useState(30);
  const [items, setItems] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState("");

  function addItem() {
    const v = itemInput.trim();
    if (!v) return;
    setItems((prev) => [...prev, v]);
    setItemInput("");
  }

  function reset() {
    setTitulo(""); setIcone(GOAL_ICONS[0].id); setHue(HUES[0]); setDias(30); setItems([]); setItemInput("");
  }

  function submit() {
    if (!planetaId) return;
    const t = titulo.trim();
    if (!t) { Alert.alert("Dê um título pra meta."); return; }
    if (!items.length) { Alert.alert("Adicione pelo menos um objetivo ao checklist."); return; }
    const prazo = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
    addEvento.mutate(
      { planetaId, titulo: t, icone, cor: String(hue), prazo, checklist: items },
      { onSuccess: () => { reset(); onClose(); } }
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <Text style={typography.subtitle}>Nova meta · {planetaNome}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Título</Text>
              <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} maxLength={48} placeholder="Ex.: Ler Dom Quixote" placeholderTextColor={colors.muted} autoFocus />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ícone</Text>
              <View style={styles.iconGrid}>
                {GOAL_ICONS.map((g) => {
                  const Icon = g.icon;
                  const sel = icone === g.id;
                  return (
                    <Pressable key={g.id} onPress={() => setIcone(g.id)} style={[styles.iconOpt, sel && { borderColor: `hsl(${hue},65%,60%)`, backgroundColor: `hsla(${hue},60%,55%,0.12)` }]}>
                      <Icon size={18} color={sel ? `hsl(${hue},75%,72%)` : colors.muted} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cor</Text>
              <View style={styles.swatches}>
                {HUES.map((h) => (
                  <Pressable key={h} onPress={() => setHue(h)} style={[styles.swatch, { backgroundColor: `hsl(${h},65%,55%)` }, hue === h && styles.swatchSel]} />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Prazo</Text>
              <View style={styles.dlChips}>
                {DEADLINES.map((dl) => (
                  <Pressable key={dl.d} onPress={() => setDias(dl.d)} style={[styles.dlChip, dias === dl.d && styles.dlChipSel]}>
                    <Text style={typography.body}>{dl.l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Checklist de objetivos</Text>
              {items.map((it, i) => (
                <View key={i} style={styles.clItem}>
                  <Text style={[typography.body, { flex: 1 }]}>{i + 1}. {it}</Text>
                  <Pressable onPress={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                    <CloseIcon size={12} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={itemInput}
                  onChangeText={setItemInput}
                  maxLength={60}
                  placeholder="Ex.: Terminar a Parte 1"
                  placeholderTextColor={colors.muted}
                  onSubmitEditing={addItem}
                />
                <Pressable style={styles.smallBtn} onPress={addItem}>
                  <Text style={typography.body}>Adicionar</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={onClose}>
                <Text style={typography.body}>Cancelar</Text>
              </Pressable>
              <GradientButton style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={addEvento.isPending}>
                <Text style={[typography.body, { fontWeight: "600" }]}>Criar meta</Text>
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
  card: { ...shadow.modal, maxHeight: "90%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  field: { gap: spacing.xs },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  iconOpt: { width: 42, height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  swatches: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  swatch: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: "transparent" },
  swatchSel: { borderColor: "#fff" },
  dlChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dlChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 12 },
  dlChipSel: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
  clItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  addRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  smallBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { borderColor: "rgba(148,180,255,0.4)" },
});
