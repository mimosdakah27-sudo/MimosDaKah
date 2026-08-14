"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  Eye,
  Info,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/hooks/use-store";
import { enviarParaCarrinhoMelhorEnvio } from "@/lib/actions/melhor-envio";
import { formatBRL } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAdminOrders } from "../hooks/use-admin-orders";
import type { OrderWithItems } from "../types/admin-types";

export function OrdersTab({ orders }: { orders: OrderWithItems[] }) {
  const { updateStatus, updateArchive, isStatusPending, isArchivePending } =
    useAdminOrders();

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
          updateArchive={updateArchive}
          isStatusPending={isStatusPending}
          isArchivePending={isArchivePending}
        />
      ))}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground p-4 text-center">
      Nenhum pedido encontrado.
    </div>
  );
}

function OrderCard({
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

function OrderCardHeader({ order, updateStatus, isStatusPending }: any) {
  const isPickup = order.shipping_type === "retirada";
  const isLocal = order.shipping_type === "entrega_propria";

  return (
    <div className="border-b border-border/50 bg-muted/20 p-3 sm:p-4">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs sm:text-sm font-bold tracking-tight break-all">
              #{order.id.slice(0, 8)}
            </span>
            <Badge
              className={`text-[8px] uppercase shrink-0 ${
                isPickup
                  ? "bg-purple-600 text-white"
                  : isLocal
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
              }`}
            >
              {isPickup
                ? "Retirada"
                : isLocal
                  ? "Entrega Própria"
                  : "Melhor Envio"}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-xs sm:text-sm font-bold text-primary">
            {formatBRL(Number(order.total))}
          </p>
          <div className="flex flex-wrap gap-1 justify-end">
            <Badge className="text-[9px]">{order.payment_status}</Badge>
            <Badge className="text-[9px] bg-primary/10 text-primary">
              {order.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor={`order-status-${order.id}`} className="sr-only">
          Status do pedido #{order.id.slice(0, 8)}
        </label>
        <Select
          value={order.status}
          onValueChange={(val) => updateStatus({ id: order.id, status: val })}
          disabled={isStatusPending}
        >
          <SelectTrigger
            id={`order-status-${order.id}`}
            className="w-full h-8 text-xs bg-background"
            aria-label={`Status do pedido #${order.id.slice(0, 8)}`}
          >
            <SelectValue>{order.status}</SelectValue>
          </SelectTrigger>
          <SelectContent className="w-[220px]">
            <SelectItem value="Em Preparação">Em Preparação</SelectItem>
            <SelectItem value="Pronto p/ Retirada">
              Pronto p/ Retirada
            </SelectItem>
            <SelectItem value="Preparando Entrega">
              Preparando Entrega
            </SelectItem>
            <SelectItem value="Etiqueta Paga">Etiqueta Paga</SelectItem>
            <SelectItem value="Postado">Postado</SelectItem>
            <SelectItem value="Entregue">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function OrderCardBody({
  order,
  isPickup,
  isMelhorEnvio,
  updateArchive,
  isArchivePending,
  storeConfig,
}: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Mutation para reenviar ao carrinho do Melhor Envio
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
  const message = `Olá ${clientName}! Aqui é da ${storeName}. Estou entrando em contato sobre o seu pedido #${order.id.slice(0, 8)}.`;
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

function OrderShippingInfo({ order, isPickup }: any) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5 sm:p-3 space-y-2 border border-border/50">
      <div className="font-bold flex items-center gap-1.5 text-xs">
        {isPickup ? <MapPin size={13} /> : <User size={13} />}
        {isPickup ? "Local de Retirada" : "Cliente"}
      </div>
      <p className="font-medium truncate">
        {order.shipping_name}{" "}
        {order.shipping_document && `(${order.shipping_document})`}
      </p>

      {!isPickup && (
        <p className="text-muted-foreground leading-tight">
          {order.shipping_address}, {order.shipping_city} -{" "}
          {order.shipping_state}
        </p>
      )}

      <div className="pt-2 border-t border-border/20 font-bold space-y-1">
        <div className="flex justify-between items-center gap-2">
          <span className="flex items-center gap-1 shrink-0">
            <Truck size={12} /> Serviço:
          </span>
          <span className="truncate text-right">
            {order.shipping_company_name || "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Frete:</span>
          <span>{formatBRL(Number(order.shipping_cost || 0))}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Peso:</span>
          <span>{order.total_weight}kg</span>
        </div>
      </div>
    </div>
  );
}

function OrderTracking({ trackingCode }: { trackingCode: string }) {
  return (
    <a
      href={`https://www.melhorrastreio.com.br/rastreio/${trackingCode}`}
      target="_blank"
      rel="noreferrer"
      className="block bg-blue-50/80 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
    >
      <p className="font-bold text-blue-800 dark:text-blue-300 flex justify-between items-center text-[10px] sm:text-xs">
        <span className="truncate">Rastreio: {trackingCode}</span>
        <ExternalLink size={11} className="shrink-0 ml-1" />
      </p>
    </a>
  );
}

function OrderItemsModal({ order, isModalOpen, setIsModalOpen }: any) {
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Package size={14} /> Ver Mimos ({order.order_items.length})
            </span>
            <Eye size={12} className="text-muted-foreground shrink-0" />
          </Button>
        }
      />

      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh] rounded-xl sm:rounded-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Package size={16} /> Itens do Pedido #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5 mt-2">
          {order.order_items.map((i: any) => (
            <div
              key={i.id}
              className="flex items-center gap-2.5 p-2 rounded-lg border border-border/60 bg-muted/20"
            >
              {i.product_image ? (
                <img
                  src={i.product_image}
                  alt={i.product_name}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md border border-border shrink-0"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-md border border-border flex items-center justify-center shrink-0 text-[9px] text-muted-foreground text-center p-1">
                  Sem foto
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate">{i.product_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Qtd: {i.quantity}x
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-primary">
                  {formatBRL(Number(i.unit_price) * i.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderCardActions({
  order,
  updateArchive,
  isArchivePending,
  whatsappUrl,
}: any) {
  return (
    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-[10px] flex-1 sm:flex-none"
        onClick={() =>
          updateArchive({ id: order.id, is_archived: !order.is_archived })
        }
        disabled={isArchivePending}
      >
        {order.is_archived ? (
          <ArchiveRestore size={13} className="mr-1" />
        ) : (
          <Archive size={13} className="mr-1" />
        )}
        {order.is_archived ? "Desarquivar" : "Arquivar"}
      </Button>

      {order.shipping_phone && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 sm:flex-none"
        >
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[10px] w-full"
          >
            <MessageCircle size={13} className="mr-1 text-emerald-600" />{" "}
            WhatsApp
          </Button>
        </a>
      )}
    </div>
  );
}
