import { supabaseBrowser } from "@/lib/supabase/client";
import type { OrderWithItems } from "../types/profile-type";

/**
 * Busca os pedidos do cliente autenticado.
 *
 * Também carrega o tipo_venda do produto de cada item.
 * Se pelo menos um produto tiver tipo_venda = "orcamento",
 * o pedido será considerado um orçamento no perfil.
 */
export async function getUserOrders(
  userId: string,
): Promise<OrderWithItems[]> {
  const supabase = supabaseBrowser();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,created_at,status,total,shipping_cost,shipping_address,shipping_city,shipping_state,
      shipping_zip,shipping_number,shipping_neighborhood,shipping_service_id,shipping_type,
      order_items!inner(id,product_image,product_name,unit_price,quantity,name,tamanho,products(tipo_venda))
    `)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Erro ao carregar pedidos:",
      error.message,
    );

    throw error;
  }

  return (data ?? []) as unknown as OrderWithItems[];
}

/**
 * Recusa/exclui um orçamento.
 */
export async function rejectQuote(
  orderId: string,
) {
  const supabase = supabaseBrowser();

  // The owner policy checks the quote before the FK removes its items atomically.
  const { error: orderError } = await supabase.from("orders")
    .delete().eq("id", orderId).select("id").single();

  if (orderError) {
    console.error(
      "Erro ao excluir orçamento:",
      orderError.message,
    );

    throw orderError;
  }
}
