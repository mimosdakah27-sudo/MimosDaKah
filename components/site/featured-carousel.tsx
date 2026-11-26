import type { CatalogProduct } from "@/app/(plataforma)/home/types/product-type";
import { ProductCard } from "./product-card";

export function FeaturedCarousel({ products }: { products: CatalogProduct[] }) {
  return (
    <ul className="flex snap-x snap-proximity gap-3 overflow-x-auto p-1 sm:grid sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id} className="w-[min(82%,23rem)] shrink-0 snap-start sm:w-auto">
          <ProductCard product={product} compact />
        </li>
      ))}
    </ul>
  );
}
