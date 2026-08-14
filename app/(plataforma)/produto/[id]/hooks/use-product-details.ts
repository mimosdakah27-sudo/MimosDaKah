// --- 2. hooks/use-product-details.ts ---
import { getProductById, getProductImages, getProductVariants } from "../services/get-product";
import { getProductReviews } from "../services/get-product-reviews";

export async function getProductDetails(id: string) {
  try {
    const product = await getProductById(id);
    if (!product) return null;

    const [extraImages, variants, reviews] = await Promise.all([
      getProductImages(id),
      getProductVariants(id),
      getProductReviews(id),
    ]);

    // Coleta imagens extras da tabela product_images e também imagens vindas do JSONB de product_variants (campo 'imagens')
    const extraUrls = extraImages.map((i) => i.url);
    const variantImages = variants.flatMap((v) => (Array.isArray(v.imagens) ? (v.imagens as string[]) : []));

    // Se não houver variantes cadastradas ou se a única variante não tiver nome/imagens customizadas, 
    // tratamos como produto simples e consolidamos a galeria completa da tabela product_images
    const hasValidVariants = variants.length > 0 && variants.some((v: any) => v.name && v.name.trim() !== "");

    let images: string[];
    let formattedVariants = variants;

    if (!hasValidVariants) {
      // Produto Simples: Agrupa a capa principal + product_images extras de forma limpa e sequencial
      images = Array.from(
        new Set([
          product.imagem_url,
          ...extraUrls,
          ...variantImages,
        ])
      ).filter(Boolean) as string[];

      // Garante que o componente receba uma variante padrão estruturada (spread vem primeiro para evitar conflito)
      formattedVariants = [
        {
          ...variants[0],
          id: variants[0]?.id || "default",
          name: "",
          material: "",
          is_principal: true,
          imagens: images,
        } as any,
      ];
    } else {
      // Produto com Variações
      images = Array.from(
        new Set([
          product.imagem_url,
          ...extraUrls,
          ...variantImages,
        ])
      ).filter(Boolean) as string[];
    }

    return { product, images, variants: formattedVariants, reviews };
  } catch (error) {
    console.error("Erro no getProductDetails:", error);
    return null;
  }
}