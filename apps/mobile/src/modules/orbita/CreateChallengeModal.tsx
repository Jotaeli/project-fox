import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CheckIcon, CloseIcon, PlusIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar } from "./Avatar";
import type { FriendSummary } from "./useOrbita";

const COLORS = ["#7c72e8", "#4aa8d8", "#e174a7", "#e0a855", "#52b98a"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CreateChallengeModal({
  visible, friends, pending, onClose, onCreate,
}: {
  visible: boolean;
  friends: FriendSummary[];
  pending: boolean;
  onClose: () => void;
  onCreate: (input: { titulo: string; descricao?: string; icone: string; cor: string; prazo: string; objetivos: string[]; convidados: string[] }) => void;
}) {
  const min = new Date(); min.setDate(min.getDate() + 7);
  const max = new Date(); max.setDate(max.getDate() + 93);
  const initial = new Date(); initial.setDate(initial.getDate() + 30);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(iso(initial));
  const [color, setColor] = useState(COLORS[0]);
  const [objectives, setObjectives] = useState([""]);
  const [invited, setInvited] = useState<string[]>([]);

  const valid = title.trim() && objectives.some((o) => o.trim()) && invited.length > 0 && deadline >= iso(min) && deadline <= iso(max);

  function reset() {
    setTitle(""); setDescription(""); setDeadline(iso(initial)); setColor(COLORS[0]); setObjectives([""]); setInvited([]);
  }

  function submit() {
    if (!valid) return;
    onCreate({
      titulo: title.trim(), descricao: description.trim() || undefined, icone: "alvo", cor: color, prazo: deadline,
      objetivos: objectives.filter((o) => o.trim()).map((o) => o.trim()), convidados: invited,
    });
    reset();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.head}>
              <View>
                <Text style={typography.subtitle}>Novo desafio</Text>
                <Text style={typography.muted}>Todos recebem o mesmo checklist e comprovam o próprio progresso.</Text>
              </View>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Título</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={60} placeholder="Ex.: 30 dias colocando o projeto no ar" placeholderTextColor={colors.muted} autoFocus />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} maxLength={240} multiline placeholder="Por que vocês querem cumprir isso juntos?" placeholderTextColor={colors.muted} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Prazo (AAAA-MM-DD, entre {iso(min)} e {iso(max)})</Text>
              <TextInput style={styles.input} value={deadline} onChangeText={setDeadline} placeholder={iso(initial)} placeholderTextColor={colors.muted} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cor</Text>
              <View style={styles.colorRow}>
                {COLORS.map((c) => (
                  <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, c === color && styles.colorDotSel]} />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Checklist de cada participante</Text>
              {objectives.map((objective, i) => (
                <View key={i} style={styles.objRow}>
                  <Text style={typography.muted}>{i + 1}.</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={objective}
                    onChangeText={(v) => setObjectives((list) => list.map((val, x) => (x === i ? v : val)))}
                    maxLength={100}
                    placeholder="Objetivo comprovável"
                    placeholderTextColor={colors.muted}
                  />
                  {objectives.length > 1 && (
                    <Pressable onPress={() => setObjectives((list) => list.filter((_, x) => x !== i))}>
                      <CloseIcon size={12} color={colors.muted} />
                    </Pressable>
                  )}
                </View>
              ))}
              <Pressable style={styles.addObjBtn} onPress={() => setObjectives((list) => [...list, ""])}>
                <PlusIcon size={12} color={colors.text} />
                <Text style={typography.body}>Adicionar objetivo</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Convidar amigos</Text>
              <View style={styles.friendGrid}>
                {friends.map((friend) => {
                  const sel = invited.includes(friend.userId);
                  return (
                    <Pressable
                      key={friend.userId}
                      style={[styles.friendChip, sel && styles.friendChipSel]}
                      onPress={() => setInvited((ids) => (ids.includes(friend.userId) ? ids.filter((id) => id !== friend.userId) : [...ids, friend.userId]))}
                    >
                      <Avatar name={friend.nome} url={friend.avatarUrl} size="sm" />
                      <Text style={typography.body}>{friend.nome}</Text>
                      {sel && <CheckIcon size={12} color={colors.accent} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={onClose}>
                <Text style={typography.body}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={!valid || pending}>
                <Text style={[typography.body, { fontWeight: "600" }]}>Criar e convidar</Text>
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
  card: { maxHeight: "92%", backgroundColor: colors.panelSolid, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  field: { gap: spacing.xs },
  label: { fontSize: 11.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  textarea: { minHeight: 60, textAlignVertical: "top" },
  colorRow: { flexDirection: "row", gap: spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  colorDotSel: { borderColor: "#fff" },
  objRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  addObjBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 9, marginTop: spacing.xs },
  friendGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  friendChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  friendChipSel: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginBottom: spacing.lg },
  btn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  btnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
});
