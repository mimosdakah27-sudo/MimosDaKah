"use client";

import {
  CalendarDays,
  HelpCircle,
  MapPin,
  MessageCircle,
  ReceiptText,
  Trash2,
  Truck,
} from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatBRL } from "@/lib/utils";

import { OrderProductItem } from "./OrderProductItem";

interface StoreConfig {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  phone?: string | null;
}

interface OrderCardProps {
  order: any;
  storeConfig?: StoreConfig | null;
  onWhatsAppSupport: (order: any) => void;
  onRejectOrder?: (orderId: string) => void;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  "Aguardando confirmação": "Aguardando confirmação",
  "Aguardando pagamento": "Aguardando confirmação",

  aguarde: "Aguardando confirmação",

  "Em preparação": "Em preparação",
  "Em Preparação": "Em preparação",

  "Pronto para retirada": "Pronto para retirada",
  pronto_para_retirada: "Pronto para retirada",

  "Preparando entrega": "Preparando entrega",
  "Preparando Entrega": "Preparando entrega",

  "Em rota de entrega": "Saiu para entrega",
  "Saiu para entrega": "Saiu para entrega",

  Entregue: "Entregue",

  Cancelado: "Cancelado",
};

function getOrderStatusLabel(status?: string | null) {
  if (!status) {
    return "Aguardando confirmação";
  }

  return ORDER_STATUS_LABELS[status] || status;
}

