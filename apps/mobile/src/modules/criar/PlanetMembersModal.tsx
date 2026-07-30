import { useState } from "react";
import type { Planeta } from "@project-fox/types";
import Slider from "@react-native-community/slider";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { FriendSummary } from "../orbita/useOrbita";
import { CloseIcon, PlusIcon, UsersIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { memberHealth, useCriar } from "./useCriar";

export function PlanetMembersModal({
  visible, planeta, friends, relatorios, onClose,
}: {
  visible: boolean;
  planeta: Planeta | null;
  friends: FriendSummary[];
  relatorios: import("@project-fox/types").Relatorio[];
  onClose: () => void;
}) {
  const { userId, inviteMember, updateMemberGoal } = useCriar();
  const [meta, setMeta] = useState(planeta?.metaSemanal ?? 3);

  if (!planeta) return null;

  const aceitos = planeta.membros.filter((m) => m.status === "aceito");
  const pendentes = planeta.membros.filter((m) => m.status === "pendente");
  const memberIds = new Set(planeta.membros.map((m) => m.userId));
  const available = friends.filter((f) => !memberIds.has(f.userId));

  async function invite(friendId: string) {
    try {
      await inviteMember.mutateAsync({ planetaId: planeta!.id, friendId });
      Alert.alert("Convite enviado.");
    } catch (e) {
      Alert.alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function saveGoal() {
    try {
      await updateMemberGoal.mutateAsync({ planetaId: planeta!.id, meta });
      Alert.alert("Meta atualizada.");
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
              <Text style={typography.subtitle}>{planeta.nome}</Text>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={typography.muted}>Membros</Text>
              {aceitos.map((m) => (
                <View key={m.userId} style={styles.memberRow}>
                  <Text style={[typography.body, { flex: 1 }]}>{m.userId === userId ? "Você" : m.nome}</Text>
                  <Text style={typography.muted}>{m.papel === "dono" ? "Dono" : "Membro"}</Text>
                  <Text style={typography.muted}>{Math.round(memberHealth(planeta, relatorios, m) * 100)}%</Text>
                </View>
              ))}
              {pendentes.map((m) => (
                <View key={m.userId} style={styles.memberRow}>
                  <Text style={[typography.body, { flex: 1 }]}>{m.nome}</Text>
                  <Text style={typography.muted}>Convite pendente</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={typography.muted}>Sua meta semanal</Text>
              <Slider minimumValue={1} maximumValue={7} step={1} value={meta} onValueChange={setMeta} minimumTrackTintColor={colors.accent} />
              <Text style={typography.body}>{meta}× por semana</Text>
              <Pressable style={styles.smallBtn} onPress={saveGoal}>
                <Text style={typography.body}>Salvar meta</Text>
              </Pressable>
            </View>

            {planeta.meuPapel === "dono" && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <UsersIcon size={13} color={colors.text} />
                  <Text style={typography.muted}>Convidar da sua órbita</Text>
                </View>
                {available.length ? available.map((friend) => (
                  <View key={friend.userId} style={styles.memberRow}>
                    <Text style={[typography.body, { flex: 1 }]}>{friend.nome}</Text>
                    <Pressable style={styles.smallBtn} onPress={() => invite(friend.userId)} disabled={inviteMember.isPending}>
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
  card: { maxHeight: "88%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  section: { gap: spacing.xs },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10, alignSelf: "flex-start" },
  btn: { paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: "center", marginBottom: spacing.lg },
});
