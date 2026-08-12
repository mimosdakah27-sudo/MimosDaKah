"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
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
    <AnimatePresence mode="wait">
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border flex flex-col shadow-lg"
          >
            <header className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Sacola</h2>
                <p className="text-sm text-muted-foreground">{totalQty} {totalQty === 1 ? "item" : "itens"}</p>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="h-9 w-9 rounded-md hover:bg-accent flex items-center justify-center" 
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

                  return (
                    <div
                      key={`${item.product.id}-${item.product.variant_size_id}`}
                      className="flex gap-3 p-3 rounded-xl border bg-card"
                    >
                      <div className="relative h-20 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        <Image src={item.product.imagem_url} alt={item.product.nome} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-sm truncate">{item.product.nome}</h3>
                          
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

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                            <button 
                              onClick={() => updateQty(item.product.id, item.quantity - 1, item.product.variant_size_id)} 
                              className="h-6 w-6 rounded hover:bg-background flex items-center justify-center text-foreground"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQty(item.product.id, item.quantity + 1, item.product.variant_size_id)} 
                              className="h-6 w-6 rounded hover:bg-background flex items-center justify-center text-foreground"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => remove(item.product.id, item.product.variant_size_id)} 
                            className="h-7 w-7 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center transition-colors" 
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
                <button
                  onClick={() => { setOpen(false); router.push("/checkout"); }}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Finalizar compra
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}