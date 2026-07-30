import type { EspacoNotas } from "@project-fox/types";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { FriendSummary } from "../orbita/useOrbita";
import { CheckIcon, CloseIcon, PlusIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { useAnotar } from "./useAnotar";

export function NoteSpaceMembersModal({
  visible, space, friends, onClose,
}: {
  visible: boolean;
  space: EspacoNotas | null;
  friends: FriendSummary[];
  onClose: () => void;
}) {
  const data = useAnotar(space?.id ?? null);

  if (!space) return null;

  const memberIds = new Set(space.membros.map((member) => member.userId));
  const available = friends.filter((friend) => !memberIds.has(friend.userId));

  async function invite(friendId: string) {
    try {
      await data.inviteMember.mutateAsync({ spaceId: space!.id, friendId });
      Alert.alert("Convite enviado.");
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
              <Text style={typography.subtitle}>{space.nome}</Text>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={typography.muted}>Membros</Text>
              {space.membros.map((member) => (
                <View key={member.userId} style={styles.memberRow}>
                  <Text style={[typography.body, { flex: 1 }]}>{member.userId === data.userId ? "Você" : member.nome}</Text>
                  <Text style={typography.muted}>{member.status === "pendente" ? "Convite pendente" : member.papel === "dono" ? "Dono do espaço" : "Membro"}</Text>
                  {member.status === "aceito" && <CheckIcon size={13} color={colors.green} />}
                </View>
              ))}
            </View>

            {space.meuPapel === "dono" && (
              <View style={styles.section}>
                <Text style={typography.muted}>Convidar da sua órbita</Text>
                {available.length ? available.map((friend) => (
                  <View key={friend.userId} style={styles.memberRow}>
                    <Text style={[typography.body, { flex: 1 }]}>{friend.nome}</Text>
                    <Pressable style={styles.smallBtn} onPress={() => invite(friend.userId)} disabled={data.inviteMember.isPending}>
                      <PlusIcon size={12} color={colors.text} />
                      <Text style={typography.body}>Convidar</Text>
                    </Pressable>
                  </View>
                )) : <Text style={[typography.muted, { fontStyle: "italic" }]}>Todos os seus amigos já participam ou receberam convite.</Text>}
              </View>
            )}

            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={typography.body}>Fechar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", justifyContent: "flex-end" },
  card: { maxHeight: "85%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  section: { gap: spacing.xs },
  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  btn: { paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: "center", marginBottom: spacing.lg },
});
