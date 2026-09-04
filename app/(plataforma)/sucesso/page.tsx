// app/checkout/success/page.tsx

import { CheckCircle2, Home, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";

import { ClearCartTrigger } from "@/components/site/clear-cart-trigger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { WhatsAppActionButton } from "./components/whatsapp-action-button";
import { getOrderDetails } from "./services/order-service";

interface SuccessPageProps {
  searchParams: Promise<{
    order_id?: string;
  }>;
}

export default async function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const orderId = params.order_id;

  if (!orderId) {
    return (
      <div className="w-full max-w-sm mx-auto px-2">
        <Card>
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-bold text-foreground">
                Pedido não encontrado
              </h1>

              <p className="text-xs text-muted-foreground">
                Não conseguimos identificar o pedido. Volte para a loja e
                tente novamente.
              </p>
            </div>

            <Button
              render={<Link href="/">Voltar para a loja</Link>}
              nativeButton={false}
              className="w-full h-9 text-xs"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = await getOrderDetails(orderId);

  if (!order) {
    return (
      <div className="w-full max-w-sm mx-auto px-2">
        <Card>
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-bold text-foreground">
                Pedido não localizado
              </h1>

              <p className="text-xs text-muted-foreground">
                Não encontramos este pedido em nosso sistema.
              </p>
            </div>

            <Button
              render={<Link href="/">Voltar para a loja</Link>}
              nativeButton={false}
              className="w-full h-9 text-xs"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderItems = order.order_items || [];
  const orderShortId = orderId.substring(0, 8).toUpperCase();

  return (
    <div className="w-full max-w-sm mx-auto px-2 py-2">
      <ClearCartTrigger />

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="pt-5 pb-5 px-4 text-center">
          {/* Ícone */}
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>

          {/* Título */}
          <h1 className="text-lg font-bold tracking-tight">
            Pedido recebido!
          </h1>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Seu pedido foi registrado com sucesso. Envie-o pelo WhatsApp para
            combinar os detalhes diretamente com a loja.
          </p>

          {/* Número do pedido */}
          <div className="mt-3 inline-flex items-center rounded-full bg-muted px-2.5 py-1">
            <span className="text-[11px] text-muted-foreground mr-1">
              Pedido
            </span>

            <span className="text-[11px] font-bold font-mono">
              #{orderShortId}
            </span>
          </div>

          {/* WhatsApp */}
          <div className="mt-4 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 space-y-2.5">
            <div className="flex items-center justify-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />

              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Envie seu pedido pelo WhatsApp
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Clique no botão para abrir o WhatsApp com os dados preenchidos.
            </p>

            <WhatsAppActionButton
              products={orderItems}
              orderId={orderId}
              order={{
                total: order.total,
                shipping_cost: order.shipping_cost,
              }}
            />
          </div>

          {/* Informação */}
          <div className="mt-4 rounded-lg bg-muted/50 border border-border/50 p-2.5 text-left">
            <p className="text-[10px] text-muted-foreground leading-tight">
              <strong className="text-foreground">Importante:</strong> pagamento,
              personalização e entrega são combinados diretamente com a loja.
            </p>
          </div>

          {/* Navegação */}
          <div className="mt-4 space-y-2">
            <Button
              render={<Link href="/perfil" />}
              nativeButton={false}
              variant="outline"
              className="w-full h-9 text-xs font-semibold"
            >
              <UserRound className="h-3.5 w-3.5 mr-1.5" />
              Acessar meu perfil
            </Button>

            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Home className="h-3.5 w-3.5" />
              Voltar para a loja
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}