import { useState } from "react";
import type { TierWishlist } from "@project-fox/types";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { GradientButton } from "../../../components/GradientButton";
import { ImageIcon } from "../../../icons/index";
import { colors, radius, shadow, spacing, typography } from "../../../theme/theme";
import { TIER_ORDER, TIERS } from "./wishConstants";
import { useWishlist, type NovaFoto } from "./useWishlist";

export function WishModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addItem } = useWishlist();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [tier, setTier] = useState<TierWishlist>("A");
  const [foto, setFoto] = useState<NovaFoto | null>(null);

  async function pickFoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop()?.split("?")[0] || "jpg";
    setFoto({ uri: asset.uri, ext, mimeType: asset.mimeType || "image/jpeg" });
  }

  function reset() {
    setNome(""); setValor(""); setDesc(""); setLink(""); setTier("A"); setFoto(null);
  }

  function submit() {
    if (!nome.trim()) {
      Alert.alert("Dê um nome pro desejo.");
      return;
    }
    addItem.mutate(
      { nome: nome.trim(), valor: Number(valor) || 0, tier, descricao: desc.trim() || undefined, link: link.trim() || undefined, foto },
      { onSuccess: () => { reset(); onClose(); } }
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <Text style={typography.subtitle}>Novo desejo</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                maxLength={40}
                placeholder="Ex.: Microfone Shure MV7"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Valor</Text>
              <TextInput
                style={styles.input}
                value={valor}
                onChangeText={setValor}
                keyboardType="numeric"
                placeholder="R$"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Foto</Text>
              <Pressable style={styles.photoBtn} onPress={pickFoto}>
                <ImageIcon size={14} color={colors.text} />
                <Text style={typography.body}>{foto ? "Trocar foto" : "Escolher foto"}</Text>
              </Pressable>
              {foto && <Image source={{ uri: foto.uri }} style={styles.preview} />}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={desc}
                onChangeText={setDesc}
                maxLength={200}
                multiline
                placeholder="Por que você quer isso?"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Link de compra (opcional)</Text>
              <TextInput
                style={styles.input}
                value={link}
                onChangeText={setLink}
                placeholder="https://…"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tier inicial</Text>
              <View style={styles.tierSelect}>
                {TIER_ORDER.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => setTier(key)}
                    style={[
                      styles.tierOpt,
                      { borderColor: TIERS[key].c },
                      tier === key && { backgroundColor: TIERS[key].bg1 },
                    ]}
                  >
                    <Text style={{ color: tier === key ? TIERS[key].c : colors.muted, fontWeight: "700" }}>{key}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={onClose}>
                <Text style={typography.body}>Cancelar</Text>
              </Pressable>
              <GradientButton style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={addItem.isPending}>
                <Text style={[typography.body, { fontWeight: "600" }]}>Adicionar desejo</Text>
              </GradientButton>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", justifyContent: "flex-end" },
  card: { ...shadow.modal,
    maxHeight: "88%",
    backgroundColor: colors.panelSolid,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  field: { gap: spacing.xs },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    backgroundColor: "rgba(8,14,32,0.8)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    color: colors.text,
    padding: 10,
  },
  textarea: { minHeight: 70, textAlignVertical: "top" },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  preview: { width: 80, height: 80, borderRadius: 10, marginTop: spacing.sm },
  tierSelect: { flexDirection: "row", gap: spacing.sm },
  tierOpt: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginBottom: spacing.lg },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { borderColor: "rgba(148,180,255,0.4)" },
});
