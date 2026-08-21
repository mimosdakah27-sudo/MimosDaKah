"use client";

import { Card } from "@/components/ui/card";
import { useStore } from "@/hooks/use-store";
import { OrderCardHeader } from "./order-card-header";
import { OrderCardBody } from "./order-card-body";

export function OrderCard({
  order,
  updateStatus,
  updateArchive,
  isStatusPending,
  isArchivePending,
}: any) {
  const isPickup = order.shipping_type === "retirada";
  const isLocal = order.shipping_type === "entrega_propria";
  const isMelhorEnvio = !isPickup && !isLocal;

  const { config } = useStore();

  const shippingStyles = isPickup
    ? "border-purple-500/50 bg-purple-500/5"
    : isLocal
      ? "border-emerald-500/50 bg-emerald-500/5"
      : "border-border";

  return (
    <Card
      className={`flex flex-col overflow-hidden border transition-all hover:shadow-md ${shippingStyles}`}
    >
      <OrderCardHeader
        order={order}
        updateStatus={updateStatus}
        isStatusPending={isStatusPending}
      />
      <OrderCardBody
        order={order}
        isPickup={isPickup}
        isMelhorEnvio={isMelhorEnvio}
        updateArchive={updateArchive}
        isArchivePending={isArchivePending}
        storeConfig={config}
      />
    </Card>
  );
}