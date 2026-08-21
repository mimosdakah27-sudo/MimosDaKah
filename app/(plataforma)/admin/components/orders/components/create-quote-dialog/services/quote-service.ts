import { supabaseBrowser } from "@/lib/supabase/client";
import type { CustomerOption, ProductOption, CreateQuotePayload } from "../types";

const supabase = supabaseBrowser() as any;

/**
 * Busca a lista de clientes (profiles) e apenas os produtos ativos com tipo_venda = 'orcamento'
 */
export async function fetchQuoteOptions(): Promise<{
  customers: CustomerOption[];
  products: ProductOption[];
}> {
  const [profilesRes, productsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, email, phone")
      .order("display_name", { ascending: true }),
    supabase
      .from("products")
      .select("id, nome, preco, imagem_url, weight, width, height, length")
      .eq("ativo", true)
      .eq("tipo_venda", "orcamento")
      .order("nome", { ascending: true }),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (productsRes.error) throw productsRes.error;

  return {
    customers: profilesRes.data ?? [],
    products: productsRes.data ?? [],
  };
}

/**
 * Cria o Pedido de Orçamento, o Item relacionado e gera a Notificação para o cliente.
 */
export async function createQuoteOrderService(payload: CreateQuotePayload): Promise<string> {
  const {
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    productId,
    productName,
    productImage,
    weight,
    width,
    height,
    length,
    price,
    quantity,
    observation,
  } = payload;

  const totalOrder = price * (quantity || 1);

  // 1. Inserir a Ordem com identificador de tipo 'orcamento'
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: customerId,
      total: totalOrder,
      status: "Aguardando Pagamento",
      payment_status: "pending",
      order_type: "orcamento", // <--- IDENTIFICADOR DE TIPO DO PEDIDO
      shipping_name: customerName || "Cliente",
      shipping_address: observation ? `Observação: ${observation}` : "A definir no checkout",
      shipping_city: "A definir",
      shipping_zip: "00000000",
      shipping_email: customerEmail,
      shipping_phone: customerPhone || null,
    })
    .select("id")
    .single();

  if (orderErr) throw orderErr;

  // 2. Inserir o item do pedido com a quantidade informada
  const { error: itemErr } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: productId,
    product_name: productName,
    product_image: productImage || null,
    unit_price: price,
    quantity: quantity || 1, // <--- QUANTIDADE PERSONALIZADA
    item_weight: weight || 0,
    item_width: width || 0,
    item_height: height || 0,
    item_length: length || 0,
  });

  if (itemErr) throw itemErr;

  // 3. Gerar a notificação para o usuário
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalOrder);

  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: customerId,
    title: "Novo Orçamento Disponível! 🏷️",
    message: `Seu orçamento para "${productName}" (${quantity}x) no valor de ${formattedTotal} está pronto. Clique para finalizar!`,
    link: `/perfil?order=${order.id.slice(0, 8)}`,
  });

  if (notifErr) throw notifErr;

  return order.id;
}