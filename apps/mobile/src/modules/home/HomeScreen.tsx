import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { LogoutIcon } from "../../icons/index";
import { supabase } from "../../lib/supabaseClient";
import { colors, spacing, typography } from "../../theme/theme";

function saudacao() {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function HomeScreen() {
  const { session } = useAuth();
  const nome = (session?.user.user_metadata?.nome as string | undefined) || session?.user.email || "";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={typography.muted}>{saudacao()},</Text>
          <Text style={typography.title}>{nome}</Text>
        </View>
        <Pressable style={styles.logout} onPress={() => supabase.auth.signOut()}>
          <LogoutIcon size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.empty}>
        <Text style={typography.subtitle}>Rotina, Anotar, Criar e Órbita chegam nas próximas sub-fases.</Text>
        <Text style={[typography.muted, styles.emptyBody]}>
          Por enquanto, esta tela confirma que login, sessão e navegação estão funcionando.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0, padding: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xl },
  logout: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.lg },
  emptyBody: { textAlign: "center", lineHeight: 20 },
});
