import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { CloseIcon, UsersIcon } from "../../icons/index";
import { colors, radius, shadow, spacing, typography } from "../../theme/theme";
import { useAnotar } from "./useAnotar";

const COLORS = ["#7c72e8", "#4aa8d8", "#e174a7", "#52b98a", "#e0a855"];

export function CreateNoteSpaceModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const data = useAnotar();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function create() {
    if (!name.trim()) return;
    try {
      const id = await data.createSpace.mutateAsync({ nome: name.trim(), cor: color });
      Alert.alert("Espaço compartilhado criado.");
      setName("");
      onCreated(id);
    } catch (e) {
      Alert.alert(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.head}>
            <View style={styles.headTitle}>
              <UsersIcon size={16} color={colors.text} />
              <View>
                <Text style={typography.subtitle}>Novo espaço</Text>
                <Text style={typography.muted}>Um grafo separado para construir ideias em equipe.</Text>
              </View>
            </View>
            <Pressable onPress={onClose}>
              <CloseIcon size={16} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nome do espaço</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={50} placeholder="Ex.: Pesquisa do projeto" placeholderTextColor={colors.muted} autoFocus />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cor</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, c === color && styles.colorDotSel]} />
              ))}
            </View>
          </View>

          <Text style={[typography.muted, styles.rule]}>
            <Text style={{ fontWeight: "700", color: colors.text }}>Cada mapa é pessoal. </Text>
            Notas e conexões são compartilhadas; a posição dos nós é só sua.
          </Text>

          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={typography.body}>Cancelar</Text>
            </Pressable>
            <GradientButton style={[styles.btn, styles.btnPrimary]} onPress={create} disabled={!name.trim() || data.createSpace.isPending}>
              <Text style={[typography.body, { fontWeight: "600" }]}>Criar espaço</Text>
            </GradientButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: { ...shadow.modal, width: 380, maxWidth: "100%", backgroundColor: colors.panelSolid, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headTitle: { flexDirection: "row", gap: spacing.sm, flex: 1 },
  field: { gap: spacing.xs },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  colorRow: { flexDirection: "row", gap: spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  colorDotSel: { borderColor: "#fff" },
  rule: { lineHeight: 18 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { borderColor: "rgba(148,180,255,0.4)" },
});
