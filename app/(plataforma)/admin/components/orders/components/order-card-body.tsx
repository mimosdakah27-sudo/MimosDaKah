"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enviarParaCarrinhoMelhorEnvio } from "@/lib/actions/melhor-envio";

import { OrderShippingInfo } from "./order-shipping-info";
import { OrderTracking } from "./order-tracking";
import { OrderItemsModal } from "./order-items-modal";
import { OrderCardActions } from "./order-card-actions";

export function OrderCardBody({
  order,
  isPickup,
  isMelhorEnvio,
  updateArchive,
  isArchivePending,
  storeConfig,
}: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: resendToMelhorEnvio, isPending: isResending } = useMutation({
    mutationFn: async () => {
      await enviarParaCarrinhoMelhorEnvio({
        shipping: {
          id: order.shipping_service_id || order.shipping_id,
          name: order.shipping_name,
          address: order.shipping_address,
          city: order.shipping_city,
          state: order.shipping_state,
          zip: order.shipping_zip,
          phone: order.shipping_phone,
          email: order.shipping_email,
          document: order.shipping_document,
        },
        items: order.order_items,
        orderId: order.id,
      });
    },
    onSuccess: () => {
      toast.success("Pedido reenviado para o carrinho do Melhor Envio!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Erro ao enviar pedido para o Melhor Envio.",
      );
    },
  });

  const clientName = order.shipping_name?.split(" ")[0] || "Cliente";
  const storeName = storeConfig?.name || "nossa loja";
  const orderIdShort = order.id.substring(0, 8);

  // Monta o link da loja/admin com o filtro do código do pedido
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const orderLink = `${origin}/admin?search=${orderIdShort}#pedidos`;

  const message = `Olá ${clientName}! Aqui é da ${storeName}. Estou entrando em contato sobre o seu pedido #${orderIdShort}.\n\nLink do pedido: ${orderLink}`;
  const whatsappUrl = `https://wa.me/${order.shipping_phone?.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <CardContent className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 text-[11px]">
      <OrderShippingInfo order={order} isPickup={isPickup} />

      {order.tracking_code && order.tracking_code !== "Não rastreável" && (
        <OrderTracking trackingCode={order.tracking_code} />
      )}

      <OrderItemsModal
        order={order}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />

      {isMelhorEnvio && (
        <div className="space-y-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="w-full">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full h-8 text-xs font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center gap-1.5"
                      onClick={() => resendToMelhorEnvio()}
                      disabled={isResending}
                    >
                      <RefreshCw
                        size={13}
                        className={isResending ? "animate-spin" : ""}
                      />
                      {isResending ? "Enviando..." : "Reenviar ao Melhor Envio"}
                      <Info size={12} className="ml-1 opacity-70 shrink-0" />
                    </Button>
                  </div>
                }
              ></TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <p>
                  <strong>Aviso:</strong> O reenvio adiciona o item novamente no
                  carrinho do Melhor Envio, mas <u>não atualizará</u> o
                  protocolo vinculado a este pedido. O webhook continuará
                  monitorando apenas o protocolo original.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <OrderCardActions
        order={order}
        updateArchive={updateArchive}
        isArchivePending={isArchivePending}
        whatsappUrl={whatsappUrl}
      />
    </CardContent>
  );
}