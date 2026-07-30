import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { CloseIcon, UsersIcon } from "../../icons/index";
import { colors, radius, shadow, spacing, typography } from "../../theme/theme";
import { useAnotar } from "./useAnotar";

export function NoteSpaceInvitesModal({ visible, onClose, onAccepted }: { visible: boolean; onClose: () => void; onAccepted: (id: string) => void }) {
  const data = useAnotar();

  async function answer(id: string, accept: boolean) {
    try {
      await data.respondInvite.mutateAsync({ spaceId: id, accept });
      Alert.alert(accept ? "Espaço adicionado ao Anotar." : "Convite recusado.");
      if (accept) onAccepted(id);
      else if (data.spaceInvites.length <= 1) onClose();
    } catch (e) {
      Alert.alert(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.head}>
              <View style={styles.headTitle}>
                <UsersIcon size={16} color={colors.text} />
                <View>
                  <Text style={typography.subtitle}>Convites para espaços</Text>
                  <Text style={typography.muted}>Escolha os grafos colaborativos que entram no seu Anotar.</Text>
                </View>
              </View>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            {data.spaceInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteRow}>
                <View style={[styles.dot, { backgroundColor: invite.cor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{invite.nome}</Text>
                  <Text style={typography.muted}>Espaço compartilhado de notas</Text>
                </View>
                <Pressable style={styles.smallBtn} onPress={() => answer(invite.id, false)}>
                  <Text style={typography.body}>Recusar</Text>
                </Pressable>
                <GradientButton style={[styles.smallBtn, styles.smallBtnPrimary]} onPress={() => answer(invite.id, true)}>
                  <Text style={[typography.body, { fontWeight: "600" }]}>Aceitar</Text>
                </GradientButton>
              </View>
            ))}

            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={typography.body}>Agora não</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", justifyContent: "flex-end" },
  card: { ...shadow.modal, maxHeight: "80%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headTitle: { flexDirection: "row", gap: spacing.sm, flex: 1 },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  dot: { width: 12, height: 12, borderRadius: 6 },
  smallBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  smallBtnPrimary: { borderColor: "rgba(148,180,255,0.4)" },
  btn: { paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: "center", marginBottom: spacing.lg },
});
