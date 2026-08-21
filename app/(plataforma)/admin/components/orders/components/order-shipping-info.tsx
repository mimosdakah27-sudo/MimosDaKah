"use client";

import { MapPin, Truck, User } from "lucide-react";
import { formatBRL } from "@/lib/utils";

export function OrderShippingInfo({ order, isPickup }: any) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5 sm:p-3 space-y-2 border border-border/50">
      <div className="font-bold flex items-center gap-1.5 text-xs">
        {isPickup ? <MapPin size={13} /> : <User size={13} />}
        {isPickup ? "Local de Retirada" : "Cliente"}
      </div>
      <p className="font-medium truncate">
        {order.shipping_name}{" "}
        {order.shipping_document && `(${order.shipping_document})`}
      </p>

      {!isPickup && (
        <p className="text-muted-foreground leading-tight">
          {order.shipping_address}, {order.shipping_city} -{" "}
          {order.shipping_state}
        </p>
      )}

      <div className="pt-2 border-t border-border/20 font-bold space-y-1">
        <div className="flex justify-between items-center gap-2">
          <span className="flex items-center gap-1 shrink-0">
            <Truck size={12} /> Serviço:
          </span>
          <span className="truncate text-right">
            {order.shipping_company_name || "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Frete:</span>
          <span>{formatBRL(Number(order.shipping_cost || 0))}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Peso:</span>
          <span>{order.total_weight}kg</span>
        </div>
      </div>
    </div>
  );
}