import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enviarParaCarrinhoMelhorEnvio } from "@/lib/actions/melhor-envio";
import { revalidateProductFull } from "@/lib/actions/revalidate";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  console.log("[WEBHOOK STRIPE] Iniciando processamento de evento...");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata || {};
    const orderId = metadata.orderId;

    try {
      console.log(`[WEBHOOK STRIPE] Sessão concluída para o pedido ID: ${orderId}`);

      if (!orderId) {
        console.error("[WEBHOOK STRIPE] orderId não encontrado nos metadados da sessão.");
        return new NextResponse("Order ID ausente", { status: 400 });
      }

      // 1. Atualizar o status de pagamento do pedido existente para "Pago"
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ payment_status: "Pago" })
        .eq("id", orderId);

      if (updateError) {
        console.error("Erro ao atualizar pagamento do pedido no Supabase:", updateError);
        throw new Error("Erro ao atualizar status do pedido");
      }

      console.log(`[WEBHOOK STRIPE] Pedido ${orderId} atualizado para Pago com sucesso.`);

      // 2. Buscar o pedido completo com os itens cadastrados no Supabase
      const { data: order, error: orderQueryError } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();

      if (orderQueryError || !order) {
        console.error("Erro ao buscar pedido no Supabase:", orderQueryError);
        throw new Error("Erro ao buscar pedido");
      }

      // Revalidação do cache dos produtos
      if (order.order_items) {
        for (const item of order.order_items) {
          if (item.product_id) {
            await revalidateProductFull(item.product_id);
          }
        }
      }

      // 3. INTEGRAÇÃO COM MELHOR ENVIO
      if (order.shipping_type === "retirada" || order.shipping_type === "entrega_propria") {
        console.log(`[WEBHOOK STRIPE] Pedido ${orderId} local. Nenhuma ação externa necessária.`);
      } else {
        console.log(`[WEBHOOK STRIPE] Enviando pedido ${orderId} para o carrinho do Melhor Envio...`);
        try {
          await enviarParaCarrinhoMelhorEnvio(order);
          console.log(`[WEBHOOK STRIPE] Item adicionado ao carrinho do Melhor Envio com sucesso!`);
        } catch (integrationError) {
          console.error("❌ Falha na integração com Melhor Envio:", integrationError);
          await supabaseAdmin
            .from("orders")
            .update({ status: "Erro de Integração" })
            .eq("id", orderId);
        }
      }
    } catch (error) {
      console.error("[WEBHOOK STRIPE] Erro interno:", error);
      return new NextResponse("Erro processando pedido", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}