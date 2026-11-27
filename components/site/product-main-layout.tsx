"use client";

import { useMemo, useState } from "react";

import { ProductImageCarousel } from "@/components/site/product-image-carousel";
import { ProductPurchaseBox, type CatalogVariant } from "@/components/site/product-purchase-box";
import { type Review, ProductReviews } from "@/components/site/product-reviews";
import type { ProductRow } from "@/lib/store/types";

export function ProductMainLayout({
  product,
  images,
  variants,
  reviews,
}: {
  product: ProductRow;
  images: string[];
  variants: CatalogVariant[];
  reviews: Review[];
}) {
  const principalVariant = variants.find((v) => v.is_principal) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(principalVariant?.id ?? null);
  const currentVariant = variants.find((v) => v.id === selectedVariantId) ?? principalVariant;
  const currentImages = useMemo(
    () => Array.from(new Set([...(currentVariant?.imagens ?? []), ...images])),
    [currentVariant, images],
  );

  const nomesDisponiveis =
    Array.from(
      new Set(
        variants
          .map((v) => v.name)
          .filter(Boolean),
      ),
    ).join(", ");

  const materiaisDisponiveis =
    Array.from(
      new Set(
        variants
          .map((v) => v.material)
          .filter(Boolean),
      ),
    ).join(", ");

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 mt-4">

      <div className="min-w-0 lg:col-span-7">
        <ProductImageCarousel key={currentVariant?.id ?? product.id} images={currentImages} alt={product.nome} />
      </div>

      <div className="lg:col-span-5 lg:row-span-3 flex flex-col gap-6">
        <ProductPurchaseBox
          product={product}
          variants={variants}
          selectedVariantId={selectedVariantId}
          onSelectVariant={setSelectedVariantId}
        />
      </div>

      {/* ======================================================
          3. CARACTERÍSTICAS
          ====================================================== */}

      <div className="lg:col-span-7 bg-card border border-border/60 rounded-[var(--panel-radius)] p-6 shadow-sm">

        <h2 className="text-lg font-bold text-foreground mb-4">
          Características do produto
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

          {nomesDisponiveis && (
            <div className="flex justify-between py-2 border-b border-border/45">
              <span className="text-muted-foreground">
                Variações
              </span>

              <span className="font-medium text-foreground capitalize">
                {nomesDisponiveis}
              </span>
            </div>
          )}

          {materiaisDisponiveis && (
            <div className="flex justify-between py-2 border-b border-border/45">
              <span className="text-muted-foreground">
                Material
              </span>

              <span className="font-medium text-foreground capitalize">
                {materiaisDisponiveis}
              </span>
            </div>
          )}

          {product.garantia_dias !== null &&
            product.garantia_dias > 0 && product.garantia_tipo !== "nenhuma" && (
              <div className="flex justify-between py-2 border-b border-border/45">
                <span className="text-muted-foreground">
                  Garantia
                </span>

                <span className="font-medium text-foreground">
                  {product.garantia_dias} dias (
                  {product.garantia_tipo ||
                    "vendedor"}
                  )
                </span>
              </div>
            )}

          <div className="flex justify-between py-2 border-b border-border/45">
            <span className="text-muted-foreground">
              Retirada no local
            </span>

            <span className="font-medium text-foreground">
              {product.permite_retirada
                ? "Disponível"
                : "Indisponível"}
            </span>
          </div>

        </div>
      </div>

      {/* ======================================================
          4. DESCRIÇÃO E AVALIAÇÕES
          ====================================================== */}

      <div className="lg:col-span-7 flex flex-col gap-6">

        <div className="bg-card border border-border/60 rounded-[var(--panel-radius)] p-6 shadow-sm">

          <h2 className="text-lg font-bold text-foreground mb-4">
            Descrição
          </h2>

          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
            {product.descricao}
          </p>

        </div>

        <div className="pt-4 border-t border-border/60">

          <h2 className="text-xl font-bold mb-6 tracking-tight text-foreground">
            Opiniões do produto
          </h2>

          <ProductReviews
            productId={product.id}
            initialReviews={reviews}
          />

        </div>

      </div>
    </div>
  );
}