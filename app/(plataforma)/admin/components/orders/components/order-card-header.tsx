"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/utils";

export function OrderCardHeader({ order, updateStatus, isStatusPending }: any) {
  const isPickup = order.shipping_type === "retirada";
  const isLocal = order.shipping_type === "entrega_propria";

  return (
    <div className="border-b border-border/50 bg-muted/20 p-3 sm:p-4">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs sm:text-sm font-bold tracking-tight break-all">
              #{order.id.slice(0, 8)}
            </span>
            <Badge
              className={`text-[8px] uppercase shrink-0 ${
                isPickup
                  ? "bg-purple-600 text-white"
                  : isLocal
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
              }`}
            >
              {isPickup
                ? "Retirada"
                : isLocal
                  ? "Entrega Própria"
                  : "Melhor Envio"}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-xs sm:text-sm font-bold text-primary">
            {formatBRL(Number(order.total))}
          </p>
          <div className="flex flex-wrap gap-1 justify-end">
            <Badge className="text-[9px]">{order.payment_status}</Badge>
            <Badge className="text-[9px] bg-primary/10 text-primary">
              {order.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor={`order-status-${order.id}`} className="sr-only">
          Status do pedido #{order.id.slice(0, 8)}
        </label>
        <Select
          value={order.status}
          onValueChange={(val) => updateStatus({ id: order.id, status: val })}
          disabled={isStatusPending}
        >
          <SelectTrigger
            id={`order-status-${order.id}`}
            className="w-full h-8 text-xs bg-background"
            aria-label={`Status do pedido #${order.id.slice(0, 8)}`}
          >
            <SelectValue>{order.status}</SelectValue>
          </SelectTrigger>
          <SelectContent className="w-[220px]">
            <SelectItem value="Em Preparação">Em Preparação</SelectItem>
            <SelectItem value="Pronto p/ Retirada">
              Pronto p/ Retirada
            </SelectItem>
            <SelectItem value="Preparando Entrega">
              Preparando Entrega
            </SelectItem>
            <SelectItem value="Etiqueta Paga">Etiqueta Paga</SelectItem>
            <SelectItem value="Postado">Postado</SelectItem>
            <SelectItem value="Entregue">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}