import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar } from "./Avatar";
import { DesafiosTab } from "./DesafiosTab";
import { FeedTab } from "./FeedTab";
import { FriendsTab } from "./FriendsTab";
import { NotificationsTab } from "./NotificationsTab";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { PublicProfileModal } from "./PublicProfileModal";
import { useOrbita, type FriendSummary } from "./useOrbita";

type Tab = "feed" | "amigos" | "desafios" | "notificacoes";

const TABS: { key: Tab; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "amigos", label: "Amigos" },
  { key: "desafios", label: "Desafios" },
  { key: "notificacoes", label: "Notificações" },
];

export function OrbitaScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const data = useOrbita(userId);
  const [tab, setTab] = useState<Tab>("feed");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendSummary | null>(null);

  return (
    <View style={styles.screen}>
      <View style={styles.topbar}>
        <Pressable style={styles.selfBtn} onPress={() => setSettingsOpen(true)}>
          <Avatar name={data.profile.data?.nome ?? "Você"} url={data.profile.data?.avatarUrl} size="sm" />
          <View>
            <Text style={typography.body}>{data.profile.data?.nome ?? "Seu perfil"}</Text>
            <Text style={typography.muted}>{data.profile.data?.handle ? `@${data.profile.data.handle}` : "Escolha seu @"}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.segmented}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={[styles.segment, tab === t.key && styles.segmentSel]} onPress={() => setTab(t.key)}>
            <Text style={[typography.body, tab === t.key && { color: colors.text, fontWeight: "600" }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "feed" && <FeedTab userId={userId} />}
      {tab === "amigos" && <FriendsTab userId={userId} onOpenProfile={setSelectedFriend} />}
      {tab === "desafios" && <DesafiosTab friends={(data.relations.data ?? []).filter((r) => r.direction === "friend")} />}
      {tab === "notificacoes" && <NotificationsTab userId={userId} />}

      <ProfileSettingsModal visible={settingsOpen} userId={userId} onClose={() => setSettingsOpen(false)} />
      <PublicProfileModal userId={userId} friend={selectedFriend} onClose={() => setSelectedFriend(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  topbar: { padding: spacing.lg, paddingBottom: spacing.sm },
  selfBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  segmented: {
    flexDirection: "row", marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.panel, borderRadius: radius.md, padding: 4, gap: 4,
  },
  segment: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm },
  segmentSel: { backgroundColor: "rgba(110,168,255,0.18)" },
});
