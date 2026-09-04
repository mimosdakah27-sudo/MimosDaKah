"use client";

import {
  HelpCircle,
  Loader2,
  MessageCircle,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
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

  const add = useCart(
    (s) => s.add,
  );

  const setOpen = useCart(
    (s) => s.setOpen,
  );

  const { config } =
    useStore();

  const { profile } =
    useAuth();

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // TIPO DE VENDA
  // ==========================================================

  const tipoVenda =
    product.tipo_venda ||
    "normal";

  const isOrcamento =
    tipoVenda === "orcamento";

  const isWhatsappFinalizacao =
    tipoVenda ===
    "whatsapp_finalizacao";

  // ==========================================================
  // VARIAÇÃO
  // ==========================================================

  const principalVariant =
    variants.find(
      (v) => v.is_principal,
    ) || variants[0];

  const currentVariant =
    variants.find(
      (v) =>
        v.id ===
        selectedVariantId,
    ) || principalVariant;

  // ==========================================================
  // IMAGENS
  // ==========================================================

  const currentImages =
    useMemo(() => {
      const variantImgs =
        Array.isArray(
          currentVariant?.imagens,
        )
          ? (currentVariant.imagens as string[])
          : [];

      if (
        variantImgs.length > 0
      ) {
        return variantImgs;
      }

      return [
        product.imagem_url,
      ].filter(Boolean);
    }, [
      currentVariant,
      product.imagem_url,
    ]);

  // ==========================================================
  // PREÇO
  // ==========================================================

  const regularPrice =
    Number(product.preco) || 0;

  const promotionalPrice =
    Number(
      product.preco_promocional,
    ) || 0;

  const hasPromo =
    !isOrcamento &&
    promotionalPrice > 0 &&
    promotionalPrice <
      regularPrice;

  const finalPrice =
    hasPromo
      ? promotionalPrice
      : regularPrice;

  let discountPercentage = 0;

  if (
    hasPromo &&
    regularPrice > 0
  ) {
    discountPercentage =
      Math.round(
        ((regularPrice -
          promotionalPrice) /
          regularPrice) *
          100,
      );
  }

  // ==========================================================
  // WHATSAPP — ORÇAMENTO
  // ==========================================================

  const handleOpenWhatsAppOrcamento =
    () => {
      const phone =
        config?.phone || "";

      const cleanPhone =
        phone.replace(
          /\D/g,
          "",
        );

      if (!cleanPhone) {
        toast.error(
          "O WhatsApp da loja não está configurado.",
        );

        return;
      }

      const userName =
        profile?.display_name ||
        "Cliente";

      const userPhone =
        profile?.phone || "";

      const productIdShort =
        product.id
          ? product.id.substring(
              0,
              8,
            )
          : "";

      const variantText =
        currentVariant?.name
          ? `\n- Variação: ${currentVariant.name}`
          : "";

      const materialText =
        currentVariant?.material
          ? `\n- Material: ${currentVariant.material}`
          : "";

      const productUrl =
        typeof window !==
        "undefined"
          ? window.location.href
          : "";

      const message = `Olá! Gostaria de solicitar um orçamento.

*Produto:* ${product.nome}
*ID:* #${productIdShort}${variantText}${materialText}

*Link do produto:*
${productUrl}

*Cliente:* ${userName}${
        userPhone
          ? `\n*Telefone:* ${userPhone}`
          : ""
      }

Gostaria de saber o valor e os detalhes para realizar o pedido.`;

      const url =
        `https://wa.me/55${cleanPhone}?text=` +
        encodeURIComponent(
          message,
        );

      window.open(
        url,
        "_blank",
      );
    };

  // ==========================================================
  // ITEM PARA O CARRINHO
  // ==========================================================

  const createCartItem =
    () => {
      return {
        ...product,

        imagem_url:
          currentImages[0] ||
          product.imagem_url,

        variant_id:
          currentVariant?.id,

        name:
          currentVariant?.name,

        material:
          currentVariant?.material,

        nome: `${product.nome}${
          currentVariant?.name
            ? ` - ${currentVariant.name}`
            : ""
        }`,

        product_url:
          typeof window !==
          "undefined"
            ? window.location.href
            : "",
      };
    };

  // ==========================================================
  // ADICIONAR AO CARRINHO
  // ==========================================================

  const handleAddToCart =
    () => {
      if (loading) return;

      const itemPayload =
        createCartItem();

      add(
        itemPayload,
        1,
      );

      setOpen(true);

      toast.success(
        "Produto adicionado ao pedido!",
      );
    };

  // ==========================================================
  // MONTAR PEDIDO
  // ==========================================================

  const handleBuyNow =
    () => {
      if (loading) return;

      setLoading(true);

      const itemPayload =
        createCartItem();

      add(
        itemPayload,
        1,
      );

      /*
       * O site não realiza pagamento.
       *
       * O checkout agora funciona como
       * montagem/revisão do pedido.
       *
       * No final, o cliente poderá enviar
       * o pedido diretamente para o WhatsApp.
       */

      router.push(
        "/checkout",
      );
    };

  // ==========================================================
  // VARIAÇÕES
  // ==========================================================

  const hasValidVariants =
    variants.length > 1 ||
    (
      variants.length === 1 &&
      Boolean(
        variants[0]?.name &&
        variants[0].name.trim() !== "",
      )
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className={`bg-card border border-border/60 p-6 shadow-sm sticky top-6 space-y-5 transition-opacity ${
        loading
          ? "pointer-events-none opacity-80"
          : ""
      }`}
    >

      {/* ======================================================
          CATEGORIA
          ====================================================== */}

      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        <span>
          {product.condicao ||
            "Novo"}
        </span>

        <span>
          {product.categoria ||
            "Mimos Personalizados"}
        </span>
      </div>

      {/* ======================================================
          NOME
          ====================================================== */}

      <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
        {product.nome}
      </h1>

      {/* ======================================================
          PREÇO / ORÇAMENTO
          ====================================================== */}

      {isOrcamento ? (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">

          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
            <HelpCircle className="h-4 w-4" />

            Produto sob orçamento
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Este produto possui
            opções de
            personalização.
            Solicite o valor
            diretamente pelo
            WhatsApp da loja.
          </p>

        </div>
      ) : (
        <div className="space-y-1">

          {hasPromo && (
            <span className="text-xs text-muted-foreground line-through block">
              {formatBRL(
                regularPrice,
              )}
            </span>
          )}

          <div className="flex items-center gap-3">

            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {formatBRL(
                finalPrice,
              )}
            </span>

            {discountPercentage >
              0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5">
                {discountPercentage}%
                OFF
              </span>
            )}

          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Valor informado no
            catálogo. Para confirmar
            disponibilidade, entrega e
            forma de pagamento, fale
            diretamente com a loja.
          </p>

        </div>
      )}

      {/* ======================================================
          PRODUTO PERSONALIZADO
          ====================================================== */}

      {isWhatsappFinalizacao && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">

          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
            <MessageCircle className="h-4 w-4" />

            Atendimento pelo WhatsApp
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Este produto é
            personalizado. Envie sua
            solicitação pelo WhatsApp
            para combinar todos os
            detalhes, entrega e
            pagamento com a loja.
          </p>

        </div>
      )}

      {/* ======================================================
          VARIAÇÕES
          ====================================================== */}

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
                Material:{" "}
                <span className="text-foreground">
                  {
                    currentVariant.material
                  }
                </span>
              </span>
            )}

          </div>

          <div className="flex flex-wrap gap-2">

            {variants.map(
              (v) => {
                const variantImages =
                  Array.isArray(
                    v.imagens,
                  )
                    ? (v.imagens as string[])
                    : [];

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      onSelectVariant(
                        v.id,
                      )
                    }
                    className={`border p-1 flex items-center gap-2 transition-all ${
                      v.id ===
                      currentVariant?.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border/60 hover:border-border"
                    }`}
                  >

                    {variantImages[0] && (
                      <div className="relative w-8 h-8 overflow-hidden border border-border">

                        <Image
                          src={
                            variantImages[0]
                          }
                          alt={
                            v.name ||
                            "Variante"
                          }
                          fill
                          sizes="32px"
                          className="object-cover"
                        />

                      </div>
                    )}

                    <span className="text-xs font-medium px-1">
                      {v.name}
                    </span>

                  </button>
                );
              },
            )}

          </div>
        </div>
      )}

      {/* ======================================================
          INFORMAÇÕES
          ====================================================== */}

      <div className="space-y-3 pt-2 text-xs text-muted-foreground">

        {product.permite_retirada && (
          <div className="flex items-center gap-2 text-foreground font-medium">

            <Store className="h-4 w-4 text-primary" />

            <span>
              Retirada na loja
              disponível
            </span>

          </div>
        )}

        <div className="flex items-center gap-2">

          <Truck className="h-4 w-4 text-emerald-600" />

          <span>
            Consulte as opções de
            entrega diretamente com
            a loja.
          </span>

        </div>

        <div className="flex items-center gap-2">

          <MessageCircle className="h-4 w-4 text-emerald-600" />

          <span>
            Pedido e pagamento são
            combinados diretamente
            com a loja pelo WhatsApp.
          </span>

        </div>

      </div>

      {/* ======================================================
          AÇÕES
          ====================================================== */}

      <div className="space-y-3 pt-4 border-t border-border/40">

        {/* ORÇAMENTO */}

        {isOrcamento ? (
          <Button
            type="button"
            disabled={loading}
            onClick={
              handleOpenWhatsAppOrcamento
            }
            className="w-full font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}

            Solicitar orçamento
          </Button>
        ) : (
          <div className="flex flex-col gap-2.5">

            {/* BOTÃO PRINCIPAL */}

            <Button
              type="button"
              onClick={
                handleBuyNow
              }
              disabled={loading}
              className="w-full font-bold shadow-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : isWhatsappFinalizacao ? (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />

                  Pedir pelo WhatsApp
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />

                  Montar pedido
                </>
              )}
            </Button>

            {/* CARRINHO */}

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="w-full font-semibold border-primary/40 text-primary hover:bg-primary/10"
              onClick={
                handleAddToCart
              }
            >
              <ShoppingBag className="h-4 w-4 mr-2" />

              Adicionar ao carrinho
            </Button>

          </div>
        )}

      </div>

      {/* ======================================================
          AVISO FINAL
          ====================================================== */}

      {!isOrcamento && (
        <div className="pt-4 border-t border-border/40">

          <div className="rounded-xl bg-muted/50 border border-border/50 p-3">

            <div className="flex items-center gap-2 mb-1">

              <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />

              <span className="text-xs font-semibold text-foreground">
                Como funciona?
              </span>

            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              O site serve para
              apresentar os produtos e
              montar seu pedido. No final,
              você poderá enviar o pedido
              pelo WhatsApp para confirmar
              os detalhes, entrega e forma
              de pagamento diretamente com
              a loja.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}