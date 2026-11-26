import { revalidateProductFull } from "@/lib/actions/revalidate";
import { getStripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  console.log("[WEBHOOK STRIPE] Iniciando processamento de evento...");

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status !== "paid") return new NextResponse(null, { status: 200 });
    const metadata = session.metadata || {};
    const orderId = metadata.orderId;

    try {
      console.log(
        `[WEBHOOK STRIPE] Sessão concluída para o pedido ID: ${orderId}`,
      );

      if (!orderId) {
        console.error(
          "[WEBHOOK STRIPE] orderId não encontrado nos metadados da sessão.",
        );
        return new NextResponse("Order ID ausente", { status: 400 });
      }

      // 1. Atualizar o status de pagamento do pedido existente para "Pago"
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ payment_status: "Pago" })
        .eq("id", orderId);

      if (updateError) {
        console.error(
          "Erro ao atualizar pagamento do pedido no Supabase:",
          updateError,
        );
        throw new Error("Erro ao atualizar status do pedido");
      }

      console.log(
        `[WEBHOOK STRIPE] Pedido ${orderId} atualizado para Pago com sucesso.`,
      );

      // 2. Buscar o pedido completo com os itens cadastrados no Supabase
      const { data: order, error: orderQueryError } = await supabaseAdmin
        .from("orders")
        .select("order_items(product_id)")
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

    } catch (error) {
      console.error("[WEBHOOK STRIPE] Erro interno:", error);
      return new NextResponse("Erro processando pedido", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
