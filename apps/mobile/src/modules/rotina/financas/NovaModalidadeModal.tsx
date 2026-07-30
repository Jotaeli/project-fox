import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../../../theme/theme";
import { HUES } from "../wishlist/wishConstants";
import { useFinancas } from "./useFinancas";

export function NovaModalidadeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addModalidade } = useFinancas();
  const [nome, setNome] = useState("");
  const [hue, setHue] = useState(HUES[0]);

  function submit() {
    if (!nome.trim()) {
      Alert.alert("Dê um nome pra modalidade.");
      return;
    }
    addModalidade.mutate(
      { nome: nome.trim(), cor: `hsl(${hue},65%,55%)` },
      { onSuccess: () => { setNome(""); onClose(); } }
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={typography.subtitle}>Nova modalidade</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              maxLength={24}
              placeholder="Ex.: Transporte"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Cor</Text>
            <View style={styles.swatches}>
              {HUES.map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setHue(h)}
                  style={[
                    styles.swatch,
                    { backgroundColor: `hsl(${h}, 55%, 45%)` },
                    hue === h && styles.swatchSel,
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={typography.body}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={addModalidade.isPending}>
              <Text style={[typography.body, { fontWeight: "600" }]}>Criar modalidade</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", alignItems: "center", justifyContent: "center" },
  card: {
    width: 340,
    maxWidth: "90%",
    backgroundColor: colors.panelSolid,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
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
  swatches: { flexDirection: "row", gap: spacing.sm },
  swatch: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: "transparent" },
  swatchSel: { borderColor: "#fff" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
});
