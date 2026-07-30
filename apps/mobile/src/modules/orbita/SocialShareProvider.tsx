import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { TipoPostagem } from "@project-fox/types";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { useAuth } from "../../auth/AuthContext";
import { CloseIcon, OrbitIcon, SendIcon } from "../../icons/index";
import { supabase } from "../../lib/supabaseClient";
import { colors, radius, shadow, spacing, typography } from "../../theme/theme";

export interface ShareMilestone {
  tipo: Exclude<TipoPostagem, "texto">;
  texto: string;
  dados: Record<string, unknown>;
  planetaId?: string;
  eventoId?: string;
  itemWishlistId?: string;
}

const ShareContext = createContext<(milestone: ShareMilestone) => void>(() => {});

export function SocialShareProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [milestone, setMilestone] = useState<ShareMilestone | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  const offer = useCallback((next: ShareMilestone) => {
    setMilestone(next);
    setText(next.texto);
  }, []);

  async function share() {
    if (!session || !milestone) return;
    setPending(true);
    const { error } = await supabase.from("postagens").insert({
      user_id: session.user.id,
      tipo: milestone.tipo,
      texto: text.trim() || null,
      visibilidade: "amigos",
      dados: milestone.dados,
      planeta_id: milestone.planetaId ?? null,
      evento_id: milestone.eventoId ?? null,
      item_wishlist_id: milestone.itemWishlistId ?? null,
    });
    setPending(false);
    if (error) { Alert.alert(error.message); return; }
    setMilestone(null);
    Alert.alert("Conquista compartilhada com sua órbita.");
  }

  return (
    <ShareContext.Provider value={offer}>
      {children}
      <Modal visible={!!milestone} transparent animationType="fade" onRequestClose={() => setMilestone(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMilestone(null)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.head}>
              <View style={styles.headTitleRow}>
                <OrbitIcon size={16} color="#aaa7ef" />
                <Text style={typography.subtitle}>Compartilhar conquista?</Text>
              </View>
              <Pressable onPress={() => setMilestone(null)}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={typography.muted}>O app preparou o texto, mas só publica se você confirmar.</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={text}
              onChangeText={setText}
              maxLength={500}
              multiline
              placeholderTextColor={colors.muted}
            />
            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={() => setMilestone(null)}>
                <Text style={typography.body}>Agora não</Text>
              </Pressable>
              <GradientButton style={[styles.btn, styles.btnPrimary]} onPress={share} disabled={pending}>
                <SendIcon size={13} color={colors.text} />
                <Text style={[typography.body, { fontWeight: "600" }]}>Compartilhar</Text>
              </GradientButton>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ShareContext.Provider>
  );
}

export function useOfferSocialShare() {
  return useContext(ShareContext);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: { ...shadow.modal, width: 400, maxWidth: "100%", backgroundColor: colors.panelSolid, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { borderColor: "rgba(148,180,255,0.4)" },
});
