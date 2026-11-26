import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";

export async function getFullProductDetails(id: string) {
  return unstable_cache(
    async () => {
      const supabase = supabasePublic;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images ( id, url, position ),
          product_variants ( id, name, material, is_principal, imagens ),
          reviews ( * )
        `)
        .eq("id", id)
        .eq("ativo", true)
        .order("position", { referencedTable: "product_images", ascending: true })
        .order("created_at", { referencedTable: "reviews", ascending: false })
        .maybeSingle();

      if (error) {
        throw new Error("Erro ao carregar detalhes do produto: " + error.message);
      }

      return data;
    },
    [`product-full-${id}`],
    { tags: [`product-${id}`], revalidate: 60 }
  )();
}