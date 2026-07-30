import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme/theme";

export function PlaceholderScreen({ label }: { label: string }) {
  return (
    <View style={styles.screen}>
      <Text style={typography.subtitle}>{label}</Text>
      <Text style={[typography.muted, styles.body]}>Em construção — chega numa próxima sub-fase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  body: { textAlign: "center" },
});
