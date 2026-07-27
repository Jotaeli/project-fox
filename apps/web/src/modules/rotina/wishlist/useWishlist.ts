import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ItemWishlist, TierWishlist } from "@project-fox/types";
import { useAuth } from "../../../auth/AuthContext.js";
import { supabase } from "../../../lib/supabaseClient.js";

function mapItem(w: any): ItemWishlist {
  return {
    id: w.id, userId: w.user_id, nome: w.nome, valor: Number(w.valor), foto: w.foto ?? undefined,
    planetaId: w.planeta_id ?? undefined, descricao: w.descricao ?? undefined, link: w.link ?? undefined,
    tier: w.tier, comprado: w.comprado, createdAt: w.created_at,
  };
}

export interface NovoItemWishlist {
  nome: string; valor: number; tier: TierWishlist; descricao?: string; link?: string; fotoFile?: File | null; planetaId?: string;
}

export function useWishlist() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const itemsQ = useQuery({
    queryKey: ["wishlist", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("itens_wishlist").select("*").order("created_at");
      if (error) throw error;
      return data.map(mapItem);
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["wishlist", userId] });
  }

  async function uploadFoto(file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("wishlist-photos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("wishlist-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  const addItem = useMutation({
    mutationFn: async (input: NovoItemWishlist) => {
      let foto: string | undefined;
      if (input.fotoFile) foto = await uploadFoto(input.fotoFile);
      const { error } = await supabase.from("itens_wishlist").insert({
        user_id: userId, nome: input.nome, valor: input.valor, tier: input.tier,
        descricao: input.descricao || null, link: input.link || null, foto: foto || null, comprado: false,
        planeta_id: input.planetaId || null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTier = useMutation({
    mutationFn: async (input: { id: string; tier: TierWishlist }) => {
      const { error } = await supabase.from("itens_wishlist").update({ tier: input.tier }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updatePlaneta = useMutation({
    mutationFn: async (input: { id: string; planetaId: string | null }) => {
      const { error } = await supabase.from("itens_wishlist").update({ planeta_id: input.planetaId }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("itens_wishlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { items: itemsQ.data ?? [], isLoading: itemsQ.isLoading, addItem, updateTier, updatePlaneta, deleteItem };
}
