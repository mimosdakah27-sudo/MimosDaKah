import { formatBRL } from "@/lib/utils";

export type ReceiptItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  name: string | null;
  tamanho: string | null;
};

export type ReceiptTotals = { total: number; shipping_cost: number; name: string };

export function getWhatsAppOrderUrl(cleanPhone: string, products: ReceiptItem[], orderId: string, order: ReceiptTotals, origin: string) {
  const userName = order.name || "Cliente";

  const productIdShort = orderId
    .substring(0, 8)
    .toUpperCase();

  const productsListText = products
    .map((item) => {
      const prodName =
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

  const orderLink = origin ? `\n\n*Link do pedido:* ${origin}/admin?search=${productIdShort}#pedidos` : "";

  const message = `Olá! Fiz um pedido pelo site e gostaria de continuar o atendimento pelo WhatsApp.

*Pedido:* #${productIdShort}

*Produtos:*
${productsListText}

*Resumo:*
• Produtos: ${formatBRL(productsSubtotal)}
• Frete: ${shippingCost === 0 ? "Grátis" : formatBRL(shippingCost)}
• *Total:* *${formatBRL(totalOrder)}*

*Cliente:* ${userName}${orderLink}

Gostaria de confirmar os detalhes do pedido, personalização, pagamento e entrega ou retirada.`;

  const destination = cleanPhone.startsWith("55") && cleanPhone.length > 11 ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}
