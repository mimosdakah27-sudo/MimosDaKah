"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BackButton } from "@/components/site/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { useCart } from "@/lib/store/cart";

import { useProfile } from "./hooks/use-profile";
import { OrderCard } from "./components/OrderCard";

export default function ProfilePage() {
  const { user, orders, handleRejectQuote } = useProfile();
  const { config } = useStore();
  const { profile } = useAuth();
  const add = useCart((s) => s.add);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [loadingCheckoutId, setLoadingCheckoutId] = useState<string | null>(null);

  const searchOrder = searchParams.get("order") || "";
  const cleanSearchTerm = searchOrder.replace(/#/g, "").trim().toLowerCase();

  const handleSearchChange = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("order", term);
    } else {
      params.delete("order");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filteredOrders = orders.filter((order) => {
    if (cleanSearchTerm.length < 3) return true;
    return order.id.toLowerCase().includes(cleanSearchTerm);
  });

  const handleCheckoutPendingOrder = (order: any) => {
    try {
      setLoadingCheckoutId(order.id);

      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item: any) => {
          const itemPayload = {
            id: item.product_id,
            nome: item.product_name,
            preco: Number(item.unit_price),
            imagem_url: item.product_image,
            variant_id: item.variant_id || null,
            name: item.name || null,
            item_weight: item.item_weight || 0,
            item_width: item.item_width || 0,
            item_height: item.item_height || 0,
            item_length: item.item_length || 0,
          };

          add(itemPayload as any, item.quantity || 1);
        });
      }

      toast.success("Redirecionando para o checkout...");
      // PASSAGEM DO ORDER_ID PARA NÃO CRIAR PEDIDO DUPLICADO
      router.push(`/checkout?order_id=${order.id}`);
    } catch (err) {
      toast.error("Erro ao redirecionar para o checkout. Tente novamente.");
      setLoadingCheckoutId(null);
    }
  };

  const handleWhatsAppSupport = (order: any) => {
    const phone = config?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone) {
      alert("O WhatsApp da loja não está configurado.");
      return;
    }

    const userName = profile?.display_name || user?.email || "Cliente";
    const orderIdShort = order.id.substring(0, 8);
    const isPendingPayment =
      order.payment_status === "pending" ||
      order.status === "Aguardando Pagamento";

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const orderLink = `${origin}${pathname}?order=${orderIdShort}`;

    const message = isPendingPayment
      ? `Olá! Gostaria de tirar uma dúvida sobre o meu *orçamento*.

*Código do Orçamento:* #${orderIdShort}
*Cliente:* ${userName}
*Status:* ${order.status}
*Link do orçamento:* ${orderLink}

Poderia me ajudar?`
      : `Olá! Gostaria de tirar uma dúvida sobre o meu *pedido*.

*Código do Pedido:* #${orderIdShort}
*Cliente:* ${userName}
*Status atual:* ${order.status}
*Link do pedido:* ${orderLink}

Poderia me ajudar?`;

    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <BackButton />

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Meu perfil
        </h1>
        <p className="text-muted-foreground font-medium">{user?.email}</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Meus pedidos
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por código..."
              value={searchOrder}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-8 text-xs h-9"
            />
            {searchOrder && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground font-medium text-sm">
              Você ainda não fez nenhum pedido.
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground font-medium text-sm space-y-2">
              <p>Nenhum pedido encontrado para o código "{searchOrder}".</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSearchChange("")}
              >
                Limpar filtro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                loadingCheckoutId={loadingCheckoutId}
                onCheckout={handleCheckoutPendingOrder}
                onWhatsAppSupport={handleWhatsAppSupport}
                 onRejectOrder={handleRejectQuote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}