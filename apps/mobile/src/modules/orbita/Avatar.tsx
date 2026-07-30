import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/theme";

const SIZES = { sm: 28, md: 40, lg: 64 };

export function Avatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const s = SIZES[size];
  if (url) {
    return <Image source={{ uri: url }} style={[styles.img, { width: s, height: s, borderRadius: s / 2 }]} />;
  }
  return (
    <View style={[styles.fallback, { width: s, height: s, borderRadius: s / 2 }]}>
      <Text style={[styles.letter, { fontSize: s * 0.42 }]}>{name.trim().charAt(0).toUpperCase() || "?"}</Text>
    </View>
  );
}

export function since(iso: string): string {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(iso));
}

export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("amizades_par_unico")) return "Já existe uma solicitação ou amizade com essa pessoa.";
  if (message.includes("profiles_handle_formato")) return "O @ precisa ter 3 a 20 caracteres: letras minúsculas, números ou _.";
  if (message.includes("profiles_handle_key")) return "Esse @ já está em uso.";
  if (message.includes("cutucadas_de_id_para_id_dia_key")) return "Você já cutucou essa pessoa hoje.";
  return message;
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.panelSolid },
  fallback: { backgroundColor: colors.panelSolid, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  letter: { color: colors.text, fontWeight: "700" },
});
