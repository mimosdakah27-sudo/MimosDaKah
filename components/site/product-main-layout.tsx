"use client";

import { ProductPurchaseBox } from "@/components/site/product-purchase-box";
import { ProductReviews } from "@/components/site/product-reviews";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  MessageCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

// ============================================================
// IMAGEM DO CARROSSEL
// ============================================================

function CarouselImageItem({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative flex-[0_0_100%] min-w-0 h-full w-full flex items-center justify-center select-none bg-muted/50">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted animate-pulse z-10">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />

          <span className="text-xs text-muted-foreground">
            Carregando imagem...
          </span>
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={80}
        sizes="(max-width: 768px) 100vw, 66vw"
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        className={cn(
          "object-contain p-2 transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
}

// ============================================================
// LAYOUT PRINCIPAL
// ============================================================

export function ProductMainLayout({
  product,
  variants,
  reviews,
}: {
  product: any;
  variants: any[];
  reviews: any[];
}) {
  const principalVariant =
    variants.find((v) => v.is_principal) || variants[0];

  const [selectedVariantId, setSelectedVariantId] =
    useState<string | null>(
      principalVariant?.id || null,
    );

  const [activeImageIndex, setActiveImageIndex] =
    useState(0);

  const [emblaRef, emblaApi] =
    useEmblaCarousel({
      loop: true,
      watchDrag: true,
    });

  const tipoVenda =
    product.tipo_venda || "normal";

  const isOrcamento =
    tipoVenda === "orcamento";

  const isWhatsappFinalizacao =
    tipoVenda === "whatsapp_finalizacao";

  const currentVariant =
    variants.find(
      (v) => v.id === selectedVariantId,
    ) || principalVariant;

  // ==========================================================
  // IMAGENS
  // ==========================================================

  const currentImages = useMemo(() => {
    const variantImgs =
      Array.isArray(currentVariant?.imagens)
        ? (currentVariant.imagens as string[])
        : [];

    if (variantImgs.length > 0) {
      return variantImgs;
    }

    return [product.imagem_url].filter(Boolean);
  }, [
    currentVariant,
    product.imagem_url,
  ]);

  // ==========================================================
  // CONTROLE DO CARROSSEL
  // ==========================================================

  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    setActiveImageIndex(
      emblaApi.selectedScrollSnap(),
    );
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();

    emblaApi.on(
      "select",
      onSelect,
    );

    emblaApi.on(
      "reInit",
      onSelect,
    );

    return () => {
      emblaApi.off(
        "select",
        onSelect,
      );

      emblaApi.off(
        "reInit",
        onSelect,
      );
    };
  }, [
    emblaApi,
    onSelect,
  ]);

  const handleThumbnailClick =
    useCallback(
      (index: number) => {
        setActiveImageIndex(index);

        if (emblaApi) {
          emblaApi.scrollTo(index);
        }
      },
      [emblaApi],
    );

  const scrollPrev =
    useCallback(() => {
      if (emblaApi) {
        emblaApi.scrollPrev();
      }
    }, [emblaApi]);

  const scrollNext =
    useCallback(() => {
      if (emblaApi) {
        emblaApi.scrollNext();
      }
    }, [emblaApi]);

  // ==========================================================
  // CARACTERÍSTICAS
  // ==========================================================

  const nomesDisponiveis =
    Array.from(
      new Set(
        variants
          .map((v: any) => v.name)
          .filter(Boolean),
      ),
    ).join(", ");

  const materiaisDisponiveis =
    Array.from(
      new Set(
        variants
          .map((v: any) => v.material)
          .filter(Boolean),
      ),
    ).join(", ");

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 mt-4">

      {/* ======================================================
          1. GALERIA
          ====================================================== */}

      <div className="lg:col-span-8 flex flex-col gap-6">

        {/* AVISO WHATSAPP */}

        {isWhatsappFinalizacao && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0" />

            <span>
              <strong>Atendimento pelo WhatsApp:</strong>{" "}
              Este produto é personalizado. Você poderá
              enviar sua solicitação diretamente para a loja
              pelo WhatsApp e combinar todos os detalhes do
              produto, entrega e pagamento.
            </span>
          </div>
        )}

        {/* AVISO ORÇAMENTO */}

        {isOrcamento && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <HelpCircle className="h-4 w-4 shrink-0" />

            <span>
              <strong>Produto sob orçamento:</strong>{" "}
              Solicite o valor e os detalhes diretamente
              pelo WhatsApp da loja.
            </span>
          </div>
        )}

        {/* GALERIA */}

        <div className="bg-card border border-border/60 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3 sm:gap-4">

          {/* IMAGEM PRINCIPAL */}

          <div className="relative flex-1 w-full rounded-xl overflow-hidden bg-muted order-1 sm:order-2 group aspect-square sm:aspect-auto sm:min-h-[425px]">

            <div
              className="overflow-hidden h-full w-full touch-pan-y"
              ref={emblaRef}
            >
              <div className="flex h-full w-full">

                {currentImages.length > 0 ? (
                  currentImages.map(
                    (
                      img: string,
                      idx: number,
                    ) => (
                      <CarouselImageItem
                        key={`${img}-${idx}`}
                        src={img}
                        alt={
                          product.nome ||
                          "Produto"
                        }
                        priority={
                          idx === 0
                        }
                      />
                    ),
                  )
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
                    Sem imagem
                  </div>
                )}

              </div>
            </div>

            {/* SETAS */}

            {currentImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={scrollPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/80 hover:bg-background border border-border/60 shadow-md flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                </button>

                <button
                  type="button"
                  onClick={scrollNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/80 hover:bg-background border border-border/60 shadow-md flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                </button>
              </>
            )}

          </div>

          {/* MINIATURAS */}

          <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[450px] order-2 sm:order-1 scrollbar-thin py-1 sm:py-0">

            {currentImages.map(
              (
                img: string,
                idx: number,
              ) => (
                <button
                  type="button"
                  key={`${img}-thumbnail-${idx}`}
                  onClick={() =>
                    handleThumbnailClick(
                      idx,
                    )
                  }
                  className={cn(
                    "relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-muted",
                    activeImageIndex ===
                      idx
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border/60 hover:border-border opacity-70 hover:opacity-100",
                  )}
                  aria-label={`Selecionar imagem ${
                    idx + 1
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Miniatura ${
                      idx + 1
                    }`}
                    fill
                    sizes="64px"
                    quality={60}
                    className="object-cover"
                  />
                </button>
              ),
            )}

          </div>
        </div>
      </div>

      {/* ======================================================
          2. BOX DO PRODUTO
          ====================================================== */}

      <div className="lg:col-span-4 lg:row-span-3 flex flex-col gap-6">
        <ProductPurchaseBox
          product={product}
          variants={variants}
          selectedVariantId={
            selectedVariantId
          }
          onSelectVariant={(id) => {
            setSelectedVariantId(id);
            handleThumbnailClick(0);
          }}
        />
      </div>

      {/* ======================================================
          3. CARACTERÍSTICAS
          ====================================================== */}

      <div className="lg:col-span-8 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">

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

          {product.weight !== null &&
            product.weight !== undefined && (
              <div className="flex justify-between py-2 border-b border-border/45">
                <span className="text-muted-foreground">
                  Peso
                </span>

                <span className="font-medium text-foreground">
                  {product.weight} kg
                </span>
              </div>
            )}

          {product.garantia_dias !== null &&
            product.garantia_dias > 0 && (
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

      <div className="lg:col-span-8 flex flex-col gap-6">

        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">

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