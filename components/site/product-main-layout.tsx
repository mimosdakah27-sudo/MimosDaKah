// --- 4. components/site/product-main-layout.tsx ---
"use client";

import { ProductPurchaseBox } from "@/components/site/product-purchase-box";
import { ProductReviews } from "@/components/site/product-reviews";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";
import { MessageCircle, HelpCircle } from "lucide-react";

export function ProductMainLayout({
  product,
  variants,
  reviews,
}: {
  product: any;
  variants: any[];
  reviews: any[];
}) {
  const principalVariant = variants.find((v) => v.is_principal) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    principalVariant?.id || null,
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const tipoVenda = product.tipo_venda || "normal";
  const isOrcamento = tipoVenda === "orcamento";
  const isWhatsappFinalizacao = tipoVenda === "whatsapp_finalizacao";

  const currentVariant =
    variants.find((v) => v.id === selectedVariantId) || principalVariant;

  const currentImages = useMemo(() => {
    const variantImgs = Array.isArray(currentVariant?.imagens)
      ? (currentVariant.imagens as string[])
      : [];
    if (variantImgs.length > 0) return variantImgs;
    return [product.imagem_url].filter(Boolean);
  }, [currentVariant, product.imagem_url]);

  const nomesDisponiveis = Array.from(
    new Set(variants.map((v: any) => v.name).filter(Boolean)),
  ).join(", ");
  
  const materiaisDisponiveis = Array.from(
    new Set(variants.map((v: any) => v.material).filter(Boolean)),
  ).join(", ");

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 mt-4">
      
      {/* 1. CARROSSEL */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Banner de aviso no topo da foto se for finalização no WhatsApp */}
        {isWhatsappFinalizacao && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Aviso importante:</strong> Este produto é personalizado. Após concluir a compra, você será redirecionada para o WhatsApp da loja para acertar todos os detalhes da arte e do produto.
            </span>
          </div>
        )}

        {isOrcamento && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Produto sob Orçamento:</strong> Devido às muitas variações e opções de personalização, os valores são calculados sob medida através do WhatsApp.
            </span>
          </div>
        )}

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
          
          {/* Miniaturas */}
          <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[450px] order-2 sm:order-1 scrollbar-thin">
            {currentImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={cn(
                  "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-muted",
                  activeImageIndex === idx
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/60 hover:border-border opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={img}
                  alt={`Miniatura ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Imagem Principal */}
          <div className="relative flex-1 rounded-xl overflow-hidden bg-muted flex items-center justify-center min-h-[380px] sm:min-h-[425px] order-1 sm:order-2">
            {currentImages[activeImageIndex] ? (
              <Image
                src={currentImages[activeImageIndex]}
                alt={product.nome || "Produto"}
                fill
                priority={activeImageIndex === 0}
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Sem imagem</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. BUY BOX */}
      <div className="lg:col-span-4 lg:row-span-3 flex flex-col gap-6">
        <ProductPurchaseBox
          product={product}
          variants={variants}
          selectedVariantId={selectedVariantId}
          onSelectVariant={(id) => {
            setSelectedVariantId(id);
            setActiveImageIndex(0);
          }}
        />
      </div>

      {/* 3. CARACTERÍSTICAS */}
      <div className="lg:col-span-8 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Características do produto
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {nomesDisponiveis && (
            <div className="flex justify-between py-2 border-b border-border/45">
              <span className="text-muted-foreground">Variações</span>
              <span className="font-medium text-foreground capitalize">{nomesDisponiveis}</span>
            </div>
          )}
          {materiaisDisponiveis && (
            <div className="flex justify-between py-2 border-b border-border/45">
              <span className="text-muted-foreground">Material</span>
              <span className="font-medium text-foreground capitalize">{materiaisDisponiveis}</span>
            </div>
          )}
          {product.weight !== null && product.weight !== undefined && (
            <div className="flex justify-between py-2 border-b border-border/45">
              <span className="text-muted-foreground">Peso</span>
              <span className="font-medium text-foreground">{product.weight} kg</span>
            </div>
          )}
          {product.garantia_dias !== null && product.garantia_dias > 0 && (
            <div className="flex justify-between py-2 border-b border-border/45">
              <span className="text-muted-foreground">Garantia</span>
              <span className="font-medium text-foreground">
                {product.garantia_dias} dias ({product.garantia_tipo || "vendedor"})
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-border/45">
            <span className="text-muted-foreground">Retirada no local</span>
            <span className="font-medium text-foreground">
              {product.permite_retirada ? "Disponível" : "Indisponível"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. DESCRIÇÃO E AVALIAÇÕES */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Descrição</h2>
          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
            {product.descricao}
          </p>
        </div>

        <div className="pt-4 border-t border-border/60">
          <h2 className="text-xl font-bold mb-6 tracking-tight text-foreground">
            Opiniões do produto
          </h2>
          <ProductReviews productId={product.id} initialReviews={reviews} />
        </div>
      </div>

    </div>
  );
}