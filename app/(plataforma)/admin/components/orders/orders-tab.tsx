"use client";

import { useAdminOrders } from "../../hooks/use-admin-orders";
import type { OrderWithItems } from "../../types/admin-types";
import { EmptyOrders } from "./components/empty-orders";
import { OrderCard } from "./components/order-card";

export function OrdersTab({ orders }: { orders: OrderWithItems[] }) {
  const {
    updateStatus,
    updatePaymentStatus,
    updateArchive,
    isStatusPending,
    isPaymentStatusPending,
    isArchivePending,
  } = useAdminOrders();

  if (orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          updateStatus={updateStatus}
          updatePaymentStatus={updatePaymentStatus}
          updateArchive={updateArchive}
          isStatusPending={isStatusPending}
          isPaymentStatusPending={isPaymentStatusPending}
          isArchivePending={isArchivePending}
        />
      ))}
    </div>
  );
}