import { supabaseBrowser } from "@/lib/supabase/client";
import type { OrderWithItems } from "../types/profile-type";

export async function getUserOrders(
  userId: string
): Promise<OrderWithItems[]> {
  const { data, error } = await supabaseBrowser()
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar pedidos:", error.message);
    throw error;
  }

  return (data ?? []) as unknown as OrderWithItems[];
}

/**
 * Recusa/exclui um orçamento.
 */
export async function rejectQuote(orderId: string) {
  const supabase = supabaseBrowser();

  // Primeiro remove os itens do orçamento.
  const { error: itemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (itemsError) {
    console.error(
      "Erro ao excluir itens do orçamento:",
      itemsError.message
    );

    throw itemsError;
  }

  // Depois remove o pedido/orçamento.
  const { error: orderError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (orderError) {
    console.error(
      "Erro ao excluir orçamento:",
      orderError.message
    );

    throw orderError;
  }
}