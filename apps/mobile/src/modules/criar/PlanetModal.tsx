import { useState } from "react";
import Slider from "@react-native-community/slider";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { CameraIcon, LibraryIcon, ReportIcon, SparkIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { COLOR_NAMES, HUES, PLANET_TYPES, type TipoPlanetaKey } from "./criarConstants";
import { useCriar } from "./useCriar";

export function PlanetModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { addPlaneta } = useCriar();
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [hue, setHue] = useState(HUES[0]);
  const [tipo, setTipo] = useState<TipoPlanetaKey>("rochoso");
  const [temRecursos, setTemRecursos] = useState(false);
  const [temFotos, setTemFotos] = useState(false);
  const [meta, setMeta] = useState(3);

  function reset() {
    setNome(""); setObjetivo(""); setDescricao(""); setHue(HUES[0]); setTipo("rochoso");
    setTemRecursos(false); setTemFotos(false); setMeta(3);
  }

  function submit() {
    const nomeClean = nome.trim();
    if (!nomeClean) { Alert.alert("Dê um nome pra área."); return; }
    addPlaneta.mutate(
      { nome: nomeClean, cor: String(hue), tipo, objetivoPrincipal: objetivo.trim(), descricao: descricao.trim() || undefined, metaSemanal: meta, temRecursos, temFotos },
      { onSuccess: (p) => { reset(); onCreated(p.id); } }
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <Text style={typography.subtitle}>Novo planeta</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nome da área</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome} maxLength={24} placeholder="Ex.: Esporte, Leitura, Música…" placeholderTextColor={colors.muted} autoFocus />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Objetivo principal</Text>
              <TextInput style={styles.input} value={objetivo} onChangeText={setObjetivo} maxLength={60} placeholder="Ex.: Ler 12 livros no ano" placeholderTextColor={colors.muted} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput style={[styles.input, styles.textarea]} value={descricao} onChangeText={setDescricao} maxLength={140} multiline placeholder="Por que essa área importa pra você?" placeholderTextColor={colors.muted} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cor</Text>
              <View style={styles.swatches}>
                {HUES.map((h) => (
                  <Pressable key={h} onPress={() => setHue(h)} style={[styles.swatch, { backgroundColor: `hsl(${h},65%,55%)` }, hue === h && styles.swatchSel]} />
                ))}
              </View>
              <Text style={typography.muted}>{COLOR_NAMES[hue]}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeGrid}>
                {PLANET_TYPES.map((t) => (
                  <Pressable key={t.id} onPress={() => setTipo(t.id)} style={[styles.typeCard, tipo === t.id && styles.typeCardSel]}>
                    <View style={[styles.typeSwatch, { backgroundColor: `hsl(${hue},55%,50%)` }]} />
                    <Text style={typography.body}>{t.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Luas</Text>
              <View style={styles.moonOpt}>
                <ReportIcon size={16} color="#8fd0ff" />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>Relatório</Text>
                  <Text style={typography.muted}>Seus diários sobre esta área</Text>
                </View>
                <Text style={[typography.muted, { fontSize: 10 }]}>obrigatória</Text>
              </View>
              <View style={styles.moonOpt}>
                <LibraryIcon size={16} color="#ffcf7d" />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>Recursos</Text>
                  <Text style={typography.muted}>Livros, arquivos e materiais</Text>
                </View>
                <Switch value={temRecursos} onValueChange={setTemRecursos} />
              </View>
              <View style={styles.moonOpt}>
                <CameraIcon size={16} color="#d3a6ff" />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>Fotos</Text>
                  <Text style={typography.muted}>Registros visuais das atividades</Text>
                </View>
                <Switch value={temFotos} onValueChange={setTemFotos} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Meta de relatórios</Text>
              <Slider minimumValue={1} maximumValue={7} step={1} value={meta} onValueChange={setMeta} minimumTrackTintColor={colors.accent} />
              <Text style={typography.muted}>
                <SparkIcon size={11} color={colors.gold} /> {meta}× por semana {meta === 7 ? "(todo dia)" : meta === 1 ? "(bem tranquilo)" : ""}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={onClose}>
                <Text style={typography.body}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={addPlaneta.isPending}>
                <Text style={[typography.body, { fontWeight: "600" }]}>Criar planeta</Text>
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
  field: { gap: spacing.xs },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  textarea: { minHeight: 60, textAlignVertical: "top" },
  swatches: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  swatch: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: "transparent" },
  swatchSel: { borderColor: "#fff" },
  typeGrid: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  typeCard: { alignItems: "center", gap: 6, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, width: 78 },
  typeCardSel: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.1)" },
  typeSwatch: { width: 30, height: 30, borderRadius: 15 },
  moonOpt: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginBottom: spacing.lg },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
});
