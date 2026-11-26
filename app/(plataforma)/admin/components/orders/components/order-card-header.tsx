"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  PackageCheck,
} from "lucide-react";
import { formatBRL } from "@/lib/utils";

const ORDER_STATUSES = [
  {
    value: "Aguardando pagamento",
    label: "Aguardando pagamento",
  },
  {
    value: "Em preparação",
    label: "Em preparação",
  },
  {
    value: "Pronto para retirada",
    label: "Pronto para retirada",
  },
  {
    value: "Preparando entrega",
    label: "Preparando entrega",
  },
  {
    value: "Em rota de entrega",
    label: "Em rota de entrega",
  },
  {
    value: "Entregue",
    label: "Entregue",
  },
  {
    value: "Cancelado",
    label: "Cancelado",
  },
];

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Pendente",
  },
  {
    value: "paid",
    label: "Pago",
  },
];

function getOrderStatusLabel(status?: string) {
  return (
    ORDER_STATUSES.find(
      (item) => item.value === status,
    )?.label ||
    status ||
    "Aguardando pagamento"
  );
}

function getPaymentStatusLabel(status?: string) {
  return (
    PAYMENT_STATUSES.find(
      (item) => item.value === status,
    )?.label || "Pendente"
  );
}

export function OrderCardHeader({
  order,
  updateStatus,
  updatePaymentStatus,
  isStatusPending,
  isPaymentStatusPending,
}: any) {
  const isPickup =
    order.shipping_type === "retirada";

  const isLocalDelivery =
    order.shipping_type === "Entrega na cidade" ||
    order.shipping_type === "entrega_propria";

  const shippingLabel = isPickup
    ? "Retirada"
    : isLocalDelivery
      ? "Entrega Própria"
      : "Entrega";

  const paymentStatus =
    order.payment_status || "pending";

  return (
    <div className="border-b bg-brand-surface p-4 sm:p-5">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-base font-semibold tracking-tight break-all">
              #{order.id.slice(0, 8)}
            </span>

            <Badge className="bg-brand-tint text-xs font-medium text-brand-action">
              {shippingLabel}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            {new Date(
              order.created_at,
            ).toLocaleDateString("pt-BR")}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-semibold text-brand-ink">
            {formatBRL(
              Number(order.total || 0),
            )}
          </p>
        </div>
      </div>

      {/* STATUS DO PEDIDO */}
      <div className="space-y-1.5 mb-2.5">
        <label
          htmlFor={`order-status-${order.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
        >
          <PackageCheck size={12} />
          Status do pedido
        </label>

        <Select
          value={
            order.status ||
            "Aguardando pagamento"
          }
          onValueChange={(value) =>
            updateStatus({
              id: order.id,
              status: value,
            })
          }
          disabled={isStatusPending}
        >
          <SelectTrigger
            id={`order-status-${order.id}`}
            className="w-full bg-card"
          >
            <SelectValue>
              {getOrderStatusLabel(
                order.status,
              )}
            </SelectValue>
          </SelectTrigger>

          <SelectContent className="w-[240px] [&_[role=option]]:min-h-11">
            {ORDER_STATUSES.map((status) => {
              /*
               * "Pronto para retirada" só faz sentido
               * para pedidos de retirada.
               */
              if (
                status.value ===
                  "Pronto para retirada" &&
                !isPickup
              ) {
                return null;
              }

              /*
               * Estados de entrega própria não fazem
               * sentido para retirada na loja.
               */
              if (
                (status.value ===
                  "Preparando entrega" ||
                  status.value ===
                    "Em rota de entrega") &&
                !isLocalDelivery
              ) {
                return null;
              }

              return (
                <SelectItem
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* STATUS DO PAGAMENTO */}
      <div className="space-y-1.5">
        <label
          htmlFor={`payment-status-${order.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
        >
          <CreditCard size={12} />
          Status do pagamento
        </label>

        <Select
          value={paymentStatus}
          onValueChange={(value) =>
            updatePaymentStatus({
              id: order.id,
              paymentStatus: value,
            })
          }
          disabled={isPaymentStatusPending}
        >
          <SelectTrigger
            id={`payment-status-${order.id}`}
            className="w-full bg-card"
          >
            <SelectValue>
              {getPaymentStatusLabel(
                paymentStatus,
              )}
            </SelectValue>
          </SelectTrigger>

          <SelectContent className="w-[220px] [&_[role=option]]:min-h-11">
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem
                key={status.value}
                value={status.value}
              >
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
