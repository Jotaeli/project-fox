import { useState } from "react";
import type { BadgeNota } from "@project-fox/types";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { BADGE_ORDER, BADGES } from "./graph/badges";
import { useAnotar } from "./useAnotar";

function toggleBadge(arr: BadgeNota[], b: BadgeNota): BadgeNota[] {
  const has = arr.includes(b);
  const next = has ? arr.filter((x) => x !== b) : [...arr, b];
  return next.sort((x, y) => BADGE_ORDER.indexOf(x) - BADGE_ORDER.indexOf(y));
}

export function NewNoteModal({
  visible, position, espacoId, onClose, onCreated,
}: {
  visible: boolean;
  position: { x: number; y: number };
  espacoId?: string | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { addNota } = useAnotar(espacoId ?? null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [badges, setBadges] = useState<BadgeNota[]>([]);

  function reset() { setTitulo(""); setConteudo(""); setBadges([]); }

  function submit() {
    if (!titulo.trim()) { Alert.alert("Dê um título pra nota."); return; }
    addNota.mutate(
      { titulo: titulo.trim(), conteudo: conteudo.trim(), badges, posX: position.x, posY: position.y },
      { onSuccess: (nota) => { reset(); onCreated(nota.id); } }
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={typography.subtitle}>Nova nota</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              maxLength={40}
              placeholder="Ex.: Ideia para um canal"
              placeholderTextColor={colors.muted}
              autoFocus
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Conteúdo</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={conteudo}
              onChangeText={setConteudo}
              maxLength={400}
              multiline
              placeholder="Escreva livremente…"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Badges — com o que essa nota tem a ver?</Text>
            <View style={styles.badgeRow}>
              {BADGE_ORDER.map((b) => (
                <Pressable
                  key={b}
                  onPress={() => setBadges(toggleBadge(badges, b))}
                  style={[styles.badgeTog, badges.includes(b) && { borderColor: `rgb(${BADGES[b].rgb.join(",")})` }]}
                >
                  <View style={[styles.dot, { backgroundColor: `rgb(${BADGES[b].rgb.join(",")})` }]} />
                  <Text style={typography.body}>{BADGES[b].label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={typography.body}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={addNota.isPending}>
              <Text style={[typography.body, { fontWeight: "600" }]}>Criar nota</Text>
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
  textarea: { minHeight: 70, textAlignVertical: "top" },
  badgeRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  badgeTog: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
});
