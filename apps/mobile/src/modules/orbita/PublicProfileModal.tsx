import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CloseIcon, PlanetIcon, ShieldIcon, SparkIcon, TargetIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar, errorMessage } from "./Avatar";
import { getPublicProfile, useOrbita, type FriendSummary, type PublicProfile } from "./useOrbita";

export function PublicProfileModal({
  userId, friend, onClose,
}: {
  userId: string;
  friend: FriendSummary | null;
  onClose: () => void;
}) {
  const data = useOrbita(userId);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!friend) { setProfile(null); return; }
    setLoading(true);
    getPublicProfile(friend.userId)
      .then(setProfile)
      .catch((e) => Alert.alert(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [friend?.userId]);

  if (!friend) return null;

  async function act(action: () => Promise<unknown>, success: string) {
    try { await action(); Alert.alert(success); onClose(); }
    catch (e) { Alert.alert(errorMessage(e)); }
  }

  function confirmBlock() {
    Alert.alert("Bloquear esta pessoa?", "Vocês deixarão de se ver, a amizade será removida e novas interações serão impedidas.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Bloquear", style: "destructive", onPress: () => act(() => data.block.mutateAsync(friend!.userId), "Pessoa bloqueada.") },
    ]);
  }

  const planet = profile?.planetaFavorito;
  const meta = profile?.metaPrincipal;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.closeRow}>
            <Pressable onPress={onClose}>
              <CloseIcon size={16} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.hero}>
            <Avatar name={friend.nome} url={friend.avatarUrl} size="lg" />
            <Text style={typography.title}>{profile?.nome ?? friend.nome}</Text>
            <Text style={typography.muted}>@{profile?.handle ?? friend.handle ?? "sem-handle"}</Text>
            {profile?.bio && <Text style={typography.body}>{profile.bio}</Text>}
          </View>

          {loading ? (
            <Text style={[typography.muted, { textAlign: "center" }]}>Carregando perfil…</Text>
          ) : (
            <View style={styles.showcase}>
              {planet && (
                <View style={styles.showcaseCard}>
                  <PlanetIcon size={16} color="#c9b6ff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.showcaseLabel}>PLANETA FAVORITO</Text>
                    <Text style={typography.body}>{String(planet.nome)}</Text>
                    <Text style={typography.muted}>{String(planet.objetivo_principal ?? "Em desenvolvimento")}</Text>
                  </View>
                </View>
              )}
              {meta && (
                <View style={styles.showcaseCard}>
                  <TargetIcon size={16} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.showcaseLabel}>META PRINCIPAL</Text>
                    <Text style={typography.body}>{String(meta.titulo)}</Text>
                    <Text style={typography.muted}>{String(meta.comprovados ?? 0)} de {String(meta.total ?? 0)} objetivos comprovados</Text>
                  </View>
                </View>
              )}
              {!planet && !meta && (
                <View style={styles.privateRow}>
                  <ShieldIcon size={14} color={colors.muted} />
                  <Text style={typography.muted}>Esta pessoa manteve os detalhes do perfil reservados.</Text>
                </View>
              )}
            </View>
          )}

          {friend.direction === "friend" && (
            <View style={styles.actions}>
              <Pressable style={styles.btnPrimary} onPress={() => act(() => data.poke.mutateAsync({ targetId: friend.userId }), "Cutucada enviada.")}>
                <SparkIcon size={13} color={colors.text} />
                <Text style={[typography.body, { fontWeight: "600" }]}>Cutucar</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => act(() => data.removeFriend.mutateAsync(friend.friendshipId), "Pessoa removida da sua órbita.")}>
                <Text style={typography.body}>Desfazer amizade</Text>
              </Pressable>
              <Pressable style={styles.btnDanger} onPress={confirmBlock}>
                <ShieldIcon size={13} color={colors.danger} />
                <Text style={{ color: colors.danger }}>Bloquear</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: { width: 380, maxWidth: "100%", backgroundColor: colors.panelSolid, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  closeRow: { alignItems: "flex-end" },
  hero: { alignItems: "center", gap: 4 },
  showcase: { gap: spacing.sm },
  showcaseCard: { flexDirection: "row", gap: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: spacing.sm },
  showcaseLabel: { fontSize: 10, color: colors.muted, letterSpacing: 0.4 },
  privateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center" },
  actions: { gap: spacing.sm },
  btn: { alignItems: "center", paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: radius.md, backgroundColor: "#3667c4" },
  btnDanger: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,120,120,.25)" },
});
