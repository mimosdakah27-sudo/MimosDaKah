import { supabaseServer } from "@/lib/supabase/server";

export async function getOrderDetails(orderId: string) {
  console.log("Debug - Buscando pedido com ID:", orderId);

  const supabase = await supabaseServer(); 
  
  // 1. Busca os dados do pedido principal
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("Debug - Erro na consulta do pedido:", orderError);
    throw orderError;
  }

  // 2. Busca os itens do pedido
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("Debug - Erro na consulta dos itens do pedido:", itemsError);
    throw itemsError;
  }

  // 3. Para cada item, busca o 'tipo_venda' atual na tabela products
  const itemsWithProductInfo = await Promise.all(
    items.map(async (item) => {
      let tipo_venda = "normal";
      
      if (item.product_id) {
        const { data: prodData } = await supabase
          .from("products")
          .select("tipo_venda")
          .eq("id", item.product_id)
          .single();

        if (prodData) {
          tipo_venda = prodData.tipo_venda;
        }
      }

      return {
        ...item,
        product: {
          id: item.product_id,
          nome: item.product_name,
          imagem_url: item.product_image,
          tipo_venda: tipo_venda,
        }
      };
    })
  );

  const fullOrder = {
    ...order,
    order_items: itemsWithProductInfo
  };
  
  console.log("Debug - Pedido encontrado com sucesso.");
  
  return fullOrder;
}