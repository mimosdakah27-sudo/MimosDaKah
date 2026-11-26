"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import type { CartItem } from "@/lib/store/types";
import { getEffectivePrice } from "../checkout-values";

interface OrderSummaryProps {
  items: CartItem[];
  shipping: { price: number } | null;
  subtotal: number;
  total: number;
  disabled: boolean;
}

export function OrderSummary({ items, shipping, subtotal, total, disabled }: OrderSummaryProps) {
  const remove = useCart((state) => state.remove);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">Resumo do pedido</CardTitle>
          <span className="text-xs text-muted-foreground">{count} {count === 1 ? "item" : "itens"}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {items.map(({ product, quantity }) => {
            const price = getEffectivePrice(product);
            return (
              <div key={`${product.id}-${product.variant_id || "default"}`} className="flex items-center gap-3 text-sm border-b pb-3">
                <div className="relative w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {product.imagem_url && <Image src={product.imagem_url} alt="" sizes="48px" fill className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{product.nome}</p>
                  <p className="text-muted-foreground">{quantity} × {formatBRL(price)}</p>
                </div>
                <strong>{formatBRL(quantity * price)}</strong>
                <button type="button" aria-label={`Remover ${product.nome}`} disabled={disabled}
                  onClick={() => remove(product.id, product.variant_id)} className="p-2 text-muted-foreground hover:text-destructive">
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="space-y-2 pt-2 text-sm">
          <div className="flex justify-between"><span>Produtos</span><span>{formatBRL(subtotal)}</span></div>
          <div className="flex justify-between"><span>Envio</span><span>{shipping ? formatBRL(shipping.price) : "A calcular"}</span></div>
          <div className="flex justify-between border-t pt-2 text-sm font-bold"><span>Total</span><span>{formatBRL(total)}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
