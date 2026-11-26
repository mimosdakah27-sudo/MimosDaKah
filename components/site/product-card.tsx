import { ArrowUpRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CatalogImage } from "./catalog-image";
import type { CatalogProduct } from "@/app/(plataforma)/home/types/product-type";
import { cn, formatBRL } from "@/lib/utils";

interface ProductCardProps {
  product: CatalogProduct;
  isAdmin?: boolean;
  actions?: ReactNode;
  compact?: boolean;
}

export function ProductCard({ product, isAdmin = false, actions, compact = false }: ProductCardProps) {
  const isQuote = product.tipo_venda === "orcamento";
  const offer = product.preco_promocional;
  const hasOffer = !isQuote && offer !== null && offer > 0 && offer < product.preco;
  const price = hasOffer ? offer : product.preco;
  const discount = hasOffer ? Math.round((1 - price / product.preco) * 100) : 0;
  const canOpen = !isAdmin || product.ativo !== false;
  const orderLabel = isQuote
    ? "Solicite seu orçamento pelo WhatsApp"
    : product.tipo_venda === "whatsapp_finalizacao"
      ? "Finalize seu pedido pelo WhatsApp"
      : "Peça pelo site ou WhatsApp";

  return (
    <article className={cn(
      "group relative flex h-full min-w-0",
      isAdmin ? "flex-col overflow-hidden rounded-[var(--panel-radius)] border bg-card" :
        compact ? "items-center gap-3.5 rounded-2xl border border-border p-2.5" : "flex-col",
    )}>
      <div className={cn(
        "relative isolate overflow-hidden",
        isAdmin ? "aspect-[4/3] w-full bg-brand-surface" :
          compact ? "size-20 shrink-0 rounded-lg bg-muted sm:size-24" :
            "aspect-square rounded-xl bg-muted sm:rounded-2xl",
      )}>
        <CatalogImage
          src={product.imagem_url}
          compact={compact}
          alt=""
          sizes={compact ? "(min-width: 640px) 96px, 80px" : "(min-width: 1280px) 295px, (min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"}
          className="object-cover"
        />
        {isAdmin && <span className="absolute left-3 top-3 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-brand-ink">
          {canOpen ? "Na vitrine" : "Oculto"}
        </span>}
        {!isAdmin && !compact && discount > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-action">
            −{discount}%
          </span>
        )}
      </div>

      <div className={cn(
        "flex min-w-0 flex-col",
        isAdmin ? "flex-1 gap-2 p-4" : compact ? "flex-1 gap-1 pr-5" : "flex-1 gap-1.5 pt-3 sm:pt-4",
      )}>
        <h3 className={cn(
          "leading-snug",
          isAdmin ? "text-base font-semibold text-brand-ink" : "text-[0.98rem] font-medium text-brand-ink sm:text-lg",
        )}>
          {canOpen ? (
            <Link
              href={`/produto/${product.id}`}
              prefetch={false}
              className="line-clamp-2 break-words after:absolute after:inset-0 after:z-10 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-action group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4"
            >
              {product.nome}
            </Link>
          ) : <span className="line-clamp-2">{product.nome}</span>}
        </h3>

        <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", isAdmin ? "" : "text-brand-ink")}>
          {isQuote ? (
            <span className={cn("font-semibold", isAdmin ? "text-xs text-primary" : "text-sm")}>
              {isAdmin ? "Consulte valores via WhatsApp" : "Sob orçamento"}
            </span>
          ) : (
            <>
              <span className={cn("font-semibold", isAdmin ? "text-sm md:text-base" : compact ? "text-sm" : "text-base sm:text-lg")}>
                {formatBRL(price)}
              </span>
              {hasOffer && (
                <span className={cn("text-xs line-through", isAdmin ? "text-muted-foreground" : "text-brand-muted")}>
                  <span className="sr-only">Preço anterior </span>{formatBRL(product.preco)}
                </span>
              )}
              {isAdmin && discount > 0 && (
                <span className="rounded-md bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand-action">{discount}% OFF</span>
              )}
            </>
          )}
        </div>

        {compact && !isAdmin && <ArrowUpRight className="absolute right-3 size-4 text-brand-muted" aria-hidden="true" />}
        {isAdmin && (
          <>
            <p className="mt-auto flex items-center gap-1.5 border-t border-border/40 pt-2 text-xs text-brand-muted">
              <MessageCircle className="size-3 shrink-0 text-brand-action" aria-hidden="true" />{orderLabel}
            </p>
            {actions && <div className="relative z-20 mt-2 flex gap-1 border-t pt-2">{actions}</div>}
          </>
        )}
      </div>
    </article>
  );
}
