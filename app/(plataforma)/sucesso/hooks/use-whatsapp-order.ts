import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";

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
        const materialText = item.product?.material
          ? ` - Material: ${item.product.material}`
          : "";
        return `- ${prodName}${variantText}${sizeText}${materialText} (Qtd: ${item.quantity})`;
      })
      .join("\n");

    // Constrói o link direto do pedido filtrado na tela de perfil do cliente
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const orderLink = `${origin}/perfil?order=${productIdShort}`;

    const message = `Olá! Realizei o pagamento do pedido #${productIdShort} e preciso finalizar os detalhes personalizados dos seguintes itens:

${productsListText}

*Cliente:* ${userName}
*Link do pedido:* ${orderLink}

Poderia me ajudar com os detalhes da arte e produção?`;

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return { sendWhatsAppOrder };
}
