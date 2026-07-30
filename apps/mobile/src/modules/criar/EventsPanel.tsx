import { useState } from "react";
import type { Evento, Planeta } from "@project-fox/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevIcon, ReportIcon, TargetIcon } from "../../icons/index";
import { deadlineUrgency, fmtDeadlineShort } from "../../lib/currentMonth";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { GOAL_ICON_MAP, hueOf } from "./criarConstants";
import { derivedStatus, eventProgress } from "./useCriar";

const URGENCY_COLOR: Record<string, string> = {
  atrasado: colors.danger, urgent: "#ff8f8f", warn: colors.gold, "": colors.muted,
};

export function EventsPanel({ planetas, eventos, onSelect }: { planetas: Planeta[]; eventos: Evento[]; onSelect: (planetaId: string, evento: Evento) => void }) {
  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState<"active" | "history">("active");
  const planetName = (id: string) => planetas.find((p) => p.id === id)?.nome ?? "";

  const rows = eventos.map((ev) => ({ ev, status: derivedStatus(ev) }));
  const active = rows.filter((r) => r.status === "ativo").sort((a, b) => a.ev.prazo.localeCompare(b.ev.prazo));
  const history = rows.filter((r) => r.status !== "ativo")
    .sort((a, b) => (b.ev.concluidoEm || b.ev.falhouEm || b.ev.prazo).localeCompare(a.ev.concluidoEm || a.ev.falhouEm || a.ev.prazo));

  return (
    <View style={styles.panel}>
      <Pressable style={styles.head} onPress={() => setCollapsed((v) => !v)}>
        <TargetIcon size={14} color={colors.text} />
        <Text style={typography.body}>Eventos</Text>
        <View style={styles.count}><Text style={styles.countText}>{active.length}</Text></View>
        <ChevIcon size={12} color={colors.muted} />
      </Pressable>
      {!collapsed && (
        <View style={styles.inner}>
          <View style={styles.tabs}>
            <Pressable style={[styles.tab, tab === "active" && styles.tabSel]} onPress={() => setTab("active")}>
              <Text style={typography.body}>Ativos</Text>
            </Pressable>
            <Pressable style={[styles.tab, tab === "history" && styles.tabSel]} onPress={() => setTab("history")}>
              <Text style={typography.body}>Histórico</Text>
            </Pressable>
          </View>
          <View style={styles.body}>
            {tab === "active" ? (
              active.length ? active.map(({ ev }) => {
                const pr = eventProgress(ev);
                const Icon = GOAL_ICON_MAP[ev.icone] ?? ReportIcon;
                const hue = hueOf(ev.cor);
                const urgency = deadlineUrgency(ev.prazo);
                return (
                  <Pressable key={ev.id} style={styles.row} onPress={() => onSelect(ev.planetaId, ev)}>
                    <View style={[styles.chip, { backgroundColor: `hsla(${hue},60%,55%,0.15)` }]}>
                      <Icon size={14} color={`hsl(${hue},75%,72%)`} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body} numberOfLines={1}>{ev.titulo}</Text>
                      <Text style={typography.muted} numberOfLines={1}>{planetName(ev.planetaId)} · {pr.done}/{pr.total} objetivos</Text>
                      <View style={styles.progTrack}>
                        <View style={[styles.progFill, { width: `${pr.pct * 100}%`, backgroundColor: `hsl(${hue},65%,60%)` }]} />
                      </View>
                    </View>
                    <Text style={{ color: URGENCY_COLOR[urgency], fontSize: 10 }}>{fmtDeadlineShort(ev.prazo)}</Text>
                  </Pressable>
                );
              }) : <Text style={[typography.muted, styles.empty]}>Nenhum evento ativo.</Text>
            ) : (
              history.length ? history.map(({ ev, status }) => {
                const Icon = GOAL_ICON_MAP[ev.icone] ?? ReportIcon;
                const hue = hueOf(ev.cor);
                return (
                  <Pressable key={ev.id} style={styles.row} onPress={() => onSelect(ev.planetaId, ev)}>
                    <View style={[styles.chip, { backgroundColor: `hsla(${hue},60%,55%,0.15)` }]}>
                      <Icon size={14} color={`hsl(${hue},75%,72%)`} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body} numberOfLines={1}>{ev.titulo}</Text>
                      <Text style={typography.muted} numberOfLines={1}>{planetName(ev.planetaId)}</Text>
                    </View>
                    <Text style={{ color: status === "concluido" ? colors.green : colors.danger, fontSize: 10 }}>
                      {status === "concluido" ? "Concluída" : "Falhou"}
                    </Text>
                  </Pressable>
                );
              }) : <Text style={[typography.muted, styles.empty]}>Nenhuma meta finalizada ainda.</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute", bottom: 90, right: spacing.lg, left: spacing.lg,
    backgroundColor: "rgba(13,22,48,0.92)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    maxHeight: 320, overflow: "hidden",
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm },
  count: { backgroundColor: "rgba(148,180,255,0.15)", borderRadius: 99, paddingHorizontal: 6 },
  countText: { color: colors.muted, fontSize: 11 },
  inner: { borderTopWidth: 1, borderTopColor: colors.line },
  tabs: { flexDirection: "row", gap: 4, padding: spacing.sm },
  tab: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line },
  tabSel: { backgroundColor: "rgba(110,168,255,0.15)", borderColor: colors.accent },
  body: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, gap: spacing.xs, maxHeight: 220 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  chip: { width: 30, height: 30, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  progTrack: { height: 3, borderRadius: 99, backgroundColor: "rgba(148,180,255,.12)", overflow: "hidden", marginTop: 3 },
  progFill: { height: "100%", borderRadius: 99 },
  empty: { fontStyle: "italic", textAlign: "center", paddingVertical: spacing.md },
});
