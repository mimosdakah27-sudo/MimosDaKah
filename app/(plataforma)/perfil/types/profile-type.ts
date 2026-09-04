import type { Database } from "@/types/database";

export type OrderItemRow =
  Database["public"]["Tables"]["order_items"]["Row"];

export type OrderRow =
  Database["public"]["Tables"]["orders"]["Row"];

export interface OrderItemWithProduct
  extends OrderItemRow {
  products?: {
    tipo_venda:
      | "normal"
      | "orcamento"
      | "whatsapp_finalizacao"
      | null;
  } | null;
}

export interface OrderWithItems
  extends OrderRow {
  order_items: OrderItemWithProduct[];
}