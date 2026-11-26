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

  return (
    <Card className="min-w-0 gap-0 py-0">
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