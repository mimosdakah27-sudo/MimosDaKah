import { unstable_cache } from "next/cache";

import { supabasePublic } from "@/lib/supabase/public";
import type { CatalogProduct } from "../types/product-type";

export const PAGE_SIZE = 12;
const cardColumns = "id,nome,preco,preco_promocional,tipo_venda,imagem_url,ativo";
const cacheOptions = { tags: ["products"], revalidate: 3600 };

async function readProducts(offset: number, limit: number, featured: boolean) {
  const query = <Columns extends string>(columns: Columns) => {
    let request = supabasePublic
      .from("products")
      .select(columns, featured ? {} : { count: "exact" })
      .eq("ativo", true);

    if (featured) request = request.eq("destaque", true);

    return request
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + limit - 1);
  };

  let result = await query(cardColumns);

  // Instalações antigas podem não ter os campos de promoção e de tipo de venda.
  if (result.error?.code === "42703" || result.error?.code === "PGRST204") {
    result = await query("*");
  }

  if (result.error) {
    if (offset > 0 && result.error.code === "PGRST103") {
      return { products: [], total: 0 };
    }
    throw new Error("Falha ao consultar os produtos da vitrine.");
  }

  const products: CatalogProduct[] = (result.data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    preco: row.preco,
    preco_promocional: row.preco_promocional ?? null,
    tipo_venda: row.tipo_venda ?? null,
    imagem_url: row.imagem_url,
    ativo: row.ativo,
  }));

  return { products, total: result.count ?? products.length };
}

export const getProductPage = unstable_cache(
  (page: number) => readProducts((page - 1) * PAGE_SIZE, PAGE_SIZE, false),
  ["catalog-product-page-v1"],
  cacheOptions,
);

export const getFeaturedProducts = unstable_cache(
  async () => (await readProducts(0, 4, true)).products,
  ["catalog-featured-v1"],
  cacheOptions,
);
