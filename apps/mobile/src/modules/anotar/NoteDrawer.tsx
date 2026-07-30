import { useEffect, useState } from "react";
import type { BadgeNota, ConexaoNota, Nota } from "@project-fox/types";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CloseIcon, LinkIcon, TrashIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { BADGE_ORDER, BADGES, INDEP_RGB } from "./graph/badges";
import { useAnotar } from "./useAnotar";

function toggleBadge(arr: BadgeNota[], b: BadgeNota): BadgeNota[] {
  const has = arr.includes(b);
  const next = has ? arr.filter((x) => x !== b) : [...arr, b];
  return next.sort((x, y) => BADGE_ORDER.indexOf(x) - BADGE_ORDER.indexOf(y));
}

export function NoteDrawer({
  nota, notas, conexoes, connecting, espacoId, userId, onClose, onStartConnect, onGoToNote,
}: {
  nota: Nota | null;
  notas: Nota[];
  conexoes: ConexaoNota[];
  connecting: boolean;
  espacoId?: string | null;
  userId?: string;
  onClose: () => void;
  onStartConnect: () => void;
  onGoToNote: (id: string) => void;
}) {
  const { updateNota, deleteNota, deleteConexao } = useAnotar(espacoId ?? null);
  const [body, setBody] = useState("");
  const [badges, setBadges] = useState<BadgeNota[]>([]);

  useEffect(() => {
    if (nota) { setBody(nota.conteudo); setBadges(nota.badges); }
  }, [nota?.id]);

  if (!nota) return null;

  const canEdit = !espacoId || nota.userId === userId;

  function handleBodyChange(v: string) {
    setBody(v);
    updateNota.mutate({ id: nota!.id, conteudo: v });
  }
  function handleBadgeToggle(b: BadgeNota) {
    const next = toggleBadge(badges, b);
    setBadges(next);
    updateNota.mutate({ id: nota!.id, badges: next });
  }
  function confirmDelete() {
    Alert.alert("Excluir nota?", `A nota "${nota!.titulo}" e suas conexões serão removidas.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteNota.mutate(nota!.id, { onSuccess: onClose }) },
    ]);
  }

  const neighborIds = conexoes
    .filter((c) => c.notaOrigemId === nota.id || c.notaDestinoId === nota.id)
    .map((c) => (c.notaOrigemId === nota.id ? c.notaDestinoId : c.notaOrigemId));
  const neighbors = notas.filter((n) => neighborIds.includes(n.id));

  const dotColor = badges.length ? `rgb(${BADGES[badges[0]].rgb.join(",")})` : `rgb(${INDEP_RGB.join(",")})`;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.head}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <Text style={[typography.title, { flex: 1 }]} numberOfLines={1}>{nota.titulo}</Text>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Conteúdo</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={body}
                onChangeText={handleBodyChange}
                editable={canEdit}
                maxLength={400}
                multiline
                placeholder="Escreva livremente…"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Badges</Text>
              <View style={styles.badgeRow}>
                {BADGE_ORDER.map((b) => (
                  <Pressable
                    key={b}
                    onPress={() => canEdit && handleBadgeToggle(b)}
                    style={[styles.badgeTog, badges.includes(b) && { borderColor: `rgb(${BADGES[b].rgb.join(",")})` }]}
                  >
                    <View style={[styles.dot, { backgroundColor: `rgb(${BADGES[b].rgb.join(",")})`, width: 8, height: 8 }]} />
                    <Text style={typography.body}>{BADGES[b].label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Conexões</Text>
              {neighbors.length === 0 && <Text style={[typography.muted, { fontStyle: "italic" }]}>Sem conexões ainda.</Text>}
              {neighbors.map((m) => {
                const rgb = m.badges.length ? BADGES[m.badges[0]].rgb : INDEP_RGB;
                return (
                  <Pressable key={m.id} style={styles.connItem} onPress={() => onGoToNote(m.id)}>
                    <View style={[styles.dot, { backgroundColor: `rgb(${rgb.join(",")})`, width: 8, height: 8 }]} />
                    <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{m.titulo}</Text>
                    <Pressable hitSlop={8} onPress={() => deleteConexao.mutate({ a: nota!.id, b: m.id })}>
                      <CloseIcon size={12} color={colors.muted} />
                    </Pressable>
                  </Pressable>
                );
              })}
              <Pressable style={[styles.connectBtn, connecting && styles.connectBtnActive]} onPress={onStartConnect}>
                <LinkIcon size={13} color={colors.text} />
                <Text style={typography.body}>{connecting ? "Toque em outra nota…" : "Conectar a outra nota"}</Text>
              </Pressable>
            </View>

            {canEdit ? (
              <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
                <TrashIcon size={14} color={colors.danger} />
                <Text style={{ color: colors.danger }}>Excluir</Text>
              </Pressable>
            ) : (
              <Text style={[typography.muted, { textAlign: "center", marginBottom: spacing.lg }]}>Só o autor pode editar ou excluir esta nota.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", justifyContent: "flex-end" },
  card: {
    maxHeight: "85%",
    backgroundColor: colors.panelSolid,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
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
  textarea: { minHeight: 90, textAlignVertical: "top" },
  badgeRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  badgeTog: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10,
  },
  connItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  connectBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 10, marginTop: spacing.xs,
  },
  connectBtnActive: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: "rgba(255,120,120,.25)", borderRadius: radius.md, paddingVertical: 10, marginBottom: spacing.lg,
  },
});
