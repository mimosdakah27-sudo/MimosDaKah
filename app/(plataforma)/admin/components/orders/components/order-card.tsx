"use client";

import { Card } from "@/components/ui/card";
import { OrderCardBody } from "./order-card-body";
import { OrderCardHeader } from "./order-card-header";

export function OrderCard({
  order,
  updateStatus,
  updatePaymentStatus,
  updateArchive,
  isStatusPending,
  isPaymentStatusPending,
  isArchivePending,
}: any) {
  const isPickup = order.shipping_type === "retirada";
  const isLocalDelivery =
    order.shipping_type === "Entrega na cidade" ||
    order.shipping_type === "entrega_propria";

  const shippingStyles = isPickup
    ? "border-purple-500/50 bg-purple-500/5"
    : isLocalDelivery
      ? "border-emerald-500/50 bg-emerald-500/5"
      : "border-blue-500/30 bg-blue-500/5";

  return (
    <Card
      className={`flex flex-col overflow-hidden border transition-all hover:shadow-md ${shippingStyles}`}
    >
      <OrderCardHeader
        order={order}
        updateStatus={updateStatus}
        updatePaymentStatus={updatePaymentStatus}
        isStatusPending={isStatusPending}
        isPaymentStatusPending={isPaymentStatusPending}
      />

      <OrderCardBody
        order={order}
        isPickup={isPickup}
        isLocalDelivery={isLocalDelivery}
        updateArchive={updateArchive}
        isArchivePending={isArchivePending}
      />
    </Card>
  );
}