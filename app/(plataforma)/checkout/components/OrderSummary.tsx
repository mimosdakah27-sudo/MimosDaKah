"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

interface OrderSummaryProps {
  items: any[];
  shipping: any;
  total: number;
}

export function OrderSummary({ items, shipping }: OrderSummaryProps) {
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);

  const { originalSubtotal, currentSubtotal, totalEconomy } = items.reduce(
    (acc, i) => {
      const regularPrice = Number(i.product.preco) || 0;
      const promoPrice = i.product.preco_promocional ? Number(i.product.preco_promocional) : regularPrice;
      
      const effectivePrice = promoPrice > 0 && promoPrice < regularPrice ? promoPrice : regularPrice;

      acc.originalSubtotal += regularPrice * i.quantity;
      acc.currentSubtotal += effectivePrice * i.quantity;
      acc.totalEconomy += (regularPrice - effectivePrice) * i.quantity;

      return acc;
    },
    { originalSubtotal: 0, currentSubtotal: 0, totalEconomy: 0 }
  );

  const shippingPrice = shipping ? Number(shipping.price) : 0;
  const originalShippingPrice = shipping?.original_price ? Number(shipping.original_price) : 0;
  const shippingEconomy = originalShippingPrice > shippingPrice ? originalShippingPrice - shippingPrice : 0;
  
  const finalEconomy = totalEconomy + shippingEconomy;

  const calculatedTotal = currentSubtotal + shippingPrice;
  const calculatedOriginalTotal = originalSubtotal + (originalShippingPrice > 0 ? originalShippingPrice : shippingPrice);

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-sm">Resumo da compra</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {totalQty} {totalQty === 1 ? "item" : "itens"}
          </span>
        </div>

        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {items.map((item, index) => {
            const regularPrice = Number(item.product.preco) || 0;
            const promoPrice = item.product.preco_promocional ? Number(item.product.preco_promocional) : 0;
            const hasDiscount = promoPrice > 0 && promoPrice < regularPrice;
            const finalItemPrice = hasDiscount ? promoPrice : regularPrice;

            // Alinhado com o banco: variantes usam name e tamanho
            const variantName = item.product.name || null;
            const variantSize = item.product.tamanho || null;

            return (
              <div 
                key={`${item.product.id}-${item.product.variant_id || index}`} 
                className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
              >
                <div className="w-14 h-14 relative rounded-md overflow-hidden bg-muted shrink-0 border">
                  <Image 
                    src={item.product.imagem_url} 
                    alt={item.product.nome} 
                    className="object-cover" 
                    fill 
                    sizes="56px" 
                  />
                </div>
                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <p className="font-medium text-foreground truncate">{item.product.nome}</p>
                  
                  {(variantName || variantSize) && (
                    <p className="text-primary font-medium">
                      {variantName ? `Variante: ${variantName}` : ""}
                      {variantName && variantSize ? " • " : ""}
                      {variantSize ? `Tamanho: ${variantSize}` : ""}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {item.quantity}x{" "}
                      {hasDiscount && (
                        <span className="line-through mr-1 text-[10px]">
                          {formatBRL(regularPrice)}
                        </span>
                      )}
                      <span className={hasDiscount ? "font-semibold text-foreground" : ""}>
                        {formatBRL(finalItemPrice)}
                      </span>
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatBRL(finalItemPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground items-center">
            <span>Produtos ({totalQty})</span>
            <div className="text-right">
              {originalSubtotal > currentSubtotal && (
                <span className="line-through text-xs text-muted-foreground mr-2">
                  {formatBRL(originalSubtotal)}
                </span>
              )}
              <span className="font-medium text-foreground">
                {formatBRL(currentSubtotal)}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-muted-foreground items-center">
            <span>Envios</span>
            <div className="text-right">
              {shipping ? (
                Number(shipping.price) === 0 ? (
                  <div className="flex items-center gap-1.5 justify-end">
                    {originalShippingPrice > 0 && (
                      <span className="line-through text-xs text-muted-foreground">
                        {formatBRL(originalShippingPrice)}
                      </span>
                    )}
                    <span className="text-emerald-600 font-semibold uppercase text-xs">
                      Grátis
                    </span>
                  </div>
                ) : (
                  <span className="font-medium text-foreground">
                    {formatBRL(Number(shipping.price))}
                  </span>
                )
              ) : (
                "A calcular"
              )}
            </div>
          </div>

          <div className="pt-3 border-t space-y-1">
            <div className="flex justify-between font-bold text-base text-foreground items-center">
              <span>Total</span>
              <div className="text-right flex flex-col items-end">
                {calculatedOriginalTotal > calculatedTotal && (
                  <span className="line-through text-xs text-muted-foreground font-normal">
                    {formatBRL(calculatedOriginalTotal)}
                  </span>
                )}
                <span>{formatBRL(calculatedTotal)}</span>
              </div>
            </div>

            {finalEconomy > 0 && (
              <div className="flex items-center justify-end gap-2 pt-1 text-xs font-semibold text-emerald-600">
                <span>Economize {formatBRL(finalEconomy)}</span>
                {Number(shipping?.price) === 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span>Frete grátis</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}