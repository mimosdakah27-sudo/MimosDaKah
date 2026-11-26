import { getFullProductDetails } from "../services/get-product";

export async function getProductDetails(id: string) {
  const data = await getFullProductDetails(id);
  if (!data) return null;

  const { product_images, product_variants, reviews, ...product } = data;
  const images = Array.from(new Set([product.imagem_url, ...product_images.map((item) => item.url)].filter(Boolean)));
  const variants = product_variants.map((variant) => ({
    ...variant,
    imagens: Array.isArray(variant.imagens)
      ? variant.imagens.filter((url): url is string => typeof url === "string" && url.length > 0)
      : [],
  }));
  return { product, images, variants, reviews };
}
