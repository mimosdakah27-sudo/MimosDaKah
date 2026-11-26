"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { BackButton } from "@/components/site/back-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";

import { OrderCard } from "./components/OrderCard";
import { isQuoteOrder, type OrderWithItems } from "./types/profile-type";
import { whatsAppNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "./hooks/use-profile";

export default function ProfilePage() {
  const { user, orders, handleRejectQuote, rejectingId, isInitialLoading, loadFailed, retry } = useProfile();

  const { config } = useStore();

  const { profile } = useAuth();

  const searchParams = useSearchParams();

  const pathname = usePathname();

  const searchOrder = searchParams.get("order") || "";

  const cleanSearchTerm = searchOrder.replace(/#/g, "").trim().toLowerCase();

  /**
   * Pesquisa por código do pedido.
   */
  const handleSearchChange = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (term) {
      params.set("order", term);
    } else {
      params.delete("order");
    }

    const query = params.toString();

    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  const filteredOrders = orders.filter((order) => {
    if (cleanSearchTerm.length < 3) {
      return true;
    }

    return order.id.toLowerCase().includes(cleanSearchTerm);
  });

  /**
   * Abre o WhatsApp da loja com
   * informações do pedido.
   */
  const handleWhatsAppSupport = (order: OrderWithItems) => {
    const cleanPhone = whatsAppNumber(config?.phone);

    if (!cleanPhone) {
      toast.error("O WhatsApp da loja não está configurado.");
      return;
    }

    const userName = profile?.display_name || user?.email || "Cliente";

    const orderIdShort = order.id.substring(0, 8);

    const isQuote = isQuoteOrder(order);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    /**
     * Link interno para o administrador
     * encontrar rapidamente o pedido.
     */
    const orderLink = `${origin}/admin?search=${encodeURIComponent(
      orderIdShort,
    )}#pedidos`;

    const message = isQuote
      ? `Olá! Gostaria de falar sobre o meu orçamento.

*Código do Orçamento:* #${orderIdShort}
*Cliente:* ${userName}
*Status:* ${order.status}

*Pedido no painel:* ${orderLink}

Poderia me ajudar com os detalhes do orçamento?`
      : `Olá! Gostaria de falar sobre o meu pedido.

*Código do Pedido:* #${orderIdShort}
*Cliente:* ${userName}
*Status:* ${order.status}

*Pedido no painel:* ${orderLink}

Poderia me ajudar?`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;

  if (isInitialLoading) return (
    <div role="status" aria-label="Carregando pedidos" className="mx-auto max-w-4xl space-y-4 py-6">
      <Skeleton className="h-9 w-48" /><Skeleton className="h-36 w-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <BackButton />

      <div className="space-y-1">
        <h1 className="page-title">
          Meu perfil
        </h1>

        <p className="text-muted-foreground font-medium">
          {user?.email || "Acesso restrito"}
        </p>
      </div>

      {!user ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Você precisa estar conectado à sua conta para visualizar seus
              pedidos.
            </p>
            <div>
              <Button
                render={
                  <Link href={loginUrl} className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Fazer login para ver pedidos
                  </Link>
                }
                nativeButton={false}
              ></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Meus pedidos
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                type="text"
                aria-label="Buscar pedido por código" placeholder="Buscar por código..."
                value={searchOrder}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-8"
              />

              {searchOrder && (
                <button
                  aria-label="Limpar busca" onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {loadFailed ? (
            <div role="alert" className="space-y-2 py-6">
              <p>Não foi possível carregar seus pedidos.</p>
              <Button variant="outline" onClick={() => void retry()}>Tentar novamente</Button>
            </div>
          ) : orders.length === 0 ? (
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
                  storeConfig={config}
                  onWhatsAppSupport={handleWhatsAppSupport}
                  onRejectOrder={handleRejectQuote}
                  rejecting={rejectingId === order.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
