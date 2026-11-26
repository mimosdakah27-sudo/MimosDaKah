import type { Database } from "@/types/database";

export type OrderItemRow =
  Database["public"]["Tables"]["order_items"]["Row"];

export type OrderRow =
  Database["public"]["Tables"]["orders"]["Row"];

export interface OrderItemWithProduct
  extends Pick<OrderItemRow, "id" | "product_image" | "product_name" | "unit_price" | "quantity" | "name" | "tamanho"> {
  products?: {
    tipo_venda:
      | "normal"
      | "orcamento"
      | "whatsapp_finalizacao"
      | null;
  } | null;
}

export interface OrderWithItems
  extends Pick<OrderRow, "id" | "created_at" | "status" | "total" | "shipping_cost" |
    "shipping_address" | "shipping_city" | "shipping_state" | "shipping_zip" | "shipping_service_id" | "shipping_type"> {
  shipping_number: string | null;
  shipping_neighborhood: string | null;
  order_items: OrderItemWithProduct[];
}
export function isQuoteOrder(order: OrderWithItems) {
  return order.shipping_type === "orcamento" ||
    order.order_items.some((item) => item.products?.tipo_venda === "orcamento");
}
