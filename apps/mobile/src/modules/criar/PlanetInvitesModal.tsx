import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CloseIcon, UsersIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { useCriar } from "./useCriar";

export function PlanetInvitesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { convitesPlaneta, respondInvite } = useCriar();

  async function answer(planetaId: string, accept: boolean) {
    try {
      await respondInvite.mutateAsync({ planetaId, accept });
      Alert.alert(accept ? "Planeta adicionado ao seu Criar." : "Convite recusado.");
      if (convitesPlaneta.length <= 1) onClose();
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
                  <Text style={typography.subtitle}>Convites para planetas</Text>
                  <Text style={typography.muted}>Áreas em equipe que podem entrar no seu Criar.</Text>
                </View>
              </View>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            {convitesPlaneta.map(({ planeta }) => (
              <View key={planeta.id} style={styles.inviteRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{planeta.nome}</Text>
                  <Text style={typography.muted} numberOfLines={1}>{planeta.objetivo_principal}</Text>
                </View>
                <Pressable style={styles.smallBtn} onPress={() => answer(planeta.id, false)}>
                  <Text style={typography.body}>Recusar</Text>
                </Pressable>
                <Pressable style={[styles.smallBtn, styles.smallBtnPrimary]} onPress={() => answer(planeta.id, true)}>
                  <Text style={[typography.body, { fontWeight: "600" }]}>Aceitar</Text>
                </Pressable>
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
  card: { maxHeight: "80%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headTitle: { flexDirection: "row", gap: spacing.sm, flex: 1 },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  smallBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  smallBtnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
  btn: { paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: "center", marginBottom: spacing.lg },
});
