import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FitIcon, PlusIcon, UsersIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { BADGES } from "./graph/badges";
import { GraphCanvas, type GraphCanvasHandle } from "./graph/GraphCanvas";
import { CreateNoteSpaceModal } from "./CreateNoteSpaceModal";
import { NewNoteModal } from "./NewNoteModal";
import { NoteDrawer } from "./NoteDrawer";
import { NoteSpaceInvitesModal } from "./NoteSpaceInvitesModal";
import { NoteSpaceMembersModal } from "./NoteSpaceMembersModal";
import { useAnotar } from "./useAnotar";
import { useOrbita } from "../orbita/useOrbita";

export function AnotarScreen() {
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const data = useAnotar(activeSpaceId);
  const { notas, conexoes, isLoading, addConexao, updateNota, userId, spaces, spaceInvites, activeSpace } = data;
  const { relations } = useOrbita(userId);
  const friends = (relations.data ?? []).filter((r) => r.direction === "friend");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [newNotePos, setNewNotePos] = useState({ x: 0, y: 0 });
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [spaceMembersOpen, setSpaceMembersOpen] = useState(false);
  const [spaceInvitesOpen, setSpaceInvitesOpen] = useState(false);
  const canvasRef = useRef<GraphCanvasHandle>(null);

  const selectedNota = selectedId ? notas.find((n) => n.id === selectedId) ?? null : null;

  function handleNodeTap(id: string) {
    if (connectFromId) {
      if (connectFromId !== id) {
        addConexao.mutate({ origemId: connectFromId, destinoId: id });
        canvasRef.current?.firePulse(connectFromId, id);
      }
      setConnectFromId(null);
      return;
    }
    setSelectedId(id);
  }

  function handleEmptyTap() {
    setSelectedId(null);
    setConnectFromId(null);
  }

  function handleNodeDragEnd(id: string, x: number, y: number) {
    updateNota.mutate({ id, posX: x, posY: y });
  }

  function openNewNoteAtCenter() {
    const pos = canvasRef.current?.createAtCenter() ?? { x: 0, y: 0 };
    setNewNotePos(pos);
    setNewNoteOpen(true);
  }

  function switchSpace(id: string | null) {
    setSelectedId(null);
    setConnectFromId(null);
    setActiveSpaceId(id);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={typography.title}>Anotar</Text>
          <Text style={typography.muted}>{notas.length} notas · {conexoes.length} conexões</Text>
        </View>
        <View style={styles.topbarActions}>
          {!!spaceInvites.length && (
            <Pressable style={styles.iconBtn} onPress={() => setSpaceInvitesOpen(true)}>
              <UsersIcon size={14} color={colors.text} />
            </Pressable>
          )}
          <Pressable style={styles.iconBtn} onPress={() => canvasRef.current?.fitView()}>
            <FitIcon size={14} color={colors.text} />
          </Pressable>
          <Pressable style={styles.addBtn} onPress={openNewNoteAtCenter}>
            <PlusIcon size={14} color={colors.text} />
            <Text style={typography.body}>Nova nota</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spaceRow}>
        <Pressable style={[styles.spaceChip, !activeSpaceId && styles.spaceChipSel]} onPress={() => switchSpace(null)}>
          <Text style={typography.body}>Meu grafo</Text>
        </Pressable>
        {spaces.map((s) => (
          <Pressable key={s.id} style={[styles.spaceChip, activeSpaceId === s.id && styles.spaceChipSel]} onPress={() => switchSpace(s.id)}>
            <View style={[styles.spaceDot, { backgroundColor: s.cor }]} />
            <Text style={typography.body}>{s.nome}</Text>
          </Pressable>
        ))}
        {activeSpace && (
          <Pressable style={styles.spaceChip} onPress={() => setSpaceMembersOpen(true)}>
            <UsersIcon size={12} color={colors.muted} />
            <Text style={typography.muted}>{activeSpace.membros.filter((m) => m.status === "aceito").length}</Text>
          </Pressable>
        )}
        <Pressable style={styles.spaceChip} onPress={() => setCreateSpaceOpen(true)}>
          <PlusIcon size={12} color={colors.text} />
          <Text style={typography.body}>Espaço</Text>
        </Pressable>
      </ScrollView>

      {!isLoading && notas.length === 0 && (
        <View style={styles.empty}>
          <Text style={typography.subtitle}>{activeSpace ? `${activeSpace.nome} ainda está vazio` : "Sua rede de notas está vazia"}</Text>
          <Text style={[typography.muted, { textAlign: "center" }]}>
            Cada nota é um nó nesse espaço infinito. Solte a primeira ideia — organize e conecte depois.
          </Text>
        </View>
      )}

      <GraphCanvas
        ref={canvasRef}
        notas={notas}
        conexoes={conexoes}
        selectedId={selectedId}
        connectFromId={connectFromId}
        onNodeTap={handleNodeTap}
        onEmptyTap={handleEmptyTap}
        onNodeDragEnd={handleNodeDragEnd}
      />

      <View style={styles.legend}>
        {(["wishlist", "tarefas", "criar"] as const).map((b) => (
          <View key={b} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: `rgb(${BADGES[b].rgb.join(",")})` }]} />
            <Text style={typography.muted}>{BADGES[b].label}</Text>
          </View>
        ))}
      </View>

      <NoteDrawer
        nota={selectedNota}
        notas={notas}
        conexoes={conexoes}
        connecting={connectFromId === selectedId && !!connectFromId}
        espacoId={activeSpaceId}
        userId={userId}
        onClose={() => setSelectedId(null)}
        onStartConnect={() => setConnectFromId(selectedId)}
        onGoToNote={(id) => setSelectedId(id)}
      />

      <NewNoteModal
        visible={newNoteOpen}
        position={newNotePos}
        espacoId={activeSpaceId}
        onClose={() => setNewNoteOpen(false)}
        onCreated={(id) => { setNewNoteOpen(false); setSelectedId(id); }}
      />

      <CreateNoteSpaceModal
        visible={createSpaceOpen}
        onClose={() => setCreateSpaceOpen(false)}
        onCreated={(id) => { setCreateSpaceOpen(false); switchSpace(id); }}
      />
      <NoteSpaceMembersModal
        visible={spaceMembersOpen}
        space={activeSpace ?? null}
        friends={friends}
        onClose={() => setSpaceMembersOpen(false)}
      />
      <NoteSpaceInvitesModal
        visible={spaceInvitesOpen}
        onClose={() => setSpaceInvitesOpen(false)}
        onAccepted={(id) => { setSpaceInvitesOpen(false); switchSpace(id); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  topbar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: spacing.lg, paddingBottom: spacing.sm,
  },
  topbarActions: { flexDirection: "row", gap: spacing.sm },
  iconBtn: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#3667c4", borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12,
  },
  spaceRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  spaceChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  spaceChipSel: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
  spaceDot: { width: 8, height: 8, borderRadius: 4 },
  empty: {
    position: "absolute", top: "40%", left: spacing.lg, right: spacing.lg, alignItems: "center", gap: spacing.sm, zIndex: 4,
  },
  legend: {
    position: "absolute", bottom: spacing.lg, left: spacing.lg, gap: 4,
    backgroundColor: "rgba(13,22,48,0.75)", borderRadius: radius.sm, padding: spacing.sm,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
