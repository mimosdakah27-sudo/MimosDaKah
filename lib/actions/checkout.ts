"use server";

import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function createCheckoutSession(payload: any) {
  console.log("Dados recebidos no Checkout:", JSON.stringify(payload, null, 2));

  const isQuote = Boolean(payload.isQuote);

  // Identificação do tipo de entrega
  const isPickup = payload.shipping.id === "pickup";
  const isLocalDelivery = payload.shipping.id === "local";
  const isBetterShipping = !isPickup && !isLocalDelivery;

  let shippingType = isQuote ? "orcamento" : "melhor_envio";
  if (!isQuote) {
    if (isPickup) {
      shippingType = "retirada";
    } else if (isLocalDelivery) {
      shippingType = "entrega_propria";
    }
  }

  const getEffectivePrice = (product: any) => {
    const regularPrice = Number(product.preco) || 0;
    const promoPrice = product.preco_promocional ? Number(product.preco_promocional) : 0;
    return promoPrice > 0 && promoPrice < regularPrice ? promoPrice : regularPrice;
  };

  const totalItens = payload.items.reduce((acc: number, i: any) => {
    const price = getEffectivePrice(i.product);
    return acc + price * i.quantity;
  }, 0);
  
  const total = totalItens + Number(payload.shipping.price);

  const calculatedWeight =
    isPickup || isLocalDelivery
      ? payload.items.reduce(
          (acc: number, i: any) => acc + Number(i.product.weight || 0),
          0
        )
      : payload.shipping.packages?.reduce(
          (acc: number, p: any) => acc + Number(p.weight || 0),
          0
        ) || 0;

  const days =
    isPickup || isLocalDelivery
      ? 1
      : Number(payload.shipping.delivery_time) || 0;
  const calculatedDeliveryDate = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  );

  const shippingName = isBetterShipping
    ? payload.shipping.company?.name || payload.shipping.name
    : payload.shipping.name;

  const evaluatedCompanyName = isBetterShipping
    ? payload.shipping.company?.name || ""
    : payload.shipping.name;

  let orderId = payload.orderId;

  const orderPayload = {
    user_id: payload.user.id || null,
    total: Number(total),
    // Se for orçamento, mantém "Aguardando Pagamento" para não disparar a trigger do Supabase
    status: isQuote ? "Aguardando Pagamento" : "aguarde",
    shipping_type: shippingType,
    tracking_code:
      isPickup || isLocalDelivery
        ? "Não rastreável"
        : payload.shipping.tracking_code || null,
    shipping_name: payload.user.name,
    shipping_address: payload.user.address,
    shipping_city: payload.user.city,
    shipping_state: payload.user.state,
    shipping_zip: payload.user.zip,
    shipping_phone: payload.user.phone,
    shipping_email: payload.user.email,
    shipping_document: payload.user.document,
    shipping_cost: Number(payload.shipping.price),
    shipping_service_id: String(payload.shipping.id),
    shipping_company_name: evaluatedCompanyName,
    total_weight: Number(calculatedWeight),
    estimated_delivery: calculatedDeliveryDate.toISOString(),
    payment_status: "pending",
  };

  if (orderId) {
    // Atualização do orçamento com frete e dados do cliente
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update(orderPayload)
      .eq("id", orderId);

    if (updateError) {
      console.error("Erro ao atualizar pedido existente no Supabase:", updateError);
      throw new Error("Erro ao atualizar pedido para checkout.");
    }

    await supabaseAdmin.from("order_items").delete().eq("order_id", orderId);
    console.log(`[CHECKOUT] Pedido de orçamento ${orderId} atualizado sem alterar status.`);
  } else {
    // Criação de pedido do zero
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderError || !newOrder) {
      console.error("Erro ao criar pedido prévio no Supabase:", orderError);
      throw new Error("Erro ao iniciar processo de pedido.");
    }

    orderId = newOrder.id;
    console.log(`[CHECKOUT] Pedido novo criado com ID: ${orderId}`);
  }

  // Inserção dos itens
  const itemsToInsert = payload.items.map((i: any) => {
    const rawVariantId = i.product.variant_id || i.product.v || null;
    const cleanVariantId = (rawVariantId && rawVariantId !== "default") ? rawVariantId : null;

    return {
      order_id: orderId,
      product_id: i.product.id,
      product_name: i.product.nome,
      product_image: i.product.imagem_url || "",
      unit_price: getEffectivePrice(i.product),
      quantity: i.quantity,
      item_weight: Number(i.product.weight) || 0,
      item_width: Number(i.product.width) || 0,
      item_height: Number(i.product.height) || 0,
      item_length: Number(i.product.length) || 0,
      variant_id: cleanVariantId,
      name: i.product.name || null,
      tamanho: i.product.tamanho || null,
    };
  });

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(itemsToInsert);

  if (itemsError) {
    console.error("Erro ao salvar itens do pedido:", itemsError);
    throw new Error("Erro ao salvar itens do pedido.");
  }

  // Metadados do Stripe
  const minimalItemsData = payload.items.map((i: any) => {
    const rawVariantId = i.product.variant_id || i.product.v || null;
    const cleanVariantId = (rawVariantId && rawVariantId !== "default") ? rawVariantId : null;

    return {
      id: i.product.id,
      q: i.quantity,
      p: getEffectivePrice(i.product),
      v: cleanVariantId,
      name: i.product.name || null,
      tamanho: i.product.tamanho || null,
      tipo_venda: i.product.tipo_venda || "normal",
    };
  });

  const metadata: Record<string, string> = {
    orderId: orderId,
    userId: payload.user.id || "",
    total: total.toString(),
    status: isQuote ? "Aguardando Pagamento" : "aguarde",
    shippingType: shippingType,
    calculatedWeight: calculatedWeight.toString(),
    calculatedDeliveryDate: calculatedDeliveryDate.toISOString(),
    userData: JSON.stringify(payload.user),
    shippingData: JSON.stringify({
      id: payload.shipping.id,
      name: payload.shipping.name,
      price: payload.shipping.price,
      company: evaluatedCompanyName,
      delivery_time: payload.shipping.delivery_time,
    }),
  };

  const chunkSize = 3;
  let chunkCount = 0;
  for (let i = 0; i < minimalItemsData.length; i += chunkSize) {
    chunkCount++;
    const chunk = minimalItemsData.slice(i, i + chunkSize);
    metadata[`itemsData_${chunkCount}`] = JSON.stringify(chunk);
  }
  metadata.itemsChunksCount = chunkCount.toString();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      ...payload.items.map((item: any) => {
        const effectivePrice = getEffectivePrice(item.product);
        return {
          price_data: {
            currency: "brl",
            product_data: {
              name: item.product.nome,
              images: item.product.imagem_url ? [item.product.imagem_url] : [],
            },
            unit_amount: Math.round(effectivePrice * 100),
          },
          quantity: item.quantity,
        };
      }),
      {
        price_data: {
          currency: "brl",
          product_data: { name: `Frete: ${shippingName}` },
          unit_amount: Math.round(payload.shipping.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sucesso?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?order_id=${orderId}`,
  });

  console.log("Sessão Stripe criada com sucesso. ID:", session.id, "Pedido:", orderId);

  return { url: session.url };
}