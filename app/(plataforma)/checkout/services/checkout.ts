"use server";

import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase/admin";

type CheckoutItem = {
  product: {
    id: string;
    nome: string;
    imagem_url?: string | null;
    preco: number;
    preco_promocional?: number | null;
    weight?: number | null;
    width?: number | null;
    height?: number | null;
    length?: number | null;
    variant_id?: string | null;
    name?: string | null;
    tamanho?: string | null;
  };
  quantity: number;
};

type CheckoutShipping = {
  id: string;
  price: number;
};

type CheckoutUser = {
  id?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  document?: string | null;

  address: string;
  number?: string | null;
  without_number?: boolean;
  complement?: string | null;
  reference?: string | null;
  neighborhood?: string | null;
  city: string;
  state: string;
  zip: string;
};

type CreateCheckoutPayload = {
  items: CheckoutItem[];
  shipping: CheckoutShipping;
  user: CheckoutUser;
};

type SavedAddress = {
  id: string;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  without_number: boolean | null;
  complement: string | null;
  reference: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  active: boolean | null;
};

function normalizeZip(zip?: string | null) {
  return String(zip ?? "").replace(/\D/g, "");
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getEffectivePrice(product: {
  preco: number;
  preco_promocional?: number | null;
}) {
  const regularPrice = Number(product.preco) || 0;
  const promotionalPrice = Number(product.preco_promocional) || 0;

  if (promotionalPrice > 0 && promotionalPrice < regularPrice) {
    return promotionalPrice;
  }

  return regularPrice;
}

export async function saveUserAddress(
  userId: string,
  addressData: {
    zip_code: string;
    street: string;
    number: string;
    without_number: boolean;
    complement: string;
    reference: string;
    neighborhood: string;
    city: string;
    state: string;
  }
) {
  if (!userId || !addressData.zip_code || !addressData.street) {
    return { success: false, error: "Dados incompletos." };
  }

  try {
    const { data: existingData } = await supabaseAdmin
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId);

    const existingAddresses = (existingData || []) as SavedAddress[];
    const cleanZip = normalizeZip(addressData.zip_code);
    const cleanStreet = normalizeText(addressData.street);

    const alreadyExists = existingAddresses.some(
      (ex) =>
        normalizeZip(ex.zip_code) === cleanZip &&
        normalizeText(ex.street) === cleanStreet
    );

    if (alreadyExists) {
      return { success: true };
    }

    const payload = {
      user_id: userId,
      zip_code: cleanZip,
      street: addressData.street.trim(),
      number: addressData.without_number ? null : addressData.number?.trim() || null,
      without_number: Boolean(addressData.without_number),
      complement: addressData.complement?.trim() || null,
      reference: addressData.reference?.trim() || null,
      neighborhood: addressData.neighborhood?.trim() || null,
      city: addressData.city.trim(),
      state: addressData.state.trim().toUpperCase(),
      role: "customer",
      active: existingAddresses.length === 0,
    };

    const { error } = await supabaseAdmin.from("user_addresses").insert(payload);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("[CHECKOUT_SERVER] Erro ao salvar endereço:", error);
    return { success: false, error };
  }
}

export async function createCheckoutSession(payload: CreateCheckoutPayload) {
  if (!payload.items?.length) {
    throw new Error("O pedido não possui itens.");
  }

  if (!payload.user?.name?.trim()) {
    throw new Error("Nome do cliente não informado.");
  }

  if (!payload.user?.phone?.trim()) {
    throw new Error("Telefone do cliente não informado.");
  }

  if (!payload.user?.address?.trim()) {
    throw new Error("Endereço não informado.");
  }

  if (!payload.user?.city?.trim() || !payload.user?.state?.trim()) {
    throw new Error("Cidade ou estado não informado.");
  }

  const customerZip = normalizeZip(payload.user.zip);

  if (customerZip.length !== 8) {
    throw new Error("CEP inválido.");
  }

  if (!payload.shipping?.id) {
    throw new Error("Tipo de entrega não informado.");
  }

  const isPickup = payload.shipping.id === "pickup";
  const isLocalDelivery = payload.shipping.id === "local";
  const isOtherCityDelivery = payload.shipping.id === "other_city";

  if (!isPickup && !isLocalDelivery && !isOtherCityDelivery) {
    throw new Error("Tipo de entrega inválido.");
  }

  const shippingType = isPickup
    ? "retirada"
    : isLocalDelivery
      ? "entrega_propria"
      : "outra_cidade";

  const shippingLabel = isPickup
    ? "Retirada na Loja"
    : isLocalDelivery
      ? "Entrega Própria"
      : "Entrega para Outra Cidade";

  const shippingCost = isPickup ? 0 : Math.max(0, Number(payload.shipping.price) || 0);

  const productIds = [...new Set(payload.items.map((item) => item.product.id))];

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select(
      `
          id,
          nome,
          imagem_url,
          preco,
          preco_promocional,
          weight,
          width,
          height,
          length,
          ativo
        `
    )
    .in("id", productIds)
    .eq("ativo", true);

  if (productsError) {
    console.error("[CHECKOUT] Erro ao buscar produtos:", productsError);
    throw new Error("Não foi possível validar os produtos.");
  }

  if (!products || products.length !== productIds.length) {
    throw new Error("Um ou mais produtos não estão disponíveis.");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const consolidatedItems = new Map<string, CheckoutItem>();

  for (const item of payload.items) {
    const productId = item.product.id;
    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Quantidade de produto inválida.");
    }

    const existing = consolidatedItems.get(productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      consolidatedItems.set(productId, { ...item, quantity });
    }
  }

  const validatedItems = Array.from(consolidatedItems.values()).map((item) => {
    const product = productMap.get(item.product.id);

    if (!product) {
      throw new Error(`Produto ${item.product.id} não encontrado.`);
    }

    const unitPrice = getEffectivePrice(product);

    if (unitPrice <= 0) {
      throw new Error(`O produto "${product.nome}" possui preço inválido.`);
    }

    return {
      product,
      quantity: item.quantity,
      unitPrice,
      originalItem: item,
    };
  });

  const subtotal = validatedItems.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );

  const total = subtotal + shippingCost;

  const totalWeight = validatedItems.reduce(
    (total, item) => total + (Number(item.product.weight) || 0) * item.quantity,
    0
  );

  const orderPayload = {
    user_id: payload.user?.id || null,
    total,
    status: "aguarde",
    shipping_type: shippingType,
    shipping_name: payload.user.name.trim(),
    shipping_address: payload.user.address.trim(),
    shipping_number: payload.user.number?.trim() || null,
    shipping_without_number: Boolean(payload.user.without_number),
    shipping_complement: payload.user.complement?.trim() || null,
    shipping_reference: payload.user.reference?.trim() || null,
    shipping_neighborhood: payload.user.neighborhood?.trim() || null,
    shipping_city: payload.user.city.trim(),
    shipping_state: payload.user.state.trim().toUpperCase(),
    shipping_zip: customerZip,
    shipping_phone: payload.user.phone?.trim() || null,
    shipping_email: payload.user.email?.trim() || null,
    shipping_document: payload.user.document?.trim() || null,
    shipping_cost: shippingCost,
    shipping_service_id: payload.shipping.id,
    shipping_company_name: shippingLabel,
    total_weight: totalWeight,
    tracking_code: null,
    estimated_delivery: null,
    payment_status: "pending",
  };

  const { data: newOrder, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(orderPayload)
    .select("id")
    .single();

  if (orderError || !newOrder) {
    console.error("[CHECKOUT] Erro ao criar pedido:", orderError);
    throw new Error("Não foi possível criar o pedido.");
  }

  const orderId = newOrder.id;

  const itemsToInsert = validatedItems.map((item) => {
    const originalProduct = item.originalItem.product;
    const rawVariantId = originalProduct.variant_id || null;
    const cleanVariantId = rawVariantId && rawVariantId !== "default" ? rawVariantId : null;

    return {
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.nome,
      product_image: item.product.imagem_url || "",
      unit_price: item.unitPrice,
      quantity: item.quantity,
      item_weight: Number(item.product.weight) || 0,
      item_width: Number(item.product.width) || 0,
      item_height: Number(item.product.height) || 0,
      item_length: Number(item.product.length) || 0,
      variant_id: cleanVariantId,
      name: originalProduct.name || null,
      tamanho: originalProduct.tamanho || null,
    };
  });

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(itemsToInsert);

  if (itemsError) {
    console.error("[CHECKOUT] Erro ao salvar itens:", itemsError);
    await supabaseAdmin.from("orders").delete().eq("id", orderId);
    throw new Error("Não foi possível salvar os itens do pedido.");
  }

  redirect(`/sucesso?order_id=${orderId}`);
}