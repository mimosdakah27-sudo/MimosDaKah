"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, ShoppingBag, Store, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/cart";
import { formatBRL } from "@/lib/utils";
import Image from "next/image";

export function ProductPurchaseBox({
  product,
  variants,
  selectedVariantId,
  onSelectVariant,
}: {
  product: any;
  variants: any[];
  selectedVariantId: string | null;
  onSelectVariant: (id: string) => void;
}) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [loading, setLoading] = useState(false);

  const principalVariant = variants.find((v) => v.is_principal) || variants[0];
  const currentVariant =
    variants.find((v) => v.id === selectedVariantId) || principalVariant;

  const currentImages = useMemo(() => {
    const variantImgs = Array.isArray(currentVariant?.imagens)
      ? (currentVariant.imagens as string[])
      : [];
    if (variantImgs.length > 0) return variantImgs;
    return [product.imagem_url].filter(Boolean);
  }, [currentVariant, product.imagem_url]);

  // Lógica de Preço Promocional e Desconto
  const finalPrice = product.preco_promocional && product.preco_promocional > 0 && product.preco_promocional < product.preco
    ? product.preco_promocional 
    : product.preco || 0;

  const regularPrice = product.preco || 0;
  const hasPromo = product.preco_promocional && product.preco_promocional > 0 && product.preco_promocional < regularPrice;

  let discountPercentage = 0;
  if (hasPromo) {
    discountPercentage = Math.round(
      ((regularPrice - product.preco_promocional) / regularPrice) * 100,
    );
  }

  const parcelasMax = 10;
  const installmentValue = finalPrice / parcelasMax;

  const handleAddToCart = () => {
    const itemPayload = {
      ...product,
      imagem_url: currentImages[0] || product.imagem_url,
      variant_id: currentVariant?.id,
      name: currentVariant?.name, // Atualizado de cor para name
      nome: `${product.nome}${currentVariant?.name ? ` - ${currentVariant.name}` : ""}`,
    };

    add(itemPayload, 1);
    toast.success("Produto adicionado ao carrinho!");
  };

  const handleBuyNow = () => {
    setLoading(true);
    const itemPayload = {
      ...product,
      imagem_url: currentImages[0] || product.imagem_url,
      variant_id: currentVariant?.id,
      name: currentVariant?.name, // Atualizado de cor para name
      nome: `${product.nome}${currentVariant?.name ? ` - ${currentVariant.name}` : ""}`,
    };

    add(itemPayload, 1);
    router.push("/checkout");
  };

  return (
    <div className="bg-card border border-border/60 p-6 shadow-sm sticky top-6 space-y-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        <span>{product.condicao || "Novo"}</span>
        <span>{product.categoria || "Mimos Personalizados"}</span>
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
        {product.nome}
      </h1>

      {/* Preços com suporte a promoção e desconto */}
      <div className="space-y-1">
        {hasPromo && (
          <span className="text-xs text-muted-foreground line-through block">
            {formatBRL(regularPrice)}
          </span>
        )}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {formatBRL(finalPrice)}
          </span>
          {discountPercentage > 0 && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5">
              {discountPercentage}% OFF
            </span>
          )}
        </div>
        <div className="text-sm text-emerald-600 font-medium">
          em {parcelasMax}x {formatBRL(installmentValue)} sem juros
        </div>
      </div>

      {/* Variantes */}
      {variants.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
            Variação:{" "}
            <span className="font-normal text-muted-foreground">
              {currentVariant?.name}
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const variantImages = Array.isArray(v.imagens)
                ? (v.imagens as string[])
                : [];
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    onSelectVariant(v.id);
                  }}
                  className={`border p-1 flex items-center gap-2 transition-all ${
                    v.id === currentVariant?.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  {variantImages[0] && (
                    <div className="relative w-8 h-8 overflow-hidden border border-border">
                      <Image
                        src={variantImages[0]}
                        alt={v.name || "Variante"}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-xs font-medium px-1">{v.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Benefícios */}
      <div className="space-y-3 pt-2 text-xs text-muted-foreground">
        {product.permite_retirada && (
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Store className="h-4 w-4 text-primary" />
            <span>Retirada pessoalmente disponível</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-emerald-600" />
          <span>Frete calculado na hora da compra</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>
            Compra Garantida, receba o produto esperado ou devolvemos o
            dinheiro.
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={handleBuyNow}
            disabled={loading}
            className="w-full font-bold shadow-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              "Comprar agora"
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full font-semibold border-primary/40 text-primary hover:bg-primary/10"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Adicionar ao carrinho
          </Button>
        </div>
      </div>

      {/* Meios de Pagamento */}
      <div className="pt-4 border-t border-border/40 space-y-4">
        <span className="text-sm font-semibold text-foreground block">
          Meios de pagamento
        </span>

        <div className="space-y-3 text-xs text-muted-foreground">
          <div>
            <span className="block font-medium text-foreground mb-0.5">
              Cartão de Crédito
            </span>
            <p className="text-[11px]">
              Parcelamento em até {parcelasMax}x sem juros (Visa, Mastercard,
              American Express, Elo, Hipercard)
            </p>
          </div>

          <div>
            <span className="block font-medium text-foreground mb-0.5">
              Pix
            </span>
            <p className="text-[11px] text-emerald-600 font-semibold">
              Aprovação imediata com desconto
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger
            render={
              <button className="text-xs text-primary hover:underline font-medium block pt-1 cursor-pointer">
                Confira outros meios de pagamento
              </button>
            }
          ></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Outros meios de pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-sm text-muted-foreground">
              <p>
                Aceitamos transferências bancárias, cartões virtuais e boleto.
              </p>
              <p className="text-xs bg-secondary p-3 text-foreground">
                Todas as transações são criptografadas e processadas com total
                segurança.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}