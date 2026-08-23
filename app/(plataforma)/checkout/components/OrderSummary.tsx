"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";

interface OrderSummaryProps {
  items: any[];
  shipping: any;
  total: number;
  onRemoveItem?: (productId: string, variantId?: string) => void;
}

export function OrderSummary({
  items = [],
  shipping,
  total,
  onRemoveItem,
}: OrderSummaryProps) {
  const removeFromCart = useCart((s) => s.remove);

  // LOG 1: Recebimento de props no componente
  console.log("🔍 [OrderSummary] Render - Items recebidos:", items);
  console.log("🔍 [OrderSummary] Render - Shipping:", shipping, "Total:", total);

  const handleRemove = (productId: string, variantId?: string) => {
    console.log("🗑️ [OrderSummary] Solicitando remoção do item:", { productId, variantId });
    if (onRemoveItem) {
      onRemoveItem(productId, variantId);
    } else {
      removeFromCart(productId, variantId);
    }
  };

  const subtotal = items.reduce(
    (acc, item) =>
      acc + Number(item.product?.preco || 0) * Number(item.quantity || 1),
    0
  );

  const totalQuantity = items.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">Resumo da compra</CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {totalQuantity} {totalQuantity === 1 ? "item" : "itens"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* LISTA DE PRODUTOS */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {items.map((item, index) => {
            const product = item.product || {};
            const productId = product.id || `item-${index}`;
            const variantId = product.variant_id || item.variant_id;
            
            // Garantia de key 100% única para evitar re-renders truncados no React DOM
            const itemKey = `${productId}-${variantId ? `var-${variantId}` : `idx-${index}`}`;

            // LOG 2: Inspecionar cada item durante o .map()
            console.log(`📦 [OrderSummary] Mapeando Item #${index}:`, {
              itemKey,
              productId,
              variantId,
              quantity: item.quantity,
              preco: product.preco,
              nome: product.nome || product.name,
              itemCompleto: item
            });

            return (
              <div
                key={itemKey}
                className="flex items-center justify-between gap-3 text-xs border-b border-border/40 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/60">
                    {product.imagem_url ? (
                      <Image
                        src={product.imagem_url}
                        alt={product.nome || product.name || "Produto"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                        Sem foto
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-foreground truncate text-xs">
                      {product.nome || product.name}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {item.quantity}x {formatBRL(Number(product.preco || 0))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-foreground">
                    {formatBRL(
                      Number(product.preco || 0) * Number(item.quantity || 1)
                    )}
                  </span>

                  {/* BOTÃO DE REMOVER (X) */}
                  <button
                    type="button"
                    onClick={() => handleRemove(productId, variantId)}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Remover item"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* VALORES */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Produtos</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Envio</span>
            <span>
              {shipping ? formatBRL(Number(shipping.price)) : "A calcular"}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatBRL(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}