function normalize(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatZip(zip?: string | null) {
  const value = String(zip ?? "").replace(/\D/g, "");

  if (value.length !== 8) {
    return zip || "";
  }

  return `${value.slice(0, 5)}-${value.slice(5)}`;
}

export function OrderCard({
  order,
  storeConfig,
  onWhatsAppSupport,
  onRejectOrder,
}: OrderCardProps) {
  const [showRejectModal, setShowRejectModal] =
    useState(false);

  /**
   * ORÇAMENTO
   *
   * O pedido inteiro é considerado orçamento quando
   * pelo menos um dos produtos possui tipo_venda = "orcamento".
   *
   * O profile-service deve anexar tipo_venda diretamente
   * em cada order_item.
   */
  const isQuote =
    Array.isArray(order.order_items) &&
    order.order_items.some(
      (item: any) =>
        normalize(item.tipo_venda) === "orcamento",
    );

  /**
   * Modalidade.
   */
  const shippingType = normalize(
    order.shipping_type,
  );

  const shippingServiceId = normalize(
    order.shipping_service_id,
  );

  const isPickup =
    shippingType === "retirada" ||
    shippingServiceId === "pickup";

  const isLocalDelivery =
    shippingType === "entrega na cidade" ||
    shippingType === "entrega própria" ||
    shippingType === "entrega_propria" ||
    shippingServiceId === "local";

  const isOtherCity =
    shippingType === "entrega em outra cidade" ||
    shippingType === "outra_cidade" ||
    shippingType === "melhor_envio" ||
    shippingServiceId === "outra_cidade" ||
    shippingServiceId === "frete_calculado";

  /**
   * O orçamento tem prioridade.
   */
  const orderTypeLabel = isQuote
    ? "Orçamento"
    : isPickup
      ? "Retirada na Loja"
      : isLocalDelivery
        ? "Entrega Própria"
        : isOtherCity
          ? "Entrega"
          : "Pedido";

  /**
   * Endereço da loja.
   */
  const storeAddressParts = [
    storeConfig?.address,
    storeConfig?.city,
    storeConfig?.state,
  ].filter(Boolean);

  const storeAddress = storeAddressParts.join(" - ");

  const storeZip = formatZip(
    storeConfig?.zip_code,
  );

  /**
   * Mensagem de acompanhamento.
   */
  const getLogisticsMessage = () => {
    const status = order.status || "";

    if (status === "Cancelado") {
      return isQuote
        ? "Este orçamento foi cancelado."
        : "Este pedido foi cancelado.";
    }

    if (status === "Entregue") {
      return "Seu pedido foi entregue com sucesso.";
    }

    if (isQuote) {
      return "Seu orçamento foi recebido. Fale com a loja para combinar os próximos detalhes.";
    }

    if (isPickup) {
      switch (status) {
        case "Pronto para retirada":
        case "pronto_para_retirada":
          return "Seu pedido está pronto para retirada na loja.";

        case "Em preparação":
        case "Em Preparação":
          return "Seu pedido está sendo preparado.";

        case "Aguardando confirmação":
        case "Aguardando pagamento":
        case "aguarde":
          return "Seu pedido foi recebido e aguarda confirmação da loja.";

        default:
          return "Acompanhe aqui as atualizações do seu pedido.";
      }
    }

    if (isLocalDelivery) {
      switch (status) {
        case "Em preparação":
        case "Em Preparação":
          return "Seu pedido está sendo preparado.";

        case "Preparando entrega":
        case "Preparando Entrega":
          return "Seu pedido está sendo preparado para entrega.";

        case "Em rota de entrega":
        case "Saiu para entrega":
          return "Seu pedido saiu para entrega.";

        case "Aguardando confirmação":
        case "Aguardando pagamento":
        case "aguarde":
          return "Seu pedido foi recebido e aguarda confirmação da loja.";

        default:
          return "Acompanhe aqui as atualizações do seu pedido.";
      }
    }

    if (isOtherCity) {
      switch (status) {
        case "Em preparação":
        case "Em Preparação":
          return "Seu pedido está sendo preparado.";

        case "Aguardando confirmação":
        case "Aguardando pagamento":
        case "aguarde":
          return "Seu pedido foi recebido e aguarda confirmação da loja.";

        default:
          return "Acompanhe aqui as atualizações do seu pedido.";
      }
    }

    return "Acompanhe aqui as atualizações do seu pedido.";
  };

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    onRejectOrder?.(order.id);
  };

  const subtotal =
    Number(order.total || 0) -
    Number(order.shipping_cost || 0);

  return (
    <>
      <Card className="overflow-hidden transition-all">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg">
                  {isQuote ? "Orçamento" : "Pedido"} #
                  {order.id.slice(0, 8)}
                </CardTitle>

                <Badge
                  className={
                    isQuote
                      ? "bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5"
                      : "text-[10px] uppercase tracking-wider font-bold"
                  }
                >
                  {orderTypeLabel}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />

                {new Date(
                  order.created_at,
                ).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <Badge
              variant="outline"
              className="rounded-md uppercase tracking-wider font-extrabold text-[10px] px-3 py-1"
            >
              {getOrderStatusLabel(order.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* =================================================
              ORÇAMENTO
          ================================================== */}

          {isQuote && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />

              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-amber-700 dark:text-amber-400">
                  Este pedido é um orçamento
                </p>

                <p className="text-muted-foreground">
                  A loja irá analisar os produtos
                  solicitados e entrar em contato para
                  informar os detalhes e o valor final.
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              PRODUTOS
          ================================================== */}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Produtos
            </h4>

            {order.order_items?.map((item: any) => (
              <OrderProductItem
                key={item.id}
                item={item}
              />
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
            {/* =================================================
                ENTREGA / RETIRADA
            ================================================== */}

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Truck className="h-4 w-4 text-primary" />
                {isPickup
                  ? "Informações de Retirada"
                  : "Informações de Entrega"}
              </div>

              <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground space-y-3 border">
                <p className="font-bold text-foreground">
                  {orderTypeLabel}
                </p>

                {/* =================================================
                    RETIRADA NA LOJA
                ================================================== */}

                {isPickup && !isQuote && (
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-background p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />

                        <p className="font-bold text-foreground">
                          Local de retirada
                        </p>
                      </div>

                      {storeAddress ? (
                        <div className="pl-6 space-y-0.5">
                          <p className="text-foreground">
                            {storeAddress}
                          </p>

                          {storeZip && (
                            <p>
                              CEP {storeZip}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="pl-6">
                          Consulte a loja para confirmar
                          o endereço de retirada.
                        </p>
                      )}
                    </div>

                    <p className="text-muted-foreground">
                      Precisa da localização exata da
                      loja? Fale conosco pelo WhatsApp
                      e peça a localização.
                    </p>
                  </div>
                )}

                {/* =================================================
                    ENDEREÇO DE ENTREGA
                ================================================== */}

                {!isPickup &&
                  !isQuote &&
                  order.shipping_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />

                      <span>
                        {order.shipping_address}

                        {order.shipping_number &&
                          `, ${order.shipping_number}`}

                        {order.shipping_neighborhood &&
                          ` - ${order.shipping_neighborhood}`}

                        {order.shipping_city &&
                          `, ${order.shipping_city}`}

                        {order.shipping_state &&
                          ` - ${order.shipping_state}`}

                        {order.shipping_zip &&
                          ` - CEP ${formatZip(
                            order.shipping_zip,
                          )}`}
                      </span>
                    </div>
                  )}

                <p className="font-semibold text-primary">
                  {getLogisticsMessage()}
                </p>

                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onWhatsAppSupport(order)
                    }
                    className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/40 font-semibold text-xs h-9"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />

                    {isQuote
                      ? "Falar sobre este orçamento"
                      : isPickup
                        ? "Pedir localização e falar com a loja"
                        : "Falar sobre este pedido"}
                  </Button>
                </div>
              </div>
            </div>

            {/* =================================================
                RESUMO
            ================================================== */}

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ReceiptText className="h-4 w-4 text-primary" />
                Resumo do Pedido
              </div>

              <div className="space-y-3 p-3 bg-card border rounded-lg">
                {isQuote ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Valor</span>

                      <span>
                        {Number(order.total || 0) > 0
                          ? formatBRL(
                              Number(order.total),
                            )
                          : "A definir"}
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        O valor final será informado pela
                        loja após a análise do orçamento.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>

                      <span>
                        {formatBRL(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Entrega</span>

                      <span>
                        {Number(
                          order.shipping_cost || 0,
                        ) > 0
                          ? formatBRL(
                              Number(
                                order.shipping_cost,
                              ),
                            )
                          : "Grátis"}
                      </span>
                    </div>

                    <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t">
                      <span>Total</span>

                      <span className="text-primary">
                        {formatBRL(
                          Number(order.total || 0),
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {isQuote && onRejectOrder && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setShowRejectModal(true)
                    }
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/40 text-xs font-semibold h-9 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Recusar Orçamento
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =======================================================
          MODAL DE RECUSA
      ======================================================== */}

      <AlertDialog
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Recusar Orçamento?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Tem certeza que deseja recusar este
              orçamento (#{order.id.slice(0, 8)})?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirmReject}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Sim, recusar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}