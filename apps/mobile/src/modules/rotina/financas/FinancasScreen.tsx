import { useState } from "react";
import type { Gasto, ModalidadeGasto } from "@project-fox/types";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CheckIcon, CloseIcon, PlusIcon, SparkIcon } from "../../../icons/index";
import { fmtBRL } from "../../../lib/currentMonth";
import { useOfferSocialShare } from "../../orbita/SocialShareProvider";
import { colors, radius, spacing, typography } from "../../../theme/theme";
import { useWishlist } from "../wishlist/useWishlist";
import { DonutChart } from "./DonutChart";
import { NovaModalidadeModal } from "./NovaModalidadeModal";
import { Piggy } from "./Piggy";
import { calcCofrinho, useFinancas } from "./useFinancas";

function ModalityCard({ mod, gastos }: { mod: ModalidadeGasto; gastos: Gasto[] }) {
  const { marcarGastoPago, deleteGasto, addGasto } = useFinancas();
  const { items } = useWishlist();
  const offerShare = useOfferSocialShare();
  const [formOpen, setFormOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [val, setVal] = useState("");
  const [wishSel, setWishSel] = useState<string | null>(null);

  const planned = gastos.reduce((s, e) => s + e.valor, 0);
  const spentM = gastos.filter((e) => e.pago).reduce((s, e) => s + e.valor, 0);

  function submitFree() {
    const v = Number(val);
    if (!desc.trim() || !v) return;
    addGasto.mutate({ modalidadeId: mod.id, descricao: desc.trim(), valor: v });
    setDesc(""); setVal(""); setFormOpen(false);
  }
  function submitWish(w: (typeof items)[number]) {
    addGasto.mutate({ modalidadeId: mod.id, descricao: w.nome, valor: w.valor, itemWishlistId: w.id });
    setWishSel(null); setFormOpen(false);
  }

  const availableWishItems = items.filter((w) => !w.comprado && !gastos.some((g) => g.itemWishlistId === w.id));

  return (
    <View style={styles.modality}>
      <View style={styles.modHead}>
        <View style={styles.modName}>
          {mod.fixa && <SparkIcon size={12} color={colors.gold} />}
          <Text style={typography.subtitle}>{mod.nome}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => setFormOpen((v) => !v)}>
          <PlusIcon size={14} color={colors.muted} />
        </Pressable>
      </View>
      <Text style={[typography.muted, styles.modSub]}>
        {fmtBRL(spentM)} gastos de {fmtBRL(planned)} planejados
      </Text>

      {gastos.length === 0 && <Text style={[typography.muted, styles.empty]}>Nenhum gasto ainda</Text>}
      {gastos.map((e) => {
        const w = items.find((i) => i.id === e.itemWishlistId);
        return (
          <View key={e.id} style={[styles.expRow, e.pago && styles.expRowPaid]}>
            <Pressable
              style={styles.check}
              onPress={() => marcarGastoPago.mutate(e, {
                onSuccess: (novoPago) => {
                  if (novoPago && w) {
                    offerShare({
                      tipo: "wishlist_comprado",
                      itemWishlistId: w.id,
                      texto: `Consegui tirar "${w.nome}" da wishlist.`,
                      dados: { nome: w.nome, valor: w.valor, tier: w.tier },
                    });
                  }
                },
              })}
            >
              <CheckIcon size={13} color={e.pago ? colors.green : colors.muted} />
            </Pressable>
            <View style={styles.expLabel}>
              <Text style={typography.body} numberOfLines={1}>{e.descricao}</Text>
              {w && <Text style={styles.wishChip}>tier {w.tier}</Text>}
            </View>
            <Text style={typography.body}>{fmtBRL(e.valor)}</Text>
            <Pressable style={styles.iconBtn} onPress={() => deleteGasto.mutate(e.id)}>
              <CloseIcon size={12} color={colors.muted} />
            </Pressable>
          </View>
        );
      })}

      {formOpen && mod.fixa && (
        <View style={styles.inlineForm}>
          {availableWishItems.length === 0 ? (
            <Text style={typography.muted}>(nenhum desejo disponível)</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wishPicker}>
              {availableWishItems.map((w) => (
                <Pressable
                  key={w.id}
                  style={[styles.wishOption, wishSel === w.id && styles.wishOptionSel]}
                  onPress={() => setWishSel(w.id)}
                >
                  <Text style={typography.body} numberOfLines={1}>{w.nome}</Text>
                  <Text style={typography.muted}>{fmtBRL(w.valor)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              const w = availableWishItems.find((i) => i.id === wishSel);
              if (w) submitWish(w);
            }}
          >
            <Text style={typography.body}>Alocar</Text>
          </Pressable>
        </View>
      )}
      {formOpen && !mod.fixa && (
        <View style={styles.inlineForm}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            value={desc}
            onChangeText={setDesc}
            maxLength={34}
            placeholder="Descrição do gasto"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            placeholder="R$"
            placeholderTextColor={colors.muted}
          />
          <Pressable style={styles.smallBtn} onPress={submitFree}>
            <Text style={typography.body}>Ok</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function FinancasScreen() {
  const { rendas, modalidades, gastos, addRenda, deleteRenda } = useFinancas();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incName, setIncName] = useState("");
  const [incVal, setIncVal] = useState("");
  const [modalidadeModalOpen, setModalidadeModalOpen] = useState(false);

  const { totalIncome, totalSpent, avail } = calcCofrinho(rendas, gastos);

  function submitIncome() {
    const v = Number(incVal);
    if (!incName.trim() || !v) return;
    addRenda.mutate({ fonte: incName.trim(), valor: v });
    setIncName(""); setIncVal(""); setIncomeOpen(false);
  }

  const chartRows = modalidades.map((m) => ({
    nome: m.nome,
    cor: m.cor,
    total: gastos.filter((g) => g.modalidadeId === m.id).reduce((s, g) => s + g.valor, 0),
  }));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={typography.title}>Finanças</Text>
          <Text style={typography.muted}>Marque um gasto como pago e veja o cofrinho reagir</Text>
        </View>
        <Pressable style={styles.headBtn} onPress={() => setModalidadeModalOpen(true)}>
          <PlusIcon size={14} color={colors.text} />
          <Text style={typography.body}>Modalidade</Text>
        </Pressable>
      </View>

      <Piggy avail={avail} total={totalIncome} spent={totalSpent} />

      <View style={styles.incomeBox}>
        <View style={styles.incomeHead}>
          <Text style={typography.muted}>Renda do mês</Text>
          <Pressable style={styles.iconBtn} onPress={() => setIncomeOpen((v) => !v)}>
            <PlusIcon size={14} color={colors.muted} />
          </Pressable>
        </View>
        {rendas.map((inc) => (
          <View key={inc.id} style={styles.incomeRow}>
            <View style={styles.expLabel}>
              {inc.origemTarefaId && <SparkIcon size={12} color={colors.gold} />}
              <Text style={typography.body}>{inc.fonte}</Text>
            </View>
            <Text style={typography.body}>{fmtBRL(inc.valor)}</Text>
            <Pressable style={styles.iconBtn} onPress={() => deleteRenda.mutate(inc.id)}>
              <CloseIcon size={12} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        {incomeOpen && (
          <View style={styles.inlineForm}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              value={incName}
              onChangeText={setIncName}
              maxLength={30}
              placeholder="Fonte (ex: Emprego TI)"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={incVal}
              onChangeText={setIncVal}
              keyboardType="numeric"
              placeholder="R$"
              placeholderTextColor={colors.muted}
            />
            <Pressable style={styles.smallBtn} onPress={submitIncome}>
              <Text style={typography.body}>Ok</Text>
            </Pressable>
          </View>
        )}
      </View>

      <DonutChart rows={chartRows} />

      <View style={styles.modalities}>
        {modalidades.map((m) => (
          <ModalityCard key={m.id} mod={m} gastos={gastos.filter((g) => g.modalidadeId === m.id)} />
        ))}
      </View>

      <NovaModalidadeModal visible={modalidadeModalOpen} onClose={() => setModalidadeModalOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headText: { flex: 1, marginRight: spacing.sm },
  headBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  incomeBox: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  incomeHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  incomeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, paddingVertical: 6 },
  modalities: { gap: spacing.md },
  modality: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
  },
  modHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modName: { flexDirection: "row", alignItems: "center", gap: 6 },
  modSub: { marginBottom: spacing.xs },
  empty: { fontStyle: "italic" },
  expRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  expRowPaid: { opacity: 0.6 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  expLabel: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  wishChip: { fontSize: 9.5, color: colors.green, borderWidth: 1, borderColor: "rgba(74,222,128,.35)", borderRadius: 99, paddingHorizontal: 6 },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineForm: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs, flexWrap: "wrap" },
  input: {
    backgroundColor: "rgba(8,14,32,0.8)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    color: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 90,
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  wishPicker: { flex: 1 },
  wishOption: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: 8,
    marginRight: spacing.xs,
    minWidth: 100,
  },
  wishOptionSel: { borderColor: colors.accent },
});
