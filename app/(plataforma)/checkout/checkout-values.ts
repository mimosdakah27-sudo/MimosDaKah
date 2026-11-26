import type { CheckoutAddressDraft, CheckoutCustomerDraft } from "@/lib/checkout-draft";

export function hasCheckoutContact(customer: Pick<CheckoutCustomerDraft, "name" | "phone">) {
  return Boolean(typeof customer?.name === "string" && typeof customer.phone === "string" && customer.name.trim() && /^(55)?\d{10,11}$/.test(customer.phone.replace(/\D/g, "")));
}

export function hasCheckoutAddress(address: CheckoutAddressDraft) {
  return Boolean(
    typeof address?.zip_code === "string" && /^\d{5}-?\d{3}$/.test(address.zip_code.trim()) &&
    typeof address.street === "string" && address.street.trim() &&
    (address.without_number === true || (typeof address.number === "string" && address.number.trim())) &&
    typeof address.city === "string" && address.city.trim() &&
    typeof address.state === "string" && /^[A-Z]{2}$/i.test(address.state.trim())
  );
}

export function getEffectivePrice(product: { preco: number; preco_promocional?: number | null }) {
  const regular = Number(product.preco);
  const promo = Number(product.preco_promocional);
  return promo > 0 && promo < regular ? promo : regular;
}

export function getLocalDeliveryFee(config: {
  fixed_delivery_fee?: number | null;
  local_delivery_fee?: number | null;
  local_delivery_price?: number | null;
}) {
  const configured = config.fixed_delivery_fee ?? config.local_delivery_fee ?? config.local_delivery_price;
  if (configured == null || String(configured).trim() === "") return null;
  const fee = Number(configured);
  return Number.isFinite(fee) && fee >= 0 ? fee : null;
}
