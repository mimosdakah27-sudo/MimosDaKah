"use client";

import { CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { OrderCardActions } from "./order-card-actions";
import { OrderItemsModal } from "./order-items-modal";
import { OrderShippingInfo } from "./order-shipping-info";

export function OrderCardBody({
  order,
  isPickup,
  isLocalDelivery,
  updateArchive,
  isArchivePending,
}: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const clientName =
    order.shipping_name?.split(" ")[0] || "Cliente";

  const orderIdShort = order.id.substring(0, 8);

  const storeName = "nossa loja";

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  const orderLink =
    `${origin}/perfil?order=${orderIdShort}`;

  let rawPhone = (
    order.shipping_phone ||
    order.phone ||
    ""
  ).replace(/\D/g, "");

  if (rawPhone.length === 10 || rawPhone.length === 11) {
    rawPhone = `55${rawPhone}`;
  }

  const message =
    `Olá ${clientName}! Aqui é da ${storeName}. ` +
    `Estou entrando em contato sobre o seu pedido #${orderIdShort}.\n\n` +
    `Link do seu pedido: ${orderLink}`;

  const whatsappUrl =
    rawPhone.length > 0
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`
      : "";

  return (
    <CardContent className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 text-[11px]">
      <OrderShippingInfo
        order={order}
        isPickup={isPickup}
        isLocalDelivery={isLocalDelivery}
      />

      <OrderItemsModal
        order={order}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />

      <OrderCardActions
        order={order}
        updateArchive={updateArchive}
        isArchivePending={isArchivePending}
        whatsappUrl={whatsappUrl}
      />
    </CardContent>
  );
}