import { useState } from "react";
import type { TipoReacao } from "@project-fox/types";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { FlameIcon, OrbitIcon, RocketIcon, SendIcon, SparkIcon, TargetIcon } from "../../icons/index";
import { colors, radius, spacing, typography } from "../../theme/theme";
import { Avatar, errorMessage, since } from "./Avatar";
import { RankingCard } from "./RankingCard";
import { StreakCard } from "./StreakCard";
import { useOrbita, type FeedItem } from "./useOrbita";

const REACTIONS: { type: TipoReacao; label: string; Icon: typeof SparkIcon }[] = [
  { type: "faisca", label: "Faísca", Icon: SparkIcon },
  { type: "foguete", label: "Foguete", Icon: RocketIcon },
  { type: "chama", label: "Chama", Icon: FlameIcon },
  { type: "alvo", label: "Na mosca", Icon: TargetIcon },
];

export function FeedTab({ userId }: { userId: string }) {
  const data = useOrbita(userId);
  const [text, setText] = useState("");

  async function publish() {
    if (!text.trim()) return;
    try {
      await data.createPost.mutateAsync(text);
      setText("");
    } catch (e) {
      Alert.alert(errorMessage(e));
    }
  }

  async function toggleReact(post: FeedItem, tipo: TipoReacao) {
    try {
      await data.react.mutateAsync({ postId: post.id, tipo, current: post.minhaReacao });
    } catch (e) {
      Alert.alert(errorMessage(e));
    }
  }

  const posts = data.feed.data ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StreakCard streak={data.streak.data} activeDays={data.activityDays.data ?? []} loading={data.streak.isLoading} />
      <RankingCard items={data.ranking.data ?? []} loading={data.ranking.isLoading} />

      <View style={styles.composer}>
        <Avatar name={data.profile.data?.nome ?? "Você"} url={data.profile.data?.avatarUrl} />
        <View style={styles.composeBody}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            maxLength={500}
            multiline
            placeholder="O que avançou hoje? Compartilhe somente o que você quiser."
            placeholderTextColor={colors.muted}
          />
          <View style={styles.composeActions}>
            <Text style={typography.muted}>{text.length}/500 · visível para amigos</Text>
            <GradientButton style={styles.sendBtn} onPress={publish} disabled={!text.trim() || data.createPost.isPending}>
              <SendIcon size={13} color={colors.text} />
              <Text style={typography.body}>Compartilhar</Text>
            </GradientButton>
          </View>
        </View>
      </View>

      {data.feed.isLoading && <Text style={[typography.muted, styles.empty]}>Carregando feed…</Text>}
      {data.feed.isError && <Text style={[typography.muted, styles.empty]}>Não foi possível carregar o feed.</Text>}
      {!data.feed.isLoading && !posts.length && (
        <View style={styles.emptyBox}>
          <OrbitIcon size={22} color={colors.muted} />
          <Text style={typography.subtitle}>O espaço está quieto por enquanto</Text>
          <Text style={[typography.muted, { textAlign: "center" }]}>
            Publique um avanço ou encontre alguém pelo @. Nenhum marco é compartilhado automaticamente.
          </Text>
        </View>
      )}

      {posts.map((post) => (
        <View key={post.id} style={styles.post}>
          <View style={styles.postHead}>
            <Avatar name={post.autorNome} url={post.autorAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>{post.autorNome}</Text>
              <Text style={typography.muted}>{post.autorHandle ? `@${post.autorHandle} · ` : ""}{since(post.createdAt)}</Text>
            </View>
            <Text style={styles.postType}>{post.tipo === "texto" ? "AVANÇO" : post.tipo.replaceAll("_", " ").toUpperCase()}</Text>
          </View>
          {post.texto && <Text style={typography.body}>{post.texto}</Text>}
          <View style={styles.reactions}>
            {REACTIONS.map(({ type, label, Icon }) => (
              <Pressable key={type} style={[styles.reactBtn, post.minhaReacao === type && styles.reactBtnActive]} onPress={() => toggleReact(post, type)}>
                <Icon size={13} color={post.minhaReacao === type ? colors.accent : colors.muted} />
                <Text style={typography.muted}>{post.reacoes[type] || ""}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  composer: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md },
  composeBody: { flex: 1, gap: spacing.sm },
  input: { color: colors.text, minHeight: 60, textAlignVertical: "top" },
  composeActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sendBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12 },
  empty: { textAlign: "center", paddingVertical: spacing.lg },
  emptyBox: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  post: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  postHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  postType: { color: colors.muted, fontSize: 9.5, letterSpacing: 0.4 },
  reactions: { flexDirection: "row", gap: spacing.sm },
  reactBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  reactBtnActive: { borderColor: colors.accent, backgroundColor: "rgba(110,168,255,0.15)" },
});
