"use client";

import {
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";

import { formatBRL } from "@/lib/utils";

export function OrderShippingInfo({
  order,
  isPickup,
  isLocalDelivery,
}: any) {
  const deliveryLabel = isPickup
    ? "Retirada na Loja"
    : isLocalDelivery
      ? "Entrega Própria"
      : "Entrega";

  return (
    <div className="rounded-lg bg-muted/40 p-2.5 sm:p-3 space-y-2 border border-border/50">
      {/* CLIENTE */}
      <div className="font-bold flex items-center gap-1.5 text-xs">
        <User size={13} />
        Cliente
      </div>

      <p className="font-medium">
        {order.shipping_name || "Não informado"}
      </p>

      {order.shipping_phone && (
        <p className="text-muted-foreground">
          {order.shipping_phone}
        </p>
      )}

      {order.shipping_email && (
        <p className="text-muted-foreground truncate">
          {order.shipping_email}
        </p>
      )}

      {/* ENDEREÇO */}
      <div className="pt-2 border-t border-border/20">
        <div className="font-bold flex items-center gap-1.5 text-xs mb-1">
          <MapPin size={13} />
          {isPickup ? "Local de Retirada" : "Endereço de entrega"}
        </div>

        {isPickup ? (
          <p className="text-muted-foreground">
            Cliente irá retirar o pedido na loja.
          </p>
        ) : (
          <div className="text-muted-foreground leading-relaxed">
            <p>
              {order.shipping_address || "Endereço não informado"}
              {order.shipping_number
                ? `, nº ${order.shipping_number}`
                : order.shipping_without_number
                  ? ", S/N"
                  : ""}
            </p>

            {order.shipping_complement && (
              <p>
                Complemento: {order.shipping_complement}
              </p>
            )}

            {order.shipping_neighborhood && (
              <p>
                Bairro: {order.shipping_neighborhood}
              </p>
            )}

            <p>
              {order.shipping_city} - {order.shipping_state}
            </p>

            {order.shipping_zip && (
              <p>
                CEP: {order.shipping_zip}
              </p>
            )}

            {order.shipping_reference && (
              <p>
                Referência: {order.shipping_reference}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ENTREGA */}
      <div className="pt-2 border-t border-border/20 space-y-1.5">
        <div className="flex justify-between items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold">
            {isPickup ? (
              <Package size={12} />
            ) : (
              <Truck size={12} />
            )}

            Entrega:
          </span>

          <span className="font-bold text-right">
            {deliveryLabel}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>Valor da entrega:</span>

          <span className="font-bold">
            {formatBRL(
              Number(order.shipping_cost || 0)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}