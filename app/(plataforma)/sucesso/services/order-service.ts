import { hasOrderReceipt } from "../../checkout/services/order-receipt";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function getOrderDetails(orderId: string) {
  if (typeof orderId !== "string" || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(orderId)) return null;
  const hasReceipt = await hasOrderReceipt(orderId);
  let ownerId: string | null = null;
  if (!hasReceipt) {
    const session = await supabaseServer();
    const { data: { user }, error } = await session.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") throw new Error("Não foi possível consultar a conta.");
    if (!user) return null;
    ownerId = user.id;
  }
  let query = supabaseAdmin.from("orders")
    .select("id,total,shipping_cost,shipping_name,user_id,order_items(product_id,product_name,product_image,unit_price,quantity,name,tamanho)")
    .eq("id", orderId);
  query = ownerId ? query.eq("user_id", ownerId) : query.is("user_id", null);
  const [{ data, error }, store] = await Promise.all([
    query.abortSignal(AbortSignal.timeout(10_000)).maybeSingle(),
    supabaseAdmin.from("store_config").select("phone").eq("id", true)
      .abortSignal(AbortSignal.timeout(8_000)).maybeSingle(),
  ]);
  if (error) throw new Error("Não foi possível consultar o pedido.");
  if (!data || !data.order_items.length) return null;

  return {
    total: data.total, shipping_cost: data.shipping_cost ?? 0, name: data.shipping_name,
    isOwner: Boolean(ownerId), storePhone: store.data?.phone ?? null,
    order_items: data.order_items,
  };
}
