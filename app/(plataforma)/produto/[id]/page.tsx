import { cache } from "react";
import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { ProductMainLayout } from "@/components/site/product-main-layout";
import { notFound } from "next/navigation";
import { getProductDetails } from "./hooks/use-product-details";

export const revalidate = 30;

type ProductPageProps = { params: Promise<{ id: string }> };

const loadProduct = cache(async (productId: string) => {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      productId,
    );
  if (!productId || productId === "undefined" || !isUUID) {
    return notFound();
  }

  const details = await getProductDetails(productId);
  if (!details) return notFound();

  return details;
});

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const { product, images, variants } = await loadProduct(id);
  const primary = variants.find((variant) => variant.is_principal) ?? variants[0];
  const photo = [...(primary?.imagens ?? []), ...images, ...variants.flatMap((variant) => variant.imagens)]
    .find((url) => url && /^https:\/\/|^\/(?!\/)/i.test(url));
  const description = product.descricao?.trim().replace(/\s+/g, " ").slice(0, 180) ||
    `Confira as fotos de ${product.nome} e consulte a entrega pelo CEP.`;
  return pageMetadata(product.nome, description, `/produto/${id}`, photo);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product, variants, reviews, images } = await loadProduct((await params).id);

  
  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Navegação estrutural" className="mb-4 text-sm text-muted-foreground"><Link href="/#produtos" className="underline underline-offset-4">Catálogo</Link> / {product.nome}</nav>

      <ProductMainLayout
        key={product.id}
        images={images}
        product={product}
        variants={variants}
        reviews={reviews}
      />
    </div>
  );
}