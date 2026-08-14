// use-whatsapp-order.ts
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";

export function useWhatsAppOrder() {
  const { config } = useStore();
  const { profile } = useAuth();

  const sendWhatsAppOrder = (products: any[], orderId: string) => {
    const phone = config?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    const userName = profile?.display_name || "Cliente";
    const productIdShort = orderId.substring(0, 8);

    // Monta a lista formatada de produtos
    const productsListText = products
      .map((item) => {
        const prodName = item.product?.nome || item.product_name || "Produto";
        const variantText = item.name ? ` (Variação: ${item.name})` : "";
        const sizeText = item.tamanho ? ` - Tamanho: ${item.tamanho}` : "";
        const materialText = item.product?.material ? ` - Material: ${item.product.material}` : "";
        return `- ${prodName}${variantText}${sizeText}${materialText} (Qtd: ${item.quantity})`;
      })
      .join("\n");

    const message = `Olá! Realizei o pagamento do pedido #${productIdShort} e preciso finalizar os detalhes personalizados dos seguintes itens:

${productsListText}

*Cliente:* ${userName}

Poderia me ajudar com os detalhes da arte e produção?`;

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return { sendWhatsAppOrder };
}