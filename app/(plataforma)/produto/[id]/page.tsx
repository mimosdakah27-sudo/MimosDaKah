// --- 3. app/product/[id]/page.tsx ---
import Link from "next/link";
import { ProductMainLayout } from "@/components/site/product-main-layout";
import { notFound } from "next/navigation";
import { getProductDetails } from "./hooks/use-product-details";

export const revalidate = 30;

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const productId = params.id;

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      productId,
    );
  if (!productId || productId === "undefined" || !isUUID) {
    return notFound();
  }

  const details = await getProductDetails(productId);
  if (!details) return notFound();

  const { product, variants, reviews, images } = details;

  
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