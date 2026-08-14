// whatsapp-action-button.tsx
"use client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useWhatsAppOrder } from "../hooks/use-whatsapp-order";

export function WhatsAppActionButton({ products, orderId }: { products: any[], orderId: string }) {
  const { sendWhatsAppOrder } = useWhatsAppOrder();
  
  return (
    <Button 
      onClick={() => sendWhatsAppOrder(products, orderId)}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Finalizar Personalização no Zap ({products.length} {products.length === 1 ? 'item' : 'itens'})
    </Button>
  );
}