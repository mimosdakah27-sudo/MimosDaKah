"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getWhatsAppOrderUrl, type ReceiptItem, type ReceiptTotals } from "../services/whatsapp-order";

interface WhatsAppActionButtonProps {
  storePhone: string | null;
  products: ReceiptItem[];
  orderId: string;
  order: ReceiptTotals;
}

export function WhatsAppActionButton({ products, orderId, order, storePhone }: WhatsAppActionButtonProps) {
  const [origin, setOrigin] = useState("");
  const phone = storePhone?.replace(/\D/g, "") || "";
  const href = /^(55)?\d{10,11}$/.test(phone) ? getWhatsAppOrderUrl(phone, products, orderId, order, origin) : null;

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    if (!href || !origin || window.location.hash !== "#whatsapp") return;
    // Consumir a intenção antes de sair permite usar Voltar ou atualizar o recibo.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.location.assign(href);
  }, [href, origin]);

  if (!href) {
    return <p className="text-xs text-muted-foreground">O WhatsApp da loja está indisponível. Guarde o número do pedido acima.</p>;
  }
  return (
    <Button
      render={<a href={href} />} nativeButton={false}
      size="lg" className="flow-action"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Enviar pedido pelo WhatsApp
    </Button>
  );
}
