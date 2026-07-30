import { useState } from "react";
import type { DesafioSocial } from "@project-fox/types";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEstacao } from "../criar/useEstacao";
import { AwardIcon, ClockIcon, OrbitIcon, PlusIcon, TargetIcon, UsersIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { errorMessage } from "./Avatar";
import { ChallengeDetail } from "./ChallengeDetail";
import { CreateChallengeModal } from "./CreateChallengeModal";
import { useDesafios } from "./useDesafios";
import type { FriendSummary } from "./useOrbita";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00`));
}
function daysUntil(date: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - today.getTime()) / 86400000);
}

export function DesafiosTab({ friends }: { friends: FriendSummary[] }) {
  const data = useDesafios();
  const { estacao, ativar: ativarEstacao } = useEstacao();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<DesafioSocial | null>(null);
  const [history, setHistory] = useState(false);

  const all = data.query.data;
  const myParticipants = all?.participantes.filter((p) => p.userId === data.userId) ?? [];
  const pending = myParticipants.filter((p) => p.status === "pendente");
  const visible = (all?.desafios ?? []).filter((d) => (history ? d.status !== "ativo" : d.status === "ativo"));
  const estacaoAtiva = !!estacao?.ativa;

  async function act(action: () => Promise<unknown>, success: string) {
    try { await action(); Alert.alert(success); return true; }
    catch (e) { Alert.alert(errorMessage(e)); return false; }
  }

  async function ativar() {
    const ok = await act(() => ativarEstacao.mutateAsync(), "Estação a caminho da sua órbita.");
    if (ok) Alert.alert("Sua Estação Órbita foi ativada — abra o Desenvolver/Criar pra vê-la.");
  }

  if (data.query.isLoading) {
    return <View style={styles.screen}><Text style={typography.muted}>Preparando desafios…</Text></View>;
  }
  if (data.query.isError) {
    return <View style={styles.screen}><Text style={typography.muted}>Não foi possível carregar os desafios.</Text></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.filter}>
          <Pressable style={[styles.filterBtn, !history && styles.filterBtnSel]} onPress={() => setHistory(false)}>
            <Text style={typography.body}>Ativos</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, history && styles.filterBtnSel]} onPress={() => setHistory(true)}>
            <Text style={typography.body}>Histórico</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.addBtn, (!friends.length || !estacaoAtiva) && { opacity: 0.5 }]} disabled={!friends.length || !estacaoAtiva} onPress={() => setCreateOpen(true)}>
          <PlusIcon size={13} color={colors.text} />
          <Text style={typography.body}>Novo desafio</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!estacaoAtiva && (
          <View style={styles.gate}>
            <OrbitIcon size={22} color={colors.accent} />
            <Text style={typography.subtitle}>Ative sua estação</Text>
            <Text style={[typography.muted, { textAlign: "center" }]}>
              Os desafios são comprovados com relatórios escritos dentro da Estação Órbita — o corpo social do seu sistema solar.
            </Text>
            <Pressable style={styles.gateBtn} onPress={ativar} disabled={ativarEstacao.isPending}>
              <OrbitIcon size={13} color={colors.text} />
              <Text style={[typography.body, { fontWeight: "600" }]}>{ativarEstacao.isPending ? "Lançando…" : "Ativar estação"}</Text>
            </Pressable>
          </View>
        )}

        {!!pending.length && !history && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <UsersIcon size={14} color={colors.text} />
              <Text style={typography.subtitle}>Convites esperando você</Text>
              <Text style={typography.muted}>{pending.length}</Text>
            </View>
            {pending.map((invite) => {
              const challenge = all?.desafios.find((d) => d.id === invite.desafioId);
              if (!challenge) return null;
              return (
                <View key={challenge.id} style={styles.inviteRow}>
                  <View style={[styles.symbol, { backgroundColor: `${challenge.cor}30` }]}>
                    <TargetIcon size={14} color={challenge.cor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.body}>{challenge.titulo}</Text>
                    <Text style={typography.muted}>até {formatDate(challenge.prazo)}</Text>
                  </View>
                  <Pressable style={styles.smallBtn} onPress={() => act(() => data.respond.mutateAsync({ id: challenge.id, accept: false }), "Convite recusado.")}>
                    <Text style={typography.body}>Recusar</Text>
                  </Pressable>
                  <Pressable style={[styles.smallBtn, styles.smallBtnPrimary]} onPress={() => act(() => data.respond.mutateAsync({ id: challenge.id, accept: true }), "Desafio aceito.")}>
                    <Text style={[typography.body, { fontWeight: "600" }]}>Aceitar</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {!friends.length && !history && (
          <View style={styles.gate}>
            <UsersIcon size={20} color={colors.muted} />
            <Text style={typography.subtitle}>Desafios começam com companhia</Text>
            <Text style={[typography.muted, { textAlign: "center" }]}>Adicione alguém à sua órbita para criar uma meta compartilhada.</Text>
          </View>
        )}

        {visible.map((challenge) => {
          const participants = all?.participantes.filter((p) => p.desafioId === challenge.id && p.status === "aceito") ?? [];
          const objectives = all?.objetivos.filter((o) => o.desafioId === challenge.id) ?? [];
          const mine = all?.progresso.filter((p) => p.userId === data.userId && objectives.some((o) => o.id === p.objetivoId)).length ?? 0;
          const complete = participants.filter((p) => p.concluidoEm).length;
          return (
            <Pressable key={challenge.id} style={styles.card} onPress={() => setSelected(challenge)}>
              <View style={styles.cardHead}>
                <View style={[styles.symbol, { backgroundColor: `${challenge.cor}30` }]}>
                  <TargetIcon size={14} color={challenge.cor} />
                </View>
                <Text style={typography.muted}>{challenge.status}</Text>
              </View>
              <Text style={typography.subtitle}>{challenge.titulo}</Text>
              {challenge.descricao && <Text style={typography.muted}>{challenge.descricao}</Text>}
              <View style={styles.deadlineRow}>
                <ClockIcon size={11} color={colors.muted} />
                <Text style={typography.muted}>{challenge.status === "ativo" ? `${Math.max(0, daysUntil(challenge.prazo))} dias restantes` : formatDate(challenge.prazo)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${objectives.length ? (mine / objectives.length) * 100 : 0}%`, backgroundColor: challenge.cor }]} />
              </View>
              <Text style={typography.muted}>Você: {mine}/{objectives.length}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}><UsersIcon size={11} color={colors.muted} /><Text style={typography.muted}>{participants.length} participantes</Text></View>
                <View style={styles.footerItem}><AwardIcon size={11} color={colors.muted} /><Text style={typography.muted}>{complete}/{participants.length} concluíram</Text></View>
              </View>
            </Pressable>
          );
        })}

        {!visible.length && !!friends.length && (estacaoAtiva || history) && (
          <View style={styles.gate}>
            <TargetIcon size={20} color={colors.muted} />
            <Text style={typography.subtitle}>{history ? "Nenhum desafio encerrado" : "Nenhum desafio ativo"}</Text>
            <Text style={[typography.muted, { textAlign: "center" }]}>
              {history ? "Os concluídos e vencidos aparecerão aqui." : "Transforme uma meta em compromisso compartilhado."}
            </Text>
            {!history && (
              <Pressable style={styles.gateBtn} onPress={() => setCreateOpen(true)}>
                <PlusIcon size={13} color={colors.text} />
                <Text style={[typography.body, { fontWeight: "600" }]}>Criar primeiro desafio</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <CreateChallengeModal
        visible={createOpen}
        friends={friends}
        pending={data.create.isPending}
        onClose={() => setCreateOpen(false)}
        onCreate={(input) => act(() => data.create.mutateAsync(input), "Desafio criado e convites enviados.").then((ok) => { if (ok) setCreateOpen(false); })}
      />

      {selected && all && (
        <ChallengeDetail
          challenge={selected}
          userId={data.userId!}
          estacaoId={estacao?.id}
          participants={all.participantes.filter((p) => p.desafioId === selected.id)}
          objectives={all.objetivos.filter((o) => o.desafioId === selected.id)}
          progress={all.progresso}
          reports={data.reports.data ?? []}
          pending={data.prove.isPending}
          onClose={() => setSelected(null)}
          onProve={(objectiveId, reportId) => act(() => data.prove.mutateAsync({ objectiveId, reportId }), "Objetivo comprovado.")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, paddingBottom: spacing.sm },
  filter: { flexDirection: "row", gap: 4, backgroundColor: colors.panel, borderRadius: radius.md, padding: 4 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.sm },
  filterBtnSel: { backgroundColor: "rgba(110,168,255,0.18)" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#3667c4", borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12 },
  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },
  gate: { alignItems: "center", gap: spacing.sm, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.lg },
  gateBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#3667c4", borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 16, marginTop: spacing.xs },
  section: { gap: spacing.xs },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  symbol: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  smallBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  smallBtnPrimary: { backgroundColor: "#3667c4", borderColor: "rgba(148,180,255,0.4)" },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, gap: 6 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  progressTrack: { height: 5, borderRadius: 99, backgroundColor: "rgba(148,180,255,.12)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
});
