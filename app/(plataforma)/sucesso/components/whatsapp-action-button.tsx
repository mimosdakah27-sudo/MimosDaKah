// app/checkout/success/components/whatsapp-action-button.tsx

"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { useWhatsAppOrder } from "../hooks/use-whatsapp-order";

interface WhatsAppActionButtonProps {
  products: any[];
  orderId: string;
  order: {
    total: number;
    shipping_cost: number;
  };
}

export function WhatsAppActionButton({
  products,
  orderId,
  order,
}: WhatsAppActionButtonProps) {
  const router = useRouter();

  const { profile } = useAuth();

  const { sendWhatsAppOrder } = useWhatsAppOrder();

  const handleClick = () => {
    const result = sendWhatsAppOrder(
      products,
      orderId,
      order,
    );

    if (!result?.success) {
      return;
    }

    /*
     * Depois de abrir o WhatsApp:
     *
     * Usuário logado → perfil
     * Visitante → página inicial
     */
    if (profile) {
      router.push("/perfil");
    } else {
      router.push("/");
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Enviar pedido pelo WhatsApp
    </Button>
  );
}