import { useState } from "react";
import type { DesafioSocial, ObjetivoDesafio, ParticipanteDesafio, ProgressoDesafio } from "@project-fox/types";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useCriar } from "../criar/useCriar";
import { CheckIcon, ChecklistIcon, ClockIcon, CloseIcon, UsersIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar } from "./Avatar";
import type { RelatorioDesafio } from "./useDesafios";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00`));
}

export function ChallengeDetail({
  challenge, userId, estacaoId, participants, objectives, progress, reports, pending, onClose, onProve,
}: {
  challenge: DesafioSocial | null;
  userId: string;
  estacaoId?: string;
  participants: ParticipanteDesafio[];
  objectives: ObjetivoDesafio[];
  progress: ProgressoDesafio[];
  reports: RelatorioDesafio[];
  pending: boolean;
  onClose: () => void;
  onProve: (objectiveId: string, reportId: string) => void;
}) {
  const { addRelatorio } = useCriar();
  const [selectedReports, setSelectedReports] = useState<Record<string, string>>({});
  const [newReport, setNewReport] = useState("");

  if (!challenge) return null;

  const accepted = participants.filter((p) => p.status === "aceito");
  const ownProgress = new Map(progress.filter((p) => p.userId === userId).map((p) => [p.objetivoId, p]));
  const totalProofs = (uid: string) => progress.filter((p) => p.userId === uid && objectives.some((o) => o.id === p.objetivoId)).length;

  function sendReport() {
    if (!estacaoId || !newReport.trim()) return;
    addRelatorio.mutate({ planetaId: estacaoId, conteudo: newReport.trim() }, { onSuccess: () => setNewReport("") });
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.muted, fontSize: 10, textTransform: "uppercase" }}>{challenge.status}</Text>
                <Text style={typography.title}>{challenge.titulo}</Text>
                <Text style={typography.muted}>{challenge.descricao || `Prazo: ${formatDate(challenge.prazo)}`}</Text>
              </View>
              <Pressable onPress={onClose}>
                <CloseIcon size={16} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <UsersIcon size={14} color={colors.text} />
                <Text style={typography.subtitle}>Progresso do grupo</Text>
              </View>
              {accepted.map((person) => (
                <View key={person.userId} style={[styles.personRow, person.userId === userId && styles.personRowMe]}>
                  <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
                  <Text style={[typography.body, { flex: 1 }]}>{person.userId === userId ? "Você" : person.nome}</Text>
                  <Text style={typography.muted}>{totalProofs(person.userId)}/{objectives.length}</Text>
                  {person.concluidoEm && <CheckIcon size={13} color={colors.green} />}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <ChecklistIcon size={14} color={colors.text} />
                <Text style={typography.subtitle}>Seu checklist</Text>
              </View>
              {objectives.map((objective, i) => {
                const done = ownProgress.has(objective.id);
                const selected = selectedReports[objective.id] ?? "";
                return (
                  <View key={objective.id} style={[styles.objRow, done && styles.objRowDone]}>
                    <View style={styles.objHead}>
                      <View style={[styles.objIndex, done && styles.objIndexDone]}>
                        {done ? <CheckIcon size={10} color={colors.bg0} /> : <Text style={{ color: colors.muted, fontSize: 11 }}>{i + 1}</Text>}
                      </View>
                      <Text style={[typography.body, { flex: 1 }]}>{objective.titulo}</Text>
                    </View>
                    {done ? (
                      <Text style={typography.muted}>Comprovado com relatório</Text>
                    ) : reports.length ? (
                      <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                          {reports.map((r) => (
                            <Pressable
                              key={r.id}
                              style={[styles.reportOpt, selected === r.id && styles.reportOptSel]}
                              onPress={() => setSelectedReports((v) => ({ ...v, [objective.id]: r.id }))}
                            >
                              <Text style={typography.body} numberOfLines={1}>{r.conteudo.slice(0, 40)}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                        <Pressable
                          style={[styles.proveBtn, (!selected || pending) && { opacity: 0.5 }]}
                          disabled={!selected || pending}
                          onPress={() => onProve(objective.id, selected)}
                        >
                          <Text style={typography.body}>Comprovar</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Text style={[typography.muted, { marginTop: 4 }]}>Escreva um relatório na estação abaixo para comprovar.</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {estacaoId && (
              <View style={styles.section}>
                <Text style={typography.subtitle}>Novo relatório da estação</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={newReport}
                  onChangeText={setNewReport}
                  multiline
                  placeholder="O que você fez pra avançar nesse desafio?"
                  placeholderTextColor={colors.muted}
                />
                <Pressable style={styles.sendBtn} onPress={sendReport} disabled={!newReport.trim() || addRelatorio.isPending}>
                  <Text style={[typography.body, { fontWeight: "600" }]}>Enviar relatório</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.footer}>
              <ClockIcon size={12} color={colors.muted} />
              <Text style={typography.muted}>Prazo em {formatDate(challenge.prazo)} · cada pessoa comprova o próprio checklist.</Text>
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
  head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  section: { gap: spacing.xs },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  personRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  personRowMe: { backgroundColor: "rgba(110,168,255,0.08)", borderRadius: radius.sm, paddingHorizontal: 6 },
  objRow: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs },
  objRowDone: { opacity: 0.6 },
  objHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  objIndex: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  objIndexDone: { backgroundColor: colors.green, borderColor: colors.green },
  reportOpt: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 8, marginRight: spacing.xs, maxWidth: 160 },
  reportOptSel: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
  proveBtn: { alignSelf: "flex-start", marginTop: 6, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 12 },
  input: { backgroundColor: "rgba(8,14,32,0.8)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.text, padding: 10 },
  textarea: { minHeight: 60, textAlignVertical: "top" },
  sendBtn: { alignItems: "center", backgroundColor: "#3667c4", borderRadius: radius.md, paddingVertical: 10 },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.lg },
});
