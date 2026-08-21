"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, MessageCircle, ShieldCheck, ShoppingBag, Store, Truck, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/cart";
import { formatBRL } from "@/lib/utils";
import Image from "next/image";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";

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
  const setOpen = useCart((s) => s.setOpen);
  const { config } = useStore();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const tipoVenda = product.tipo_venda || "normal";
  const isOrcamento = tipoVenda === "orcamento";
  const isWhatsappFinalizacao = tipoVenda === "whatsapp_finalizacao";

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
  const hasPromo = !isOrcamento && product.preco_promocional && product.preco_promocional > 0 && product.preco_promocional < regularPrice;

  let discountPercentage = 0;
  if (hasPromo) {
    discountPercentage = Math.round(
      ((regularPrice - product.preco_promocional) / regularPrice) * 100,
    );
  }

  const parcelasMax = 10;
  const installmentValue = finalPrice / parcelasMax;

  const handleOpenWhatsAppOrcamento = () => {
    const phone = config?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (!cleanPhone) {
      toast.error("O WhatsApp da loja não está configurado.");
      return;
    }

    const userName = profile?.display_name || "Cliente";
    const userEmail = profile?.email || "";
    const userPhone = profile?.phone || "";
    const productIdShort = product.id ? product.id.substring(0, 8) : "";
    const variantText = currentVariant?.name ? ` - Variação: ${currentVariant.name}` : "";
    const materialText = currentVariant?.material ? ` (Material: ${currentVariant.material})` : "";

    // Pega a URL exata do produto para anexar na mensagem
    const productUrl = typeof window !== "undefined" ? window.location.href : "";

    const message = `Olá! Gostaria de fazer um orçamento / solicitar informações sobre o produto:
*${product.nome}*${variantText}${materialText}
*(ID: #${productIdShort})*

*Link do Produto:* ${productUrl}

*Dados do Cliente:*
- Nome: ${userName}${userPhone ? `\n- Telefone: ${userPhone}` : ""}${userEmail ? `\n- E-mail: ${userEmail}` : ""}

Poderia me passar mais detalhes?`;
    
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleAddToCart = () => {
    if (loading) return;
    const itemPayload = {
      ...product,
      imagem_url: currentImages[0] || product.imagem_url,
      variant_id: currentVariant?.id,
      name: currentVariant?.name,
      material: currentVariant?.material,
      nome: `${product.nome}${currentVariant?.name ? ` - ${currentVariant.name}` : ""}`,
    };

    add(itemPayload, 1);
    setOpen(true);
    toast.success("Produto adicionado ao carrinho!");
  };

  const handleBuyNow = () => {
    if (loading) return;
    setLoading(true);

    const itemPayload = {
      ...product,
      imagem_url: currentImages[0] || product.imagem_url,
      variant_id: currentVariant?.id,
      name: currentVariant?.name,
      material: currentVariant?.material,
      nome: `${product.nome}${currentVariant?.name ? ` - ${currentVariant.name}` : ""}`,
    };

    add(itemPayload, 1);

    if (isWhatsappFinalizacao) {
      router.push("/checkout?whatsapp_flow=true");
    } else {
      router.push("/checkout");
    }
  };

  const hasValidVariants = variants.length > 1 || (variants.length === 1 && Boolean(variants[0]?.name && variants[0].name.trim() !== ""));

  return (
    <div className={`bg-card border border-border/60 p-6 shadow-sm sticky top-6 space-y-5 transition-opacity ${loading ? "pointer-events-none opacity-80" : ""}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        <span>{product.condicao || "Novo"}</span>
        <span>{product.categoria || "Mimos Personalizados"}</span>
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
        {product.nome}
      </h1>

      {/* Seção de Preço ou Aviso de Orçamento */}
      {isOrcamento ? (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
            <HelpCircle className="h-4 w-4" /> Produto sob Consulta
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este produto possui muitas variações personalizadas. Clique abaixo para solicitar seu orçamento personalizado direto no WhatsApp da loja.
          </p>
        </div>
      ) : (
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
      )}

      {/* Aviso para produtos que finalizam no WhatsApp */}
      {isWhatsappFinalizacao && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
            <MessageCircle className="h-4 w-4" /> Atendimento Personalizado no Zap
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este produto é totalmente personalizado! Ao finalizar a compra, você será redirecionada para o WhatsApp da dona da loja para definir todos os detalhes da arte e do produto certinho.
          </p>
        </div>
      )}

      {/* Seletor de variantes */}
      {hasValidVariants && (
        <div className="space-y-2 pt-2">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Variação:{" "}
              <span className="font-normal text-muted-foreground">
                {currentVariant?.name}
              </span>
            </span>
            {currentVariant?.material && (
              <span className="text-[11px] text-muted-foreground block font-medium">
                Material: <span className="text-foreground">{currentVariant.material}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const variantImages = Array.isArray(v.imagens)
                ? (v.imagens as string[])
                : [];
              return (
                <button
                  key={v.id}
                  disabled={loading}
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
        {isOrcamento ? (
          <Button
            disabled={loading}
            onClick={handleOpenWhatsAppOrcamento}
            className="w-full font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
            Fazer Orçamento no WhatsApp
          </Button>
        ) : (
          <div className="flex flex-col gap-2.5">
            <Button
              onClick={handleBuyNow}
              disabled={loading}
              className="w-full font-bold shadow-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : isWhatsappFinalizacao ? (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comprar e Finalizar no WhatsApp
                </>
              ) : (
                "Comprar agora"
              )}
            </Button>

            <Button
              variant="outline"
              disabled={loading}
              className="w-full font-semibold border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Adicionar ao carrinho
            </Button>
          </div>
        )}
      </div>

      {/* Meios de Pagamento */}
      {!isOrcamento && (
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
                <button disabled={loading} className="text-xs text-primary hover:underline font-medium block pt-1 cursor-pointer">
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
      )}
    </div>
  );
}