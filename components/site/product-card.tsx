"use client";

import { MessageCircle, Zap, HelpCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatBRL, cn } from "@/lib/utils";
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
  const isAtivo = product.ativo !== false;
  const tipoVenda = product.tipo_venda || "normal";
  const isOrcamento = tipoVenda === "orcamento";
  const isWhatsappFinalizacao = tipoVenda === "whatsapp_finalizacao";

  // Lógica de preços e desconto (somente se não for orçamento)
  const precoRegular = product.preco || 0;
  const precoPromo = product.preco_promocional;
  const temPromocao = !isOrcamento && precoPromo && precoPromo > 0 && precoPromo < precoRegular;
  
  const precoAtual = temPromocao ? precoPromo : precoRegular;
  
  let descontoPercentual = 0;
  if (temPromocao) {
    descontoPercentual = Math.round(((precoRegular - precoPromo) / precoRegular) * 100);
  }

  // Simulação de parcelamento
  const parcelasMax = 10;
  const valorParcela = precoAtual / parcelasMax;

  return (
    <div className={cn(
      "group flex flex-col rounded-md md:rounded-xl overflow-hidden bg-card border border-border/60 shadow-xs transition-all hover:shadow-md hover:border-border relative h-full justify-between",
      isAdmin && !isAtivo && "opacity-75 grayscale"
    )}>
      
      {/* Container fixo e estritamente quadrado (aspect-square) em todas as telas */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
          {product.destaque && (
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs backdrop-blur-xs">
              <Zap className="h-2.5 w-2.5 fill-amber-500" /> Destaque
            </span>
          )}
          {isOrcamento && (
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs backdrop-blur-xs">
              <HelpCircle className="h-2.5 w-2.5" /> Sob Orçamento
            </span>
          )}
          {isWhatsappFinalizacao && (
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs backdrop-blur-xs">
              <MessageCircle className="h-2.5 w-2.5" /> Detalhes no Zap
            </span>
          )}
        </div>

        <Image
          src={product.imagem_url || "/placeholder.png"}
          alt={product.nome}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Conteúdo do Card */}
      <div className="p-2.5 flex flex-col flex-grow gap-1.5 relative z-20 justify-between">
        <div className="space-y-0.5">
          <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.nome}
          </h3>
        </div>

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

              <div className="text-[10px] text-emerald-600 font-medium">
                {parcelasMax}x {formatBRL(valorParcela)} sem juros
              </div>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-border/40 mt-auto">
          <span className="text-[10px] text-muted-foreground font-medium block">
            {isOrcamento ? "Atendimento personalizado" : "Frete calculado no checkout"}
          </span>
        </div>

        {isAdmin && actions && (
          <div className="mt-2 pt-2 border-t border-border flex gap-1 relative z-30">
            {actions}
          </div>
        )}
      </div>

      {(isAtivo || !isAdmin) && (
        <Link 
          href={`/produto/${product.id}`} 
          className="absolute inset-0 z-10" 
          aria-label={`Ver detalhes do produto: ${product.nome}`} 
        />
      )}
    </div>
  );
}