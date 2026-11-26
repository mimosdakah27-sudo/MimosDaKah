"use server";

import { calculateMelhorEnvioShipment } from "@/lib/melhor-envio-oauth";
import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

type ShippingItem = { product: { id: string }; quantity: number };
type Product = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "preco" | "weight" | "width" | "height" | "length"
>;
type PackageProduct = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};
type Quote = { price: number; deliveryTime: number | null; label: string };
type ProductQuote = ({ ok: true } & Quote) | { ok: false; message: string };

const unavailable = "Não foi possível consultar o frete agora. Tente novamente.";
const productIdPattern = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
class ShippingError extends Error {}

function quoteFailure(error: unknown) {
  return { ok: false as const, message: error instanceof ShippingError ? error.message : unavailable };
}

function noRateMessage(rejections: string[]) {
  if (rejections.some(reason => /dimens[ãõ]|peso|medidas/i.test(reason))) {
    return "Sem cotação para este pedido. As transportadoras indicaram uma restrição de peso ou dimensões da embalagem. Consulte a loja.";
  }
  if (rejections.length && rejections.every(reason => /indisponível|temporariamente/i.test(reason))) {
    return unavailable;
  }
  return "Nenhuma opção de entrega disponível para este pedido e CEP.";
}

function normalizeZip(value: unknown) {
  if (typeof value !== "string" || !/^\d{5}-?\d{3}$/.test(value.trim())) return "";
  return value.trim().replace("-", "");
}

function nonnegativeNumber(value: unknown) {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

const getStore = unstable_cache(async () => {
  // A taxa local tem nomes diferentes nas versões do cadastro da loja.
  const { data, error } = await supabasePublic
    .from("store_config")
    .select("*")
    .eq("id", true)
    .abortSignal(AbortSignal.timeout(8_000))
    .maybeSingle();
  if (error || !data) throw new ShippingError(unavailable);
  const store: typeof data & { fixed_delivery_fee?: number; local_delivery_price?: number } = data;
  const originZip = normalizeZip(store.zip_code);
  if (!originZip) throw new ShippingError(unavailable);
  return {
    originZip,
    email: store.email,
    localDelivery: store.allow_local_delivery,
    localPrice: nonnegativeNumber(
      store.fixed_delivery_fee ?? store.local_delivery_fee ?? store.local_delivery_price,
    ),
  };
}, ["shipping-store"], { revalidate: 60 });

async function getProducts(ids: string[]) {
  const { data, error } = await supabasePublic
    .from("products")
    .select("id,preco,weight,width,height,length")
    .in("id", ids)
    .eq("ativo", true)
    .order("id")
    .abortSignal(AbortSignal.timeout(8_000));
  if (error) throw new ShippingError(unavailable);
  if (data.length !== ids.length) throw new ShippingError("Produto indisponível para cotação.");
  return data;
}

function packageProduct(product: Product, quantity: number, checkout: boolean): PackageProduct {
  // O checkout legado usava estes padrões para itens cadastrados sem medidas.
  function measure(value: number | null, legacyDefault: number) {
    if (value !== null && Number.isFinite(value) && value > 0) return value;
    if (checkout) return legacyDefault;
    throw new ShippingError("As medidas de envio deste produto ainda não estão disponíveis.");
  }
  const price = nonnegativeNumber(product.preco);
  if (price === null) throw new ShippingError(unavailable);
  return {
    id: product.id,
    width: measure(product.width, 10),
    height: measure(product.height, 10),
    length: measure(product.length, 10),
    weight: measure(product.weight, 0.3),
    insurance_value: price,
    quantity,
  };
}

const getCarrierQuote = unstable_cache(async (
  originZip: string,
  destinationZip: string,
  email: string,
  products: PackageProduct[],
): Promise<Quote> => {
  if (!email) throw new ShippingError(unavailable);
  const response = await calculateMelhorEnvioShipment(email, {
    from: { postal_code: originZip },
    to: { postal_code: destinationZip },
    products,
    options: { receipt: false, own_hand: false },
  });
  if (!response.ok) throw new ShippingError(unavailable);
  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new ShippingError(unavailable);

  const rates: Quote[] = [];
  const rejections: string[] = [];
  for (const rate of result) {
    if (!rate || typeof rate !== "object") continue;
    if (rate.error) {
      if (typeof rate.error === "string") rejections.push(rate.error);
      continue;
    }
    const price = nonnegativeNumber(rate.custom_price ?? rate.price);
    if (price === null) continue;
    rates.push({
      price: Number(price.toFixed(2)),
      deliveryTime: nonnegativeNumber(rate.custom_delivery_time ?? rate.delivery_time),
      label: "Entrega por transportadora",
    });
  }
  // Prioriza o menor prazo conhecido. Para o mesmo prazo, oferece a menor tarifa.
  rates.sort((a, b) => {
    if (a.deliveryTime === b.deliveryTime) return a.price - b.price;
    return (a.deliveryTime ?? Infinity) - (b.deliveryTime ?? Infinity);
  });
  if (!rates.length) throw new ShippingError(noRateMessage(rejections));
  return rates[0];
}, ["melhor-envio-quote-v3"], { revalidate: 300 });

export async function getProductShippingQuote(productId: string, destinationZip: string): Promise<ProductQuote> {
  const zip = normalizeZip(destinationZip);
  if (!zip) return { ok: false, message: "Informe um CEP válido com 8 dígitos." };
  if (typeof productId !== "string" || !productIdPattern.test(productId)) {
    return { ok: false, message: "Produto indisponível para cotação." };
  }
  try {
    const [store, [product]] = await Promise.all([getStore(), getProducts([productId])]);
    if (zip === store.originZip && store.localDelivery) {
      if (store.localPrice === null) throw new ShippingError(unavailable);
      return { ok: true, price: store.localPrice, deliveryTime: null, label: "Entrega local" };
    }
    const quote = await getCarrierQuote(store.originZip, zip, store.email, [
      packageProduct(product, 1, false),
    ]);
    return { ok: true, ...quote };
  } catch (error) {
    return quoteFailure(error);
  }
}

function getQuantities(items: ShippingItem[]) {
  if (!Array.isArray(items) || !items.length) {
    throw new ShippingError("Não há produtos para calcular o frete.");
  }

  // Variações do mesmo produto compartilham as medidas de envio.
  const quantities = new Map<string, number>();
  for (const item of items) {
    const id = item?.product?.id;
    if (typeof id !== "string" || !productIdPattern.test(id) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new ShippingError("Item inválido para cotação.");
    }
    const key = id.toLowerCase();
    const quantity = (quantities.get(key) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) throw new ShippingError("Quantidade inválida para cotação.");
    quantities.set(key, quantity);
  }
  return quantities;
}

export async function getShippingRates(originZip: string, destinationZip: string, items: ShippingItem[]) {
  try {
    const zip = normalizeZip(destinationZip);
    if (!normalizeZip(originZip) || !zip) throw new ShippingError("Informe um CEP válido com 8 dígitos.");
    const quantities = getQuantities(items);
    const [store, products] = await Promise.all([getStore(), getProducts([...quantities.keys()])]);
    const packages = products.map((product) => packageProduct(product, quantities.get(product.id)!, true));
    const quote = await getCarrierQuote(store.originZip, zip, store.email, packages);
    const rates = [{ id: "Entrega em outra cidade", price: quote.price, delivery_time: quote.deliveryTime ?? undefined }];
    return { ok: true as const, rates };
  } catch (error) {
    return quoteFailure(error);
  }
}
