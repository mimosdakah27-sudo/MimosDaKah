"use client";

import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { formatBRL } from "@/lib/utils";

export function useWhatsAppOrder() {
  const { config } = useStore();
  const { profile } = useAuth();

  const sendWhatsAppOrder = (
    products: any[],
    orderId: string,
    order: { total: number; shipping_cost: number }, // Recebe o objeto do pedido com os campos exatos do banco
  ) => {
    const phone = config?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone) {
      return {
        success: false,
        error: "O WhatsApp da loja não está configurado.",
      };
    }

    const userName =
      profile?.display_name ||
      "Cliente";

    const productIdShort = orderId
      .substring(0, 8)
      .toUpperCase();

    const productsListText = products
      .map((item) => {
        const prodName =
          item.product?.nome ||
          item.product_name ||
          "Produto";

        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unit_price) || 0;
        const totalPriceItem = unitPrice * quantity;

        const variantText = item.name
          ? `\n  • Variação: ${item.name}`
          : "";

        const sizeText = item.tamanho
          ? `\n  • Tamanho: ${item.tamanho}`
          : "";

        const priceText =
          unitPrice > 0
            ? `\n  • Subtotal: ${formatBRL(totalPriceItem)} (${quantity}x ${formatBRL(unitPrice)})`
            : "";

        return `• *${prodName}*
  • Quantidade: ${quantity}${variantText}${sizeText}${priceText}`;
      })
      .join("\n\n");

    const shippingCost = Number(order?.shipping_cost) || 0;
    const totalOrder = Number(order?.total) || 0;
    const productsSubtotal = totalOrder - shippingCost;

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "";

    const orderLink =
      `${origin}/admin?search=${productIdShort}#pedidos`;

    const message = `Olá! Fiz um pedido pelo site e gostaria de continuar o atendimento pelo WhatsApp.

*Pedido:* #${productIdShort}

*Produtos:*
${productsListText}

*Resumo:*
• Produtos: ${formatBRL(productsSubtotal)}
• Frete: ${shippingCost === 0 ? "Grátis" : formatBRL(shippingCost)}
• *Total:* *${formatBRL(totalOrder)}*

*Cliente:* ${userName}

*Link do pedido:* ${orderLink}

Gostaria de confirmar os detalhes do pedido, personalização, pagamento e entrega ou retirada.`;

    const url =
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

    return {
      success: true,
    };
  };

  return {
    sendWhatsAppOrder,
  };
}