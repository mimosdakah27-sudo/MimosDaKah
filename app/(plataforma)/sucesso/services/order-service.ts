// app/checkout/success/services/order-service.ts

import { supabaseServer } from "@/lib/supabase/server";

export async function getOrderDetails(orderId: string) {
  const supabase = await supabaseServer();

  // Busca apenas os campos necessários do pedido (total e shipping_cost)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, total, shipping_cost")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error(
      "[SUCCESS] Erro ao buscar pedido:",
      orderError,
    );

    return null;
  }

  // Busca os itens do pedido
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, product_name, product_image, unit_price, quantity, name, tamanho")
    .eq("order_id", orderId);

  if (itemsError) {
    console.error(
      "[SUCCESS] Erro ao buscar itens:",
      itemsError,
    );

    return null;
  }

  const itemsWithProductInfo = await Promise.all(
    (items || []).map(async (item) => {
      let tipo_venda:
        | "normal"
        | "orcamento"
        | "whatsapp_finalizacao" = "normal";

      if (item.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("tipo_venda")
          .eq("id", item.product_id)
          .maybeSingle();

        if (product?.tipo_venda) {
          tipo_venda = product.tipo_venda as
            | "normal"
            | "orcamento"
            | "whatsapp_finalizacao";
        }
      }

      return {
        ...item,
        product: {
          id: item.product_id,
          nome: item.product_name,
          imagem_url: item.product_image,
          tipo_venda,
        },
      };
    }),
  );

  return {
    ...order,
    order_items: itemsWithProductInfo,
  };
}