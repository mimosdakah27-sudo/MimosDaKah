"use server";

import { getShippingRates } from "@/lib/actions/shipping";
import type { CheckoutAddressDraft } from "@/lib/checkout-draft";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { getEffectivePrice, getLocalDeliveryFee, hasCheckoutAddress, hasCheckoutContact } from "../checkout-values";
import { orderIdForAttempt, setOrderReceipt } from "./order-receipt";

type CheckoutItem = {
  product: {
    id: string; preco: number; preco_promocional?: number | null;
    variant_id?: string | null; name?: string | null; tamanho?: string | null;
  };
  quantity: number;
};
type CheckoutUser = {
  name: string; phone: string; email: string; document: string;
  address: string; number: string; without_number: boolean; complement: string;
  reference: string; neighborhood: string; city: string; state: string; zip: string;
};
type Payload = {
  requestId: string;
  items: CheckoutItem[];
  shipping: { id: string; price: number };
  user: CheckoutUser;
};
type Result = { orderId: string } | { error: string; refreshShipping?: boolean; productId?: string };

const uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export async function saveUserAddress(address: CheckoutAddressDraft, onlyIfFirst = false) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !hasCheckoutAddress(address)) return { success: false };
  const { data: existing, error } = await supabase.from("user_addresses").select("zip_code,street,number,complement")
    .eq("user_id", user.id);
  if (error) return { success: false };
  const zip = address.zip_code.replace(/\D/g, "");
  const street = address.street.trim();
  const number = address.without_number ? null : address.number.trim();
  const complement = address.complement.trim() || null;
  if ((onlyIfFirst && existing.length) || existing.some((previous) =>
    previous.zip_code?.replace(/\D/g, "") === zip && previous.street?.trim().toLowerCase() === street.toLowerCase() &&
    (previous.number || null) === number && (previous.complement || null) === complement
  )) return { success: true };
  const { error: insertError } = await supabase.from("user_addresses").insert({
    user_id: user.id, zip_code: zip, street, number, complement,
    without_number: address.without_number, reference: address.reference.trim() || null,
    neighborhood: address.neighborhood.trim() || null, city: address.city.trim(), state: address.state.trim().toUpperCase(),
    role: "customer", active: !existing.length,
  });
  return { success: !insertError };
}

async function confirmedReceipt(orderId: string, ownerId: string | null) {
  const { data, error } = await supabaseAdmin.from("order_items").select("id")
    .eq("order_id", orderId).limit(1).maybeSingle();
  if (error) throw new Error("Não foi possível consultar o pedido.");
  if (!data) return null;
  if (!ownerId) await setOrderReceipt(orderId);
  return { orderId };
}

