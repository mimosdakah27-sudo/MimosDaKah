import { useState } from "react";
import {
  CalendarDays,
  CreditCard,
  ExternalLink,
  HelpCircle,
  MapPin,
  MessageCircle,
  ReceiptText,
  Trash2,
  Truck,
} from "lucide-react";

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
import { useCart } from "@/lib/store/cart";

import { OrderProductItem } from "./OrderProductItem";

interface OrderCardProps {
  order: any;
  loadingCheckoutId: string | null;
  onCheckout: (order: any) => void;
  onWhatsAppSupport: (order: any) => void;
  onRejectOrder?: (orderId: string) => void;
}

export function OrderCard({
  order,
  loadingCheckoutId,
  onCheckout,
  onWhatsAppSupport,
  onRejectOrder,
}: OrderCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);

  /**
   * Verifica se o pedido é um orçamento.
   */
  const isQuote =
    order.shipping_type === "orcamento";

  /**
   * Verifica se o pedido ainda precisa
   * ser pago.
   */
  const isPendingPayment =
    order.payment_status === "pending" ||
    order.status === "Aguardando Pagamento";

  /**
   * Carrega os itens do orçamento para o carrinho.
   *
   * IMPORTANTE:
   *
   * O orçamento NÃO substitui o carrinho atual.
   *
   * Os itens existentes no carrinho são preservados
   * e os itens do orçamento são adicionados através
   * do addMany().
   *
   * O addMany() é responsável por evitar duplicações
   * conforme a lógica definida na store.
   */
  const handleLoadQuoteToCart = () => {
  console.log("ORÇAMENTO COMPLETO:", order);
  console.log("ITENS DO ORÇAMENTO:", order.order_items);

  if (
    !Array.isArray(order.order_items) ||
    order.order_items.length === 0
  ) {
    onCheckout(order);
    return;
  }

  const quoteItems = order.order_items.map(
    (item: any) => {
      console.log("ITEM DO ORÇAMENTO:", {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product_name: item.product_name,
      });

      // restante...
    }
  );

  console.log("ITENS QUE SERÃO ADICIONADOS:", quoteItems);

  useCart.getState().addMany(quoteItems);

  onCheckout(order);
};

  const getLogisticsMessage = (
    status: string,
    shippingType: string
  ) => {
    if (shippingType === "orcamento") {
      return "Orçamento pronto! Finalize o pagamento para definir os detalhes de envio.";
    }

    if (shippingType === "retirada") {
      switch (status) {
        case "Aguardando Pagamento":
          return "Aguardando confirmação do pagamento.";

        case "Em Preparação":
          return "Seu produto está sendo preparado.";

        case "pronto_para_retirada":
          return "Seu produto está pronto para retirada.";

        case "Preparando Entrega":
          return "Estamos organizando os últimos detalhes para a retirada.";

        case "Etiqueta Paga":
          return "Pagamento confirmado. Aguardando separação.";

        case "Postado":
          return "Pedido separado para retirada.";

        case "Entregue":
          return "Seu produto foi entregue com sucesso.";

        default:
          return "Aguardando atualizações do status.";
      }
    }

    if (shippingType === "entrega_propria") {
      switch (status) {
        case "Aguardando Pagamento":
          return "Aguardando confirmação do pagamento.";

        case "Em Preparação":
          return "Seu produto está sendo preparado.";

        case "pronto_para_retirada":
          return "Pedido pronto.";

        case "Preparando Entrega":
          return "Seu produto está sendo preparado e logo sairá para entrega.";

        case "Etiqueta Paga":
          return "Pagamento confirmado.";

        case "Postado":
          return "Pedido a caminho com o entregador.";

        case "Entregue":
          return "Seu produto foi entregue com sucesso.";

        default:
          return "Seu produto está sendo preparado.";
      }
    }

    switch (status) {
      case "Aguardando Pagamento":
        return "Aguardando confirmação do pagamento.";

      case "Em Preparação":
        return "Seu produto está sendo preparado.";

      case "Preparando Entrega":
        return "Preparando pacote para envio.";

      case "pronto_para_retirada":
        return "Seu produto está pronto para retirada.";

      case "Etiqueta Paga":
        return "Etiqueta gerada, aguardando postagem.";

      case "Postado":
        return "Seu pedido foi postado na transportadora.";

      case "Entregue":
        return "Seu produto foi entregue com sucesso.";

      default:
        return "Acompanhe o rastreio do seu envio abaixo.";
    }
  };

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    onRejectOrder?.(order.id);
  };

  return (
    <>
      <Card
        className={`overflow-hidden transition-all ${
          isPendingPayment
            ? "border-amber-500/50 shadow-sm"
            : ""
        }`}
      >
        <CardHeader
          className={
            isPendingPayment
              ? "bg-amber-500/10 border-b border-amber-500/20"
              : "bg-muted/30 border-b"
          }
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  Pedido #
                  {order.id.slice(0, 8)}
                </CardTitle>

                {isQuote && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5">
                    🏷️ Orçamento
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />

                {new Date(
                  order.created_at
                ).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <Badge
              variant={
                isPendingPayment
                  ? "outline"
                  : "default"
              }
              className={`rounded-md uppercase tracking-wider font-extrabold text-[10px] px-3 py-1 ${
                isPendingPayment
                  ? "border-amber-500 text-amber-600 bg-amber-500/10"
                  : ""
              }`}
            >
              {order.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {isPendingPayment && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />

              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-amber-700 dark:text-amber-400">
                  {isQuote
                    ? "Orçamento pronto para pagamento!"
                    : "Aguardando confirmação do pagamento"}
                </p>

                <p className="text-muted-foreground">
                  {isQuote
                    ? 'O valor deste produto/serviço foi definido pela loja. Clique em "Pagar e Finalizar Pedido" para ir ao checkout e concluir sua compra.'
                    : "Clique abaixo para prosseguir com o pagamento e finalizar seu pedido."}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Produtos
            </h4>

            {order.order_items?.map(
              (item: any) => (
                <OrderProductItem
                  key={item.id}
                  item={item}
                />
              )
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
            {/* Informações de Entrega */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Truck className="h-4 w-4 text-primary" />
                Informações de Entrega
              </div>

              <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground space-y-2 border">
                <p className="font-bold text-foreground">
                  {order.shipping_type ===
                  "retirada"
                    ? "Retirada na Loja"
                    : order.shipping_type ===
                        "entrega_propria"
                      ? "Entrega Própria da Loja"
                      : order.shipping_type ===
                          "orcamento"
                        ? "A definir no Checkout (Orçamento)"
                        : "Envio por Transportadora"}
                </p>

                {order.shipping_type !==
                  "retirada" && (
                  <p className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />

                    {order.shipping_address},{" "}
                    {order.shipping_city}
                  </p>
                )}

                {order.shipping_type ===
                "melhor_envio" ? (
                  order.tracking_code ? (
                    <a
                      href={`https://www.melhorrastreio.com.br/rastreio/${order.tracking_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-primary font-bold hover:underline"
                    >
                      Rastrear:{" "}
                      {order.tracking_code}{" "}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="font-semibold text-amber-600">
                      Esperando código de rastreio
                    </p>
                  )
                ) : (
                  <p
                    className={`font-semibold ${
                      order.status ===
                      "Pronto p/ Retirada"
                        ? "text-emerald-600 dark:text-emerald-400 text-sm font-bold"
                        : "text-primary"
                    }`}
                  >
                    {getLogisticsMessage(
                      order.status,
                      order.shipping_type
                    )}
                  </p>
                )}

                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onWhatsAppSupport(
                        order
                      )
                    }
                    className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/40 font-semibold text-xs h-8"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />

                    {isQuote
                      ? "Falar sobre este orçamento no WhatsApp"
                      : "Falar sobre este pedido no WhatsApp"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ReceiptText className="h-4 w-4 text-primary" />
                Resumo Financeiro
              </div>

              <div className="space-y-3 p-3 bg-card border rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>

                    <span>
                      {formatBRL(
                        Number(order.total) -
                          Number(
                            order.shipping_cost ||
                              0
                          )
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Frete</span>

                    <span>
                      {order.shipping_cost
                        ? formatBRL(
                            Number(
                              order.shipping_cost
                            )
                          )
                        : "A calcular"}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t">
                    <span>Total</span>

                    <span className="text-primary">
                      {formatBRL(
                        Number(order.total)
                      )}
                    </span>
                  </div>
                </div>

                {isPendingPayment && (
                  <div className="space-y-2 mt-2">
                    <Button
                      onClick={
                        handleLoadQuoteToCart
                      }
                      disabled={
                        loadingCheckoutId ===
                        order.id
                      }
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm gap-2"
                    >
                      <CreditCard className="h-4 w-4" />

                      {loadingCheckoutId ===
                      order.id
                        ? "Redirecionando..."
                        : "Pagar e Finalizar Pedido"}
                    </Button>

                    {isQuote && (
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectModal(true)}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/40 text-xs font-semibold h-9 gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Recusar Orçamento
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação ao recusar o orçamento */}
      <AlertDialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar Orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja recusar este orçamento (#{order.id.slice(0, 8)})? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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