import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GradientButton } from "../components/GradientButton";
import { FoxIcon } from "../icons/index";
import { supabase } from "../lib/supabaseClient";
import { colors, radius, spacing, typography } from "../theme/theme";

export function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: nome || email } },
        });
        if (err) throw err;
        setInfo("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.mark}>
          <FoxIcon size={32} color={colors.accent} />
        </View>
        <Text style={typography.title}>{mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}</Text>
        <Text style={[typography.muted, styles.subtitle]}>
          {mode === "login" ? "Entre pra continuar de onde parou." : "Leva menos de um minuto."}
        </Text>

        {mode === "signup" && (
          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              placeholderTextColor={colors.muted}
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="voce@exemplo.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <GradientButton style={styles.submit} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.submitText}>{mode === "login" ? "Entrar" : "Criar conta"}</Text>
          )}
        </GradientButton>

        <Pressable
          onPress={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
        >
          <Text style={styles.switch}>
            {mode === "login" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  mark: { alignItems: "center", marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 11.5,
    color: colors.muted,
    marginBottom: spacing.xs,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(8, 14, 32, 0.8)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    color: colors.text,
    padding: 12,
    fontSize: 14,
  },
  error: { color: colors.danger, marginBottom: spacing.md },
  info: { color: colors.gold, marginBottom: spacing.md },
  submit: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  submitText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  switch: { color: colors.accent, textAlign: "center", fontSize: 13 },
});
