import { useRef, useState } from "react";
import type { Evento } from "@project-fox/types";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { GradientButton } from "../../components/GradientButton";
import { FitIcon, PlusIcon, TrashIcon, UsersIcon } from "../../icons/index";
import { useOfferSocialShare } from "../orbita/SocialShareProvider";
import { useOrbita } from "../orbita/useOrbita";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { MOON_STYLE } from "./criarConstants";
import { EventDetailModal } from "./EventDetailModal";
import { EventsPanel } from "./EventsPanel";
import { GoalModal } from "./GoalModal";
import { MoonDrawer } from "./MoonDrawer";
import { PlanetInvitesModal } from "./PlanetInvitesModal";
import { PlanetMembersModal } from "./PlanetMembersModal";
import { PlanetModal } from "./PlanetModal";
import { SolarCanvas, type SolarCanvasHandle } from "./system/SolarCanvas";
import { health, useCriar } from "./useCriar";

export function CriarScreen() {
  const { session } = useAuth();
  const { planetas, convitesPlaneta, relatorios, recursos, fotos, eventos, isLoading, deletePlaneta } = useCriar();
  const { relations } = useOrbita(session!.user.id);
  const friends = (relations.data ?? []).filter((r) => r.direction === "friend");
  const [focusedPlanetId, setFocusedPlanetId] = useState<string | null>(null);
  const [planetModalOpen, setPlanetModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [moonId, setMoonId] = useState<string | null>(null);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const canvasRef = useRef<SolarCanvasHandle>(null);
  const offerShare = useOfferSocialShare();

  const focusedPlaneta = focusedPlanetId ? planetas.find((p) => p.id === focusedPlanetId) ?? null : null;
  const moonIds = focusedPlaneta
    ? ["relatorio", ...(focusedPlaneta.temRecursos ? ["recursos"] : []), ...(focusedPlaneta.temFotos ? ["fotos"] : [])]
    : [];

  function handleGoalCompleted() {
    if (focusedPlanetId) canvasRef.current?.triggerParty(focusedPlanetId);
    const planeta = selectedEvento ? planetas.find((p) => p.id === selectedEvento.planetaId) : undefined;
    if (selectedEvento && planeta) {
      offerShare({
        tipo: "evento_concluido",
        planetaId: planeta.id,
        eventoId: selectedEvento.id,
        texto: `Completei a meta "${selectedEvento.titulo}" no planeta ${planeta.nome}!`,
        dados: { titulo: selectedEvento.titulo, planeta: planeta.nome },
      });
    } else {
      Alert.alert("Meta concluída!");
    }
  }

  function confirmDeletePlanet() {
    if (!focusedPlaneta) return;
    Alert.alert("Excluir planeta?", `"${focusedPlaneta.nome}" e todo o conteúdo dele serão perdidos.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => { deletePlaneta.mutate(focusedPlaneta.id); setFocusedPlanetId(null); } },
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topbar}>
        <View style={styles.topbarText}>
          <Text style={typography.title}>Desenvolver/Criar</Text>
          <Text style={typography.muted}>{planetas.length} planetas</Text>
        </View>
        <View style={styles.topbarActions}>
          {!!convitesPlaneta.length && (
            <Pressable style={styles.iconBtn} onPress={() => setInvitesOpen(true)}>
              <UsersIcon size={14} color={colors.text} />
            </Pressable>
          )}
          <Pressable style={styles.iconBtn} onPress={() => canvasRef.current?.fitView()}>
            <FitIcon size={14} color={colors.text} />
          </Pressable>
          <GradientButton style={styles.addBtn} onPress={() => setPlanetModalOpen(true)}>
            <PlusIcon size={14} color={colors.text} />
            <Text style={typography.body}>Novo planeta</Text>
          </GradientButton>
        </View>
      </View>

      {!isLoading && planetas.length === 0 && (
        <View style={styles.empty}>
          <Text style={typography.subtitle}>Seu sistema solar está vazio</Text>
          <Text style={[typography.muted, { textAlign: "center" }]}>
            Cada área de desenvolvimento vira um planeta pra cuidar. Crie o primeiro.
          </Text>
        </View>
      )}

      <SolarCanvas
        ref={canvasRef}
        planetas={planetas}
        relatorios={relatorios}
        eventos={eventos}
        focusedPlanetId={focusedPlanetId}
        onPlanetTap={(id) => setFocusedPlanetId(id)}
        onMoonTap={(_planetId, mId) => setMoonId(mId)}
        onEmptyTap={() => setFocusedPlanetId(null)}
      />

      {focusedPlaneta && (
        <View style={styles.focusPanel}>
          <View style={styles.focusHead}>
            <Text style={typography.subtitle} numberOfLines={1}>{focusedPlaneta.nome}</Text>
            <Text style={typography.muted}>{Math.round(health(focusedPlaneta, relatorios) * 100)}% de saúde</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moonRow}>
            {moonIds.map((mId) => {
              const st = MOON_STYLE[mId];
              const Icon = st.icon;
              return (
                <Pressable key={mId} style={styles.moonBtn} onPress={() => setMoonId(mId)}>
                  <Icon size={14} color={st.col} />
                  <Text style={typography.body}>{st.label}</Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.moonBtn} onPress={() => setGoalModalOpen(true)}>
              <PlusIcon size={14} color={colors.text} />
              <Text style={typography.body}>Nova meta</Text>
            </Pressable>
            <Pressable style={styles.moonBtn} onPress={() => setMembersOpen(true)}>
              <UsersIcon size={14} color={colors.text} />
              <Text style={typography.body}>Compartilhar</Text>
            </Pressable>
          </ScrollView>
          <View style={styles.focusActions}>
            <Pressable style={styles.focusBack} onPress={() => setFocusedPlanetId(null)}>
              <Text style={typography.body}>Voltar ao sistema</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={confirmDeletePlanet}>
              <TrashIcon size={13} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      )}

      <EventsPanel planetas={planetas} eventos={eventos} onSelect={(_planetaId, ev) => setSelectedEvento(ev)} />

      <PlanetModal visible={planetModalOpen} onClose={() => setPlanetModalOpen(false)} onCreated={(id) => { setPlanetModalOpen(false); setFocusedPlanetId(id); }} />

      {focusedPlaneta && (
        <GoalModal
          visible={goalModalOpen}
          planetaId={focusedPlaneta.id}
          planetaNome={focusedPlaneta.nome}
          onClose={() => setGoalModalOpen(false)}
        />
      )}

      <MoonDrawer
        planeta={focusedPlaneta}
        moonId={moonId}
        relatorios={relatorios}
        recursos={recursos}
        fotos={fotos}
        onClose={() => setMoonId(null)}
      />

      <EventDetailModal
        evento={selectedEvento}
        relatorios={relatorios}
        onClose={() => setSelectedEvento(null)}
        onCompleted={() => { handleGoalCompleted(); setSelectedEvento(null); }}
      />

      <PlanetMembersModal
        visible={membersOpen}
        planeta={focusedPlaneta}
        friends={friends}
        relatorios={relatorios}
        onClose={() => setMembersOpen(false)}
      />
      <PlanetInvitesModal visible={invitesOpen} onClose={() => setInvitesOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: spacing.lg, paddingBottom: spacing.sm },
  topbarText: { flexShrink: 1, marginRight: spacing.sm },
  topbarActions: { flexDirection: "row", gap: spacing.sm },
  iconBtn: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12 },
  empty: { position: "absolute", top: "35%", left: spacing.lg, right: spacing.lg, alignItems: "center", gap: spacing.sm, zIndex: 4 },
  focusPanel: {
    position: "absolute", top: 90, left: spacing.lg, right: spacing.lg,
    backgroundColor: "rgba(13,22,48,0.92)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  focusHead: { gap: 2 },
  moonRow: { flexDirection: "row", gap: spacing.sm },
  moonBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  focusActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  focusBack: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line },
  deleteBtn: { width: 30, height: 30, borderRadius: radius.sm, borderWidth: 1, borderColor: "rgba(255,120,120,.25)", alignItems: "center", justifyContent: "center" },
});
