"use client";

import { HelpCircle, Loader2, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { cn, formatBRL } from "@/lib/utils";
import type { Database } from "@/types/database";

type ProductRowExtended = Database["public"]["Tables"]["products"]["Row"] & {
  ativo?: boolean;
  destaque?: boolean;
  preco_promocional?: number | null;
  permite_retirada?: boolean;
  tipo_venda?: "normal" | "orcamento" | "whatsapp_finalizacao" | null;
};

interface ProductCardProps {
  product: ProductRowExtended;
  isAdmin?: boolean;
  actions?: React.ReactNode;
  index?: number;
}

export function ProductCard({
  product,
  isAdmin = false,
  actions,
}: ProductCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const isAtivo = product.ativo !== false;
  const tipoVenda = product.tipo_venda || "normal";

  const isOrcamento = tipoVenda === "orcamento";
  const isWhatsappFinalizacao = tipoVenda === "whatsapp_finalizacao";

  // Preços
  const precoRegular = product.preco || 0;
  const precoPromo = product.preco_promocional;

  const temPromocao =
    !isOrcamento &&
    precoPromo &&
    precoPromo > 0 &&
    precoPromo < precoRegular;

  const precoAtual = temPromocao ? precoPromo : precoRegular;

  // Desconto
  let descontoPercentual = 0;

  if (temPromocao) {
    descontoPercentual = Math.round(
      ((precoRegular - precoPromo) / precoRegular) * 100,
    );
  }

  // Texto de atendimento
  const textoRodape = isOrcamento
    ? "Solicite seu orçamento pelo WhatsApp"
    : isWhatsappFinalizacao
      ? "Finalize seu pedido pelo WhatsApp"
      : "Peça pelo site ou WhatsApp";

  return (
    <div
      className={cn(
        "group flex flex-col rounded-md md:rounded-xl overflow-hidden bg-card border border-border/60 shadow-xs transition-all hover:shadow-md hover:border-border relative h-full justify-between cursor-pointer",
        isAdmin && !isAtivo && "opacity-75 grayscale",
      )}
    >
      {/* Overlay de carregamento */}
      {isNavigating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-40 flex items-center justify-center transition-all">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Link que cobre todo o card */}
      {(isAtivo || !isAdmin) && (
        <Link
          href={`/produto/${product.id}`}
          prefetch={true}
          onClick={() => setIsNavigating(true)}
          className="absolute inset-0 z-10"
          aria-label={`Ver detalhes do produto: ${product.nome}`}
        />
      )}

      {/* Imagem */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
        <Image
          src={product.imagem_url || "/placeholder.png"}
          alt={product.nome}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Conteúdo */}
      <div className="p-2.5 flex flex-col flex-grow gap-1.5 justify-between pointer-events-none">
        {/* Nome */}
        <div className="space-y-0.5">
          <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.nome}
          </h3>
        </div>

        {/* Preço */}
        <div className="space-y-0.5 pt-0.5">
          {isOrcamento ? (
            <div className="py-1">
              <span className="text-xs font-bold text-primary block">
                Consulte valores via WhatsApp
              </span>
            </div>
          ) : (
            <>
              {temPromocao && (
                <span className="text-[10px] text-muted-foreground line-through block">
                  {formatBRL(precoRegular)}
                </span>
              )}

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-foreground text-sm md:text-base tracking-tight">
                  {formatBRL(precoAtual)}
                </span>

                {descontoPercentual > 0 && (
                  <span className="text-[9px] font-black text-emerald-950 bg-emerald-400 px-1.5 py-0.5 rounded-xs">
                    {descontoPercentual}% OFF
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Informações do pedido */}
        <div className="pt-2 border-t border-border/40 mt-auto">
          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3 text-emerald-600 shrink-0" />

            {textoRodape}
          </span>
        </div>

        {/* Ações do admin */}
        {isAdmin && actions && (
          <div className="mt-2 pt-2 border-t border-border flex gap-1 relative z-30 pointer-events-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}