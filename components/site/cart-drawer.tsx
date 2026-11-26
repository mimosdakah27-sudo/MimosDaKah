"use client";

import { Button } from "@/components/ui/button";
import { CatalogImage } from "@/components/site/catalog-image";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, X, MessageCircle, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import { formatBRL } from "@/lib/utils";

export function CartDrawer() {
  const router = useRouter();
  const { items, open, setOpen, updateQty, remove } = useCart();
  
  const subtotal = items.reduce((acc, i) => {
    const regularPrice = Number(i.product.preco) || 0;
    const promoPrice = i.product.preco_promocional ? Number(i.product.preco_promocional) : 0;
    const effectivePrice = promoPrice > 0 && promoPrice < regularPrice ? promoPrice : regularPrice;
    return acc + effectivePrice * i.quantity;
  }, 0);

  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" showCloseButton={false} className="max-w-md gap-0 bg-card data-[side=right]:w-full">
            <header className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <SheetTitle className="text-xl font-bold">Sacola</SheetTitle>
                <p className="text-sm text-muted-foreground">{totalQty} {totalQty === 1 ? "item" : "itens"}</p>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="size-11 rounded-md hover:bg-accent flex items-center justify-center"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-20">
                  <p className="text-base font-semibold text-foreground mb-1">Sua sacola está vazia</p>
                  <p className="text-xs">Adicione produtos para continuar</p>
                </div>
              ) : (
                items.map((item) => {
                  const regularPrice = Number(item.product.preco) || 0;
                  const promoPrice = item.product.preco_promocional ? Number(item.product.preco_promocional) : 0;
                  const hasDiscount = promoPrice > 0 && promoPrice < regularPrice;
                  const finalItemPrice = hasDiscount ? promoPrice : regularPrice;
                  const tipoVenda = item.product.tipo_venda;

                  return (
                    <div
                      key={`${item.product.id}-${item.product.variant_id}`}
                      className="flex gap-3 p-3 rounded-xl border bg-card"
                    >
                      <div className="relative h-20 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        <CatalogImage src={item.product.imagem_url} alt={item.product.nome} compact sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm truncate">{item.product.nome}</h3>
                          </div>

                          {tipoVenda === "whatsapp_finalizacao" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-success/10 text-success px-1.5 py-0.5 rounded mt-0.5">
                              <MessageCircle className="h-3 w-3" /> Finalização via WhatsApp
                            </span>
                          )}
                          {tipoVenda === "orcamento" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-brand-tint text-brand-action px-1.5 py-0.5 rounded mt-0.5">
                              <HelpCircle className="h-3 w-3" /> Sob Orçamento
                            </span>
                          )}
                          
                          {(item.product.name || item.product.tamanho) && (
                            <p className="text-xs text-primary font-medium mt-0.5">
                              {item.product.name ? `Variação: ${item.product.name}` : ""}
                              {item.product.name && item.product.tamanho ? ", " : ""}
                              {item.product.tamanho ? `Tamanho: ${item.product.tamanho}` : ""}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 mt-1">
                            {hasDiscount && (
                              <span className="text-xs line-through text-muted-foreground">
                                {formatBRL(regularPrice)}
                              </span>
                            )}
                            <span className="text-sm font-bold">{formatBRL(finalItemPrice)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 mt-2">
                          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                            <button 
                              aria-label="Diminuir quantidade"
                              onClick={() => updateQty(item.product.id, item.quantity - 1, item.product.variant_id)} 
                              className="size-11 rounded hover:bg-background flex items-center justify-center text-foreground"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                            <button 
                              aria-label="Aumentar quantidade"
                              onClick={() => updateQty(item.product.id, item.quantity + 1, item.product.variant_id)} 
                              className="size-11 rounded hover:bg-background flex items-center justify-center text-foreground"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => remove(item.product.id, item.product.variant_id)} 
                            className="size-11 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center transition-colors"
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <footer className="p-6 border-t border-border space-y-4 bg-card">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Quantidade</span>
                    <span>{totalQty} {totalQty === 1 ? "item" : "itens"}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-base">Total</span>
                    <span className="font-bold text-xl text-primary">{formatBRL(subtotal)}</span>
                  </div>
                </div>
                <Button size="lg"
                  onClick={() => { setOpen(false); router.push("/checkout"); }}
                  className="flow-action"
                >
                  Continuar pedido
                </Button>
              </footer>
            )}
      </SheetContent>
    </Sheet>
  );
}