export async function createCheckoutSession(payload: Payload): Promise<Result> {
  if (!payload || typeof payload !== "object") return { error: "Revise os dados do pedido." };
  const { items, user: contact, shipping, requestId } = payload;
  if (!uuid.test(requestId) || !Array.isArray(items) || !items.length ||
      !items.every((item) => uuid.test(item?.product?.id) && Number.isSafeInteger(item.quantity) && item.quantity > 0)) {
    return { error: "Revise os produtos e as quantidades do pedido." };
  }
  if (!hasCheckoutContact(contact)) return { error: "Informe nome e telefone com DDD." };
  if ([contact.email, contact.document, contact.complement, contact.reference, contact.neighborhood]
      .some((field) => field != null && typeof field !== "string")) return { error: "Revise os dados do pedido." };
  const address = { ...contact, zip_code: contact.zip, street: contact.address };
  if (!hasCheckoutAddress(address)) return { error: "Revise o endereço de entrega." };
  if (!["pickup", "local", "other_city"].includes(shipping?.id) ||
      !Number.isFinite(shipping.price) || shipping.price < 0) return { error: "Selecione uma entrega válida." };

  const session = await supabaseServer();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") return { error: "Não foi possível confirmar a sessão. Tente novamente." };
  const ownerId = user?.id ?? null;
  const orderId = orderIdForAttempt(requestId, ownerId, [
    contact, shipping, items.map(({ product, quantity }) => [product.id, product.variant_id, product.tamanho, quantity, getEffectivePrice(product)]),
  ]);
  // Only completed orders have items. A retry can safely recover the original receipt.
  const receipt = await confirmedReceipt(orderId, ownerId);
  if (receipt) return receipt;

  const productIds = [...new Set(items.map((item) => item.product.id))];
  const [catalog, settings] = await Promise.all([
    supabaseAdmin.from("products")
      .select("id,nome,imagem_url,preco,preco_promocional,tipo_venda,weight,width,height,length,permite_retirada,product_variants(id,name)")
      .in("id", productIds).eq("ativo", true),
    supabaseAdmin.from("store_config").select("*").eq("id", true).maybeSingle(),
  ]);
  if (catalog.error || settings.error || !settings.data) return { error: "Não foi possível conferir o pedido. Tente novamente." };
  const products = new Map(catalog.data.map((product) => [product.id, product]));
  const lines = [];
  for (const [index, { product: selected, quantity }] of items.entries()) {
    const product = products.get(selected.id);
    if (!product) return { error: "Um dos produtos saiu do catálogo. Revise o pedido." };
    if (product.tipo_venda === "orcamento") {
      return {
        error: `${product.nome} agora é vendido sob orçamento. Remova o item do pedido ou solicite um orçamento na página do produto.`,
        productId: product.id,
      };
    }
    const unitPrice = getEffectivePrice(product);
    if (!(unitPrice > 0) || unitPrice !== getEffectivePrice(selected)) {
      return { error: `O preço de ${product.nome} mudou. Remova o item e adicione-o novamente pelo catálogo.`, productId: product.id };
    }
    const variantId = selected.variant_id === "default" ? null : selected.variant_id;
    const variant = variantId ? product.product_variants?.find((v) => v.id === variantId) : null;
    if ((variantId && !variant) || (!variantId && product.product_variants?.length)) return { error: `A variação de ${product.nome} não está mais disponível.` };
    lines.push({
      id: orderIdForAttempt(requestId, ownerId, ["item", orderId, index]),
      order_id: orderId, product_id: product.id, product_name: product.nome, product_image: product.imagem_url || "",
      unit_price: unitPrice, quantity, item_weight: Number(product.weight) || 0, item_width: Number(product.width) || 0,
      item_height: Number(product.height) || 0, item_length: Number(product.length) || 0,
      variant_id: variant?.id || null, name: variant?.name || null, tamanho: selected.tamanho || null,
    });
  }

  const store = settings.data;
  const zip = contact.zip.replace(/\D/g, "");
  const local = Boolean(store.allow_local_delivery && String(store.zip_code || "").replace(/\D/g, "") === zip);
  const pickup = shipping.id === "pickup";
  const localSelected = shipping.id === "local";
  const changed = { error: "As opções de entrega mudaram. Confira o frete e selecione novamente.", refreshShipping: true };
  let cost = 0;
  if (pickup) {
    if (!store.allow_local_pickup || catalog.data.some((product) => product.permite_retirada === false)) return changed;
  } else if (localSelected) {
    if (!local) return changed;
    const fee = getLocalDeliveryFee(store);
    if (fee == null) return changed;
    cost = fee;
  } else {
    if (local) return changed;
    const quote = await getShippingRates(store.zip_code, zip, items);
    if (!quote.ok) return { error: quote.message, refreshShipping: true };
    cost = quote.rates[0].price;
  }
  if (!Number.isFinite(cost) || cost < 0 || cost !== shipping.price) return changed;

  const { error } = await supabaseAdmin.from("orders").insert({
    id: orderId, user_id: ownerId, status: "aguarde", payment_status: "pending",
    total: Number((cost + lines.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)).toFixed(2)),
    total_weight: lines.reduce((sum, item) => sum + item.item_weight * item.quantity, 0),
    shipping_type: pickup ? "retirada" : localSelected ? "entrega_propria" : "outra_cidade",
    shipping_service_id: shipping.id,
    shipping_company_name: pickup ? "Retirada na Loja" : localSelected ? "Entrega Própria" : "Entrega para Outra Cidade",
    shipping_cost: cost, shipping_name: contact.name.trim(), shipping_phone: contact.phone.trim(),
    shipping_email: contact.email?.trim() || null, shipping_document: contact.document?.trim() || null,
    shipping_address: contact.address.trim(), shipping_number: contact.without_number ? null : contact.number.trim(),
    shipping_without_number: contact.without_number, shipping_complement: contact.complement?.trim() || null,
    shipping_reference: contact.reference?.trim() || null, shipping_neighborhood: contact.neighborhood?.trim() || null,
    shipping_city: contact.city.trim(), shipping_state: contact.state.trim().toUpperCase(), shipping_zip: zip,
  });
  if (error && error.code !== "23505") return { error: "Não foi possível registrar o pedido. Tente novamente." };

  // A request can stop after the order header is committed. The signed order ID
  // binds the exact payload, and each line has a repeatable primary key. Both
  // a retry and a concurrent caller can finish the same order in one batch.
  const { error: itemsError } = await supabaseAdmin.from("order_items")
    .upsert(lines, { onConflict: "id", ignoreDuplicates: true });
  if (itemsError) {
    const completed = await confirmedReceipt(orderId, ownerId);
    if (completed) return completed;
    return { error: "Não foi possível concluir o registro dos itens. Tente novamente para retomar o pedido." };
  }
  if (!ownerId) await setOrderReceipt(orderId);
  return { orderId };
}
