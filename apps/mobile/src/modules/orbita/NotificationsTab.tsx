import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BellIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar, errorMessage, since } from "./Avatar";
import { useOrbita } from "./useOrbita";

function notificationText(type: string) {
  if (type === "amizade_pedido") return "quer entrar na sua órbita.";
  if (type === "amizade_aceita") return "aceitou sua solicitação.";
  if (type === "cutucada") return "deu uma cutucada para você voltar ao movimento.";
  if (type === "desafio_convite") return "convidou você para um desafio.";
  if (type === "desafio_aceito") return "aceitou seu desafio.";
  if (type === "desafio_concluido") return "ajudou a concluir um desafio.";
  if (type === "planeta_convite") return "convidou você para desenvolver um planeta em equipe.";
  if (type === "planeta_aceito") return "aceitou participar do seu planeta.";
  if (type === "espaco_notas_convite") return "convidou você para um espaço de notas.";
  if (type === "espaco_notas_aceito") return "aceitou participar do seu espaço de notas.";
  return "reagiu a uma publicação sua.";
}

export function NotificationsTab({ userId }: { userId: string }) {
  const data = useOrbita(userId);
  const notifications = data.notifications.data ?? [];
  const unread = notifications.filter((n) => !n.lida).length;

  async function markRead() {
    try { await data.markNotificationsRead.mutateAsync(); }
    catch (e) { Alert.alert(errorMessage(e)); }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <BellIcon size={14} color={colors.text} />
        <Text style={typography.subtitle}>Notificações</Text>
        {unread > 0 && (
          <Pressable style={styles.markBtn} onPress={markRead}>
            <Text style={typography.muted}>Marcar lidas</Text>
          </Pressable>
        )}
      </View>
      {notifications.length ? notifications.map((n) => (
        <View key={n.id} style={[styles.row, !n.lida && styles.rowUnread]}>
          <Avatar name={n.ator?.nome ?? "Fox"} url={n.ator?.avatarUrl} size="sm" />
          <View style={{ flex: 1 }}>
            <Text style={typography.body}>
              <Text style={{ fontWeight: "700" }}>{n.ator?.nome ?? "Alguém"}</Text> {notificationText(n.tipo)}
            </Text>
            <Text style={typography.muted}>{since(n.createdAt)}</Text>
          </View>
        </View>
      )) : (
        <View style={styles.empty}>
          <BellIcon size={20} color={colors.muted} />
          <Text style={typography.muted}>Nenhuma novidade ainda.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  markBtn: { marginLeft: "auto", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowUnread: { backgroundColor: "rgba(110,168,255,0.06)" },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
});
