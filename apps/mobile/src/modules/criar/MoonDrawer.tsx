import { useState } from "react";
import type { Foto, Planeta, Recurso, Relatorio } from "@project-fox/types";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CloseIcon, ExtIcon, PlusIcon } from "../../icons/index";
import { capFirst } from "../../lib/currentMonth";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { MOON_STYLE } from "./criarConstants";
import { weeklyCount, health } from "./useCriar";
import { useCriar } from "./useCriar";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return capFirst(d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })) + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function statusText(h: number): [string, string] {
  if (h >= 0.99) return ["Órbita estável", "#7ef0b2"];
  if (h >= 0.6) return ["Órbita regular", "#9fc3ff"];
  if (h > 0.25) return ["Desacelerando…", "#ffd27d"];
  if (h > 0) return ["Perdendo a cor", "#ff9d7d"];
  return ["Órbita quase parada", "#8fa3c8"];
}

export function MoonDrawer({
  planeta, moonId, relatorios, recursos, fotos, onClose,
}: {
  planeta: Planeta | null;
  moonId: string | null;
  relatorios: Relatorio[];
  recursos: Recurso[];
  fotos: Foto[];
  onClose: () => void;
}) {
  const { userId, addRelatorio, addRecurso, addFoto } = useCriar();
  const [repText, setRepText] = useState("");

  if (!planeta || !moonId) return null;
  const st = MOON_STYLE[moonId];
  const Icon = st.icon;

  const planetRelatorios = relatorios.filter((r) => r.planetaId === planeta.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const planetRecursos = recursos.filter((r) => r.planetaId === planeta.id);
  const planetFotos = fotos.filter((f) => f.planetaId === planeta.id);

  const h = health(planeta, relatorios);
  const [statusTxt, statusCol] = statusText(h);

  function sendReport() {
    const v = repText.trim();
    if (!v) return;
    addRelatorio.mutate({ planetaId: planeta!.id, conteudo: v }, { onSuccess: () => setRepText("") });
  }

  async function pickRecurso() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    addRecurso.mutate({ planetaId: planeta!.id, uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType || "application/octet-stream" });
  }

  async function pickFoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop()?.split("?")[0] || "jpg";
    addFoto.mutate({ planetaId: planeta!.id, uri: asset.uri, fileName: `foto.${ext}`, mimeType: asset.mimeType || "image/jpeg" });
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.head}>
            <Icon size={18} color={st.col} />
            <View style={{ flex: 1 }}>
              <Text style={typography.subtitle}>Lua de {st.label}</Text>
              <Text style={typography.muted}>Planeta {planeta.nome}</Text>
            </View>
            <Pressable onPress={onClose}>
              <CloseIcon size={16} color={colors.muted} />
            </Pressable>
          </View>

          {moonId === "relatorio" && (
            <ScrollView contentContainerStyle={{ gap: spacing.md }}>
              <View style={styles.chip}>
                <View style={[styles.dot, { backgroundColor: statusCol }]} />
                <Text style={typography.muted}>
                  {weeklyCount(planeta.id, relatorios, userId)}/{planeta.metaSemanal} nesta semana · <Text style={{ color: statusCol }}>{statusTxt}</Text>
                </Text>
              </View>
              {!planetRelatorios.length && <Text style={[typography.muted, styles.empty]}>Nenhum relatório ainda. Escreva o primeiro e veja o planeta ganhar vida.</Text>}
              {planetRelatorios.map((r) => (
                <View key={r.id} style={styles.entry}>
                  <Text style={typography.muted}>{fmtDate(r.createdAt)}</Text>
                  <Text style={typography.body}>{r.conteudo}</Text>
                </View>
              ))}
              <TextInput
                style={[styles.input, styles.textarea]}
                value={repText}
                onChangeText={setRepText}
                multiline
                placeholder={`Como foi hoje em ${planeta.nome}?`}
                placeholderTextColor={colors.muted}
              />
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={sendReport} disabled={addRelatorio.isPending}>
                <Text style={[typography.body, { fontWeight: "600" }]}>Enviar relatório</Text>
              </Pressable>
            </ScrollView>
          )}

          {moonId === "recursos" && (
            <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
              {!planetRecursos.length && <Text style={[typography.muted, styles.empty]}>Biblioteca vazia. Guarde livros e materiais para acessar de qualquer dispositivo.</Text>}
              {planetRecursos.map((r) => (
                <Pressable key={r.id} style={styles.resItem} onPress={() => Linking.openURL(r.arquivoUrl)}>
                  <ExtIcon size={14} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={typography.body} numberOfLines={1}>{r.nome}</Text>
                    <Text style={typography.muted}>{r.tipo}</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={pickRecurso}>
                <PlusIcon size={13} color={colors.text} />
                <Text style={[typography.body, { fontWeight: "600" }]}>Adicionar recurso</Text>
              </Pressable>
            </ScrollView>
          )}

          {moonId === "fotos" && (
            <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
              {!planetFotos.length && <Text style={[typography.muted, styles.empty]}>Nenhuma foto ainda. Registre suas atividades para lembrar delas no futuro.</Text>}
              <View style={styles.photoGrid}>
                {planetFotos.map((f) => (
                  <Image key={f.id} source={{ uri: f.url }} style={styles.photo} />
                ))}
              </View>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={pickFoto}>
                <PlusIcon size={13} color={colors.text} />
                <Text style={[typography.body, { fontWeight: "600" }]}>Adicionar foto</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", justifyContent: "flex-end" },
  card: { maxHeight: "85%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { fontStyle: "italic", textAlign: "center", paddingVertical: spacing.md },
  entry: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: spacing.sm, gap: 4 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  textarea: { minHeight: 70, textAlignVertical: "top" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
  resItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photo: { width: 90, height: 90, borderRadius: radius.sm },
});
