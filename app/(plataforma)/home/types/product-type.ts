import type { Database } from "@/types/database";

export type CatalogProduct = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "nome" | "preco" | "preco_promocional" | "tipo_venda" | "imagem_url" | "ativo"
>;
