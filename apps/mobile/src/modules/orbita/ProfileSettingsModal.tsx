import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { CloseIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar, errorMessage } from "./Avatar";
import { useOrbita } from "./useOrbita";

const TOGGLES: [string, string][] = [
  ["descobrivel", "Permitir que encontrem meu @"],
  ["aceitaCutucadas", "Aceitar cutucadas"],
  ["mostrarPlanetaFavorito", "Mostrar planeta favorito"],
  ["mostrarMetaPrincipal", "Mostrar meta principal"],
  ["mostrarEventos", "Mostrar eventos ativos"],
  ["mostrarWishlist", "Mostrar destaque da wishlist"],
  ["mostrarStreak", "Aparecer no ranking de streak"],
];

export function ProfileSettingsModal({ visible, userId, onClose }: { visible: boolean; userId: string; onClose: () => void }) {
  const data = useOrbita(userId);
  const profile = data.profile.data;
  const planets = data.planets.data ?? [];
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (profile) setForm({ ...profile, handle: profile.handle ?? "", bio: profile.bio ?? "", planetaFavoritoId: profile.planetaFavoritoId ?? "" });
  }, [profile?.id, visible]);

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      await data.uploadAvatar.mutateAsync({ uri: asset.uri, mimeType: asset.mimeType || "image/jpeg" });
    } catch (e) {
      Alert.alert(errorMessage(e));
    }
  }

  async function save() {
    if (!form.nome?.trim()) { Alert.alert("Dê um nome pro seu perfil."); return; }
    if (form.handle && form.handle.length < 3) { Alert.alert("O @ precisa ter pelo menos 3 caracteres."); return; }
    try {
      await data.updateProfile.mutateAsync({ ...form, handle: form.handle || null, bio: form.bio || null, planetaFavoritoId: form.planetaFavoritoId || null });
      onClose();
    } catch (e) {
      Alert.alert(errorMessage(e));
    }
  }

  if (!profile) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.head}>
              <View>
                <Text style={typography.subtitle}>Seu perfil na Órbita</Text>
                <Text style={typography.muted}>Escolha como seus amigos enxergam você.</Text>
              </View>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.avatarRow}>
              <Avatar name={profile.nome} url={profile.avatarUrl} size="lg" />
              <Pressable style={styles.smallBtn} onPress={pickAvatar}>
                <Text style={typography.body}>Trocar foto</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput style={styles.input} value={form.nome ?? ""} onChangeText={(v) => set("nome", v)} maxLength={40} placeholderTextColor={colors.muted} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Identificador</Text>
              <View style={styles.handleRow}>
                <Text style={typography.muted}>@</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={form.handle ?? ""}
                  onChangeText={(v) => set("handle", v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={20}
                  autoCapitalize="none"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.bio ?? ""}
                onChangeText={(v) => set("bio", v)}
                maxLength={160}
                multiline
                placeholder="O que você está colocando em movimento?"
                placeholderTextColor={colors.muted}
              />
            </View>

            {planets.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.label}>Planeta favorito</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Pressable style={[styles.planetOpt, !form.planetaFavoritoId && styles.planetOptSel]} onPress={() => set("planetaFavoritoId", "")}>
                    <Text style={typography.body}>Nenhum</Text>
                  </Pressable>
                  {planets.map((p) => (
                    <Pressable key={p.id} style={[styles.planetOpt, form.planetaFavoritoId === p.id && styles.planetOptSel]} onPress={() => set("planetaFavoritoId", p.id)}>
                      <Text style={typography.body}>{p.nome}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.field}>
              {TOGGLES.map(([key, label]) => (
                <View key={key} style={styles.toggleRow}>
                  <Text style={[typography.body, { flex: 1 }]}>{label}</Text>
                  <Switch value={Boolean(form[key])} onValueChange={(v) => set(key, v)} />
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={onClose}>
                <Text style={typography.body}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={data.updateProfile.isPending}>
                <Text style={[typography.body, { fontWeight: "600" }]}>Salvar perfil</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", justifyContent: "flex-end" },
  card: { maxHeight: "90%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  smallBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12 },
  field: { gap: spacing.xs },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  textarea: { minHeight: 60, textAlignVertical: "top" },
  handleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  planetOpt: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 12, marginRight: spacing.xs },
  planetOptSel: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginBottom: spacing.lg },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
});
