// page.tsx (SuccessPage)
import { CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { ClearCartTrigger } from "@/components/site/clear-cart-trigger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { WhatsAppActionButton } from "./components/whatsapp-action-button";
import { getOrderDetails } from "./services/order-service";

interface SuccessPageProps {
  searchParams: Promise<{
    order_id?: string;
    session_id?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderId = params.order_id;
  const sessionId = params.session_id;

  console.log("Debug - searchParams recebidos:", { orderId, sessionId });

  if (!orderId) {
    console.log("Debug - order_id não encontrado na URL!");
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <Card>
          <CardContent className="pt-10 pb-8 space-y-4">
            <h1 className="text-xl font-bold text-foreground">
              Pedido não encontrado
            </h1>
            <p className="text-sm text-muted-foreground">
              Não conseguimos identificar o ID do pedido. (Session ID recebido:{" "}
              {sessionId || "Nenhum"})
            </p>
            <Button
              render={<Link href="/">Voltar para a loja</Link>}
              nativeButton={false}
              className="w-full"
            ></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = await getOrderDetails(orderId);

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <Card>
          <CardContent className="pt-10 pb-8 space-y-4">
            <h1 className="text-xl font-bold text-foreground">
              Pedido não localizado
            </h1>
            <p className="text-sm text-muted-foreground">
              O pedido com ID{" "}
              <span className="font-mono text-xs">{orderId}</span> não foi
              encontrado em nosso sistema.
            </p>
            <Button
              render={<Link href="/">Voltar para a loja</Link>}
              nativeButton={false}
              className="w-full"
            ></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica se algum item exige finalização via WhatsApp
  const whatsappItems =
    order.order_items?.filter(
      (item: any) =>
        item.tipo_venda === "whatsapp_finalizacao" ||
        item.product?.tipo_venda === "whatsapp_finalizacao",
    ) || [];

  const hasWhatsappItems = whatsappItems.length > 0;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <ClearCartTrigger />

      <Card>
        <CardContent className="pt-10 pb-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Pedido Confirmado!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seu pagamento foi processado com sucesso.
          </p>

          {hasWhatsappItems ? (
            <div className="mt-6 w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Este pedido contém itens personalizados que exigem finalização
                no WhatsApp:
              </p>
              <WhatsAppActionButton
                products={whatsappItems}
                orderId={orderId}
              />
            </div>
          ) : null}

          <div className="mt-8 space-y-3 w-full">
            {/* Oculta o botão "Ver meus pedidos" e "Continuar comprando" caso existam itens de WhatsApp */}
            {!hasWhatsappItems && (
              <>
                <Button
                  render={<Link href="/perfil">Ver meus pedidos</Link>}
                  nativeButton={false}
                  className="w-full font-semibold"
                ></Button>

                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <ShoppingBag className="h-4 w-4" /> Continuar comprando{" "}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}