"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Package } from "lucide-react";
import { formatBRL } from "@/lib/utils";

export function OrderItemsModal({ order, isModalOpen, setIsModalOpen }: any) {
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger
        render={
          <Button
          nativeButton={true}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Package size={14} /> Ver Mimos ({order.order_items.length})
            </span>
            <Eye size={12} className="text-muted-foreground shrink-0" />
          </Button>
        }
      />

      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh] rounded-xl sm:rounded-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Package size={16} /> Itens do Pedido #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5 mt-2">
          {order.order_items.map((i: any) => (
            <div
              key={i.id}
              className="flex items-center gap-2.5 p-2 rounded-lg border border-border/60 bg-muted/20"
            >
              {i.product_image ? (
                <img
                  src={i.product_image}
                  alt={i.product_name}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md border border-border shrink-0"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-md border border-border flex items-center justify-center shrink-0 text-[9px] text-muted-foreground text-center p-1">
                  Sem foto
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate">{i.product_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Qtd: {i.quantity}x
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-primary">
                  {formatBRL(Number(i.unit_price) * i.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}