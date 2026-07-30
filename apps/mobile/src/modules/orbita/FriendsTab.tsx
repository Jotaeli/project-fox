import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CheckIcon, CloseIcon, OrbitIcon, SearchIcon, UsersIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar, errorMessage } from "./Avatar";
import { searchProfiles, useOrbita, type FriendSummary } from "./useOrbita";

export function FriendsTab({ userId, onOpenProfile }: { userId: string; onOpenProfile: (friend: FriendSummary) => void }) {
  const data = useOrbita(userId);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; nome: string; handle: string; avatarUrl: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const relations = data.relations.data ?? [];
  const friends = relations.filter((r) => r.direction === "friend");
  const incoming = relations.filter((r) => r.direction === "incoming");

  useEffect(() => {
    const term = search.trim().replace(/^@/, "").toLowerCase();
    if (term.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try { setResults(await searchProfiles(term)); }
      catch (e) { Alert.alert(errorMessage(e)); }
      finally { setSearching(false); }
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  async function act(action: () => Promise<unknown>, success: string) {
    try { await action(); Alert.alert(success); }
    catch (e) { Alert.alert(errorMessage(e)); }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.searchBox}>
        <SearchIcon size={14} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pelo @"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
      </View>
      {searching && <Text style={typography.muted}>Procurando…</Text>}
      {!!results.length && (
        <View style={styles.section}>
          {results.map((person) => {
            const relation = relations.find((r) => r.userId === person.id);
            return (
              <View key={person.id} style={styles.personRow}>
                <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{person.nome}</Text>
                  <Text style={typography.muted}>@{person.handle}</Text>
                </View>
                {relation ? (
                  <Text style={typography.muted}>{relation.direction === "friend" ? "amigo" : relation.direction === "incoming" ? "responder" : "enviado"}</Text>
                ) : (
                  <Pressable style={styles.smallBtn} onPress={() => act(() => data.sendFriendRequest.mutateAsync(person.id), "Solicitação enviada.")}>
                    <Text style={typography.body}>Adicionar</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}
      {search.trim().length >= 2 && !searching && !results.length && <Text style={typography.muted}>Nenhum perfil descobrível encontrado.</Text>}

      {!!incoming.length && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <UsersIcon size={14} color={colors.text} />
            <Text style={typography.subtitle}>Solicitações</Text>
            <Text style={typography.muted}>{incoming.length}</Text>
          </View>
          {incoming.map((person) => (
            <View key={person.friendshipId} style={styles.personRow}>
              <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
              <Pressable style={{ flex: 1 }} onPress={() => onOpenProfile(person)}>
                <Text style={typography.body}>{person.nome}</Text>
                <Text style={typography.muted}>@{person.handle ?? "sem-handle"}</Text>
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => act(() => data.answerFriendRequest.mutateAsync({ id: person.friendshipId, accept: true }), "Agora vocês estão na mesma órbita.")}>
                <CheckIcon size={13} color={colors.green} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => act(() => data.answerFriendRequest.mutateAsync({ id: person.friendshipId, accept: false }), "Solicitação recusada.")}>
                <CloseIcon size={13} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <OrbitIcon size={14} color={colors.text} />
          <Text style={typography.subtitle}>Sua órbita</Text>
          <Text style={typography.muted}>{friends.length}</Text>
        </View>
        {friends.length ? friends.map((person) => (
          <Pressable key={person.friendshipId} style={styles.personRow} onPress={() => onOpenProfile(person)}>
            <Avatar name={person.nome} url={person.avatarUrl} size="sm" />
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>{person.nome}</Text>
              <Text style={typography.muted}>@{person.handle ?? "sem-handle"}</Text>
            </View>
          </Pressable>
        )) : <Text style={[typography.muted, styles.emptyRow]}>Sua órbita começa quando você adiciona alguém.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  searchBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 10 },
  section: { gap: spacing.xs },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  personRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8 },
  smallBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  iconBtn: { width: 30, height: 30, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  emptyRow: { paddingVertical: spacing.md, fontStyle: "italic" },
});
