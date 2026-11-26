"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useCart } from "@/lib/store/cart";
import type { ProductRow } from "@/lib/store/types";
import { formatBRL } from "@/lib/utils";
import { ProductShipping } from "./product-shipping";

export type CatalogVariant = {
  id: string;
  name: string;
  material: string | null;
  is_principal: boolean | null;
  imagens: string[];
};

export function ProductPurchaseBox({ product, variants, selectedVariantId, onSelectVariant }: {
  product: ProductRow;
  variants: CatalogVariant[];
  selectedVariantId: string | null;
  onSelectVariant: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const add = useCart((state) => state.add);
  const setOpen = useCart((state) => state.setOpen);
  const { config } = useStore();
  const variant = variants.find((item) => item.id === selectedVariantId);
  const quoteOnly = product.tipo_venda === "orcamento";
  const promo = product.preco_promocional;
  const price = promo != null && promo > 0 && promo < product.preco ? promo : product.preco;

  function addProduct(openCart: boolean) {
    add({
      ...product,
      variant_id: variant?.id,
      name: variant?.name,
      nome: variant?.name ? product.nome + " - " + variant.name : product.nome,
      imagem_url: variant?.imagens[0] || product.imagem_url,
    }, 1);
    if (openCart) setOpen(true);
    else startTransition(() => router.push("/checkout"));
  }

  const phone = config?.phone?.replace(/\D/g, "") || "";
  const internationalPhone = phone.length === 10 || phone.length === 11 ? "55" + phone : phone;
  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
  const message = `Olá! Gostaria de um orçamento para ${product.nome}${variant?.name ? " (" + variant.name + ")" : ""}. ${baseUrl}/produto/${product.id}`;

  return (
    <section className="space-y-5 rounded-[var(--panel-radius)] border border-border/70 bg-card p-5 sm:p-7">
      <h1 className="text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{product.nome}</h1>
      {quoteOnly ? <p className="font-medium">Preço sob orçamento</p> : (
        <p className="flex flex-wrap items-baseline gap-3">
          <strong className="text-2xl tabular-nums">{formatBRL(price)}</strong>
          {price !== product.preco && <del className="text-sm text-muted-foreground">{formatBRL(product.preco)}</del>}
        </p>
      )}
      {variants.some((v) => v.name) && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Escolha a variação</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => <button key={v.id} type="button" aria-pressed={variant?.id === v.id}
              onClick={() => onSelectVariant(v.id)}
              className="rounded-lg border border-brand-control px-3 py-2 text-sm aria-pressed:border-brand-action aria-pressed:bg-brand-tint aria-pressed:text-brand-action">
              {v.name || "Principal"}
            </button>)}
          </div>
          {variant?.material && <p className="mt-2 text-sm text-muted-foreground">{variant.material}</p>}
        </fieldset>
      )}
      <ProductShipping productId={product.id} />
      <div className="space-y-2">
        {quoteOnly ? (
          <Button size="lg" className="flow-action" nativeButton={false} render={<a
            href={phone ? `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}` : "/contato"}
            target={phone ? "_blank" : undefined} rel="noopener noreferrer" />}
          >Solicitar orçamento</Button>
        ) :
          <>
            <Button type="button" size="lg" className="flow-action" disabled={pending} onClick={() => addProduct(false)}>
              <ShoppingBag />{pending ? "Abrindo pedido…" : "Fazer pedido"}
            </Button>
            <Button type="button" variant="outline" size="lg" className="flow-action" disabled={pending} onClick={() => addProduct(true)}>
              Adicionar ao carrinho
            </Button>
          </>}
      </div>
    </section>
  );
}
