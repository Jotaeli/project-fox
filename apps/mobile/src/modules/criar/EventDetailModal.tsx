import { useState } from "react";
import type { Evento, Relatorio } from "@project-fox/types";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CheckIcon, ClockIcon, ReportIcon } from "../../icons/index";
import { deadlineUrgency, fmtDeadlineShort } from "../../lib/currentMonth";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { GOAL_ICON_MAP, hueOf } from "./criarConstants";
import { derivedStatus, eventProgress, useCriar } from "./useCriar";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const URGENCY_COLOR: Record<string, string> = {
  atrasado: colors.danger, urgent: "#ff8f8f", warn: colors.gold, "": colors.muted,
};

export function EventDetailModal({
  evento, relatorios, onClose, onCompleted,
}: {
  evento: Evento | null;
  relatorios: Relatorio[];
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { userId, attachProof } = useCriar();
  const [attachIdx, setAttachIdx] = useState<number | null>(null);

  if (!evento) return null;
  const status = derivedStatus(evento);
  const pr = eventProgress(evento);
  const hue = hueOf(evento.cor);
  const Icon = GOAL_ICON_MAP[evento.icone] ?? ReportIcon;
  const planetReports = relatorios.filter((r) => r.planetaId === evento.planetaId && r.autorId === userId).slice(0, 6);
  const urgency = evento.prazo ? deadlineUrgency(evento.prazo) : "";

  function pick(checklistItemId: string, relatorioId: string) {
    attachProof.mutate(
      { checklistItemId, relatorioId, evento: evento! },
      { onSuccess: (res) => { setAttachIdx(null); if (res.completed) onCompleted(); } }
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
            <View style={styles.head}>
              <View style={[styles.iconChip, { backgroundColor: `hsla(${hue},60%,55%,0.15)` }]}>
                <Icon size={18} color={`hsl(${hue},75%,72%)`} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.subtitle}>{evento.titulo}</Text>
                <Text style={typography.muted}>{pr.done}/{pr.total} objetivos</Text>
              </View>
            </View>

            {status === "ativo" && (
              <View style={styles.statusRow}>
                <ClockIcon size={12} color={URGENCY_COLOR[urgency]} />
                <Text style={{ color: URGENCY_COLOR[urgency], fontSize: 11 }}>até {fmtDeadlineShort(evento.prazo)}</Text>
              </View>
            )}
            {status === "concluido" && <Text style={{ color: colors.green, fontSize: 11 }}>Concluída{evento.concluidoEm ? ` em ${fmtDateTime(evento.concluidoEm)}` : ""}</Text>}
            {status === "falha" && <Text style={{ color: colors.danger, fontSize: 11 }}>Falhou — prazo até {fmtDeadlineShort(evento.prazo)}</Text>}

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pr.pct * 100}%`, backgroundColor: `hsl(${hue},65%,58%)` }]} />
            </View>

            {evento.checklist.map((c, i) => (
              <View key={c.id} style={[styles.evItem, c.comprovado && styles.evItemDone]}>
                <View style={styles.evItemHead}>
                  <View style={[styles.evCheck, c.comprovado && { backgroundColor: colors.green, borderColor: colors.green }]}>
                    {c.comprovado && <CheckIcon size={10} color={colors.bg0} />}
                  </View>
                  <Text style={[typography.body, { flex: 1 }]}>{c.titulo}</Text>
                  {!c.comprovado && status === "ativo" && evento.autorId === userId && (
                    <Pressable onPress={() => setAttachIdx(attachIdx === i ? null : i)}>
                      <Text style={{ color: colors.accent, fontSize: 11 }}>Anexar relatório</Text>
                    </Pressable>
                  )}
                </View>
                {attachIdx === i && (
                  <View style={styles.picker}>
                    {planetReports.length ? planetReports.map((r) => (
                      <Pressable key={r.id} style={styles.pick} onPress={() => pick(c.id, r.id)}>
                        <Text style={typography.muted}>{fmtDateTime(r.createdAt)}</Text>
                        <Text style={typography.body} numberOfLines={1}>{r.conteudo.slice(0, 64)}</Text>
                      </Pressable>
                    )) : <Text style={[typography.muted, { fontStyle: "italic" }]}>Nenhum relatório neste planeta ainda.</Text>}
                  </View>
                )}
              </View>
            ))}

            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={typography.body}>Fechar</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3,6,16,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: { width: 400, maxWidth: "100%", maxHeight: "85%", backgroundColor: colors.panelSolid, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconChip: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  progressTrack: { height: 6, borderRadius: 99, backgroundColor: "rgba(148,180,255,.12)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  evItem: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: spacing.sm, gap: spacing.xs },
  evItemDone: { opacity: 0.6 },
  evItemHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  evCheck: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  picker: { gap: 6, marginTop: 4 },
  pick: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 8 },
  btn: { paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: "center", marginTop: spacing.sm },
});
