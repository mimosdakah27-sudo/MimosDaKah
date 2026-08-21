import { getFullProductDetails } from "../services/get-product";

export async function getProductDetails(id: string) {
  try {
    const data = await getFullProductDetails(id);
    if (!data) return null;

    const { product_images, product_variants, reviews, ...product } = data;

    const extraImages = product_images || [];
    const variants = product_variants || [];

    const extraUrls = extraImages.map((i: any) => i.url);
    const variantImages = variants.flatMap((v: any) =>
      Array.isArray(v.imagens) ? (v.imagens as string[]) : []
    );

    const hasValidVariants =
      variants.length > 0 &&
      variants.some((v: any) => v.name && v.name.trim() !== "");

    const images = Array.from(
      new Set([product.imagem_url, ...extraUrls, ...variantImages])
    ).filter(Boolean) as string[];

    let formattedVariants = variants;

    if (!hasValidVariants) {
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
    }

    return {
      product,
      images,
      variants: formattedVariants,
      reviews: reviews || [],
    };
  } catch (error) {
    console.error("Erro no getProductDetails:", error);
    return null;
  }
}