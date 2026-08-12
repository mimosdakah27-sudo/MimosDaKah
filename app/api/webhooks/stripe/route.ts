import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enviarParaCarrinhoMelhorEnvio } from "@/lib/actions/melhor-envio";
import { revalidateProductFull } from "@/lib/actions/revalidate";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  console.log("[WEBHOOK STRIPE] Iniciando processamento de evento...");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata || {};

    try {
      console.log("[WEBHOOK STRIPE] Sessão concluída. Extraindo metadados para criação do pedido...");

      // 1. Desserializar os dados salvos no metadata
      const userData = JSON.parse(metadata.userData || "{}");
      const shippingData = JSON.parse(metadata.shippingData || "{}");

      let minimalItems: any[] = [];
      const chunksCount = parseInt(metadata.itemsChunksCount || "0", 10);

      if (chunksCount > 0) {
        for (let i = 1; i <= chunksCount; i++) {
          const chunkStr = metadata[`itemsData_${i}`];
          if (chunkStr) {
            minimalItems = minimalItems.concat(JSON.parse(chunkStr));
          }
        }
      } else if (metadata.itemsData) {
        minimalItems = JSON.parse(metadata.itemsData);
      }

      console.log("[WEBHOOK STRIPE] Itens recuperados do metadata:", JSON.stringify(minimalItems, null, 2));

      const isPickup = shippingData.id === "pickup";
      const isLocalDelivery = shippingData.id === "local";
      const isBetterShipping = !isPickup && !isLocalDelivery;

      const evaluatedCompanyName = isBetterShipping
        ? shippingData.company
        : shippingData.name;

      const statusInicial = metadata.status;

      // 2. Inserir o pedido principal no banco de dados
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: metadata.userId,
          total: Number(metadata.total),
          status: statusInicial,
          shipping_type: metadata.shippingType,
          tracking_code:
            isPickup || isLocalDelivery
              ? "Não rastreável"
              : shippingData.tracking_code || null,
          shipping_name: userData.name,
          shipping_address: userData.address,
          shipping_city: userData.city,
          shipping_state: userData.state,
          shipping_zip: userData.zip,
          shipping_phone: userData.phone,
          shipping_email: userData.email,
          shipping_document: userData.document,
          shipping_cost: Number(shippingData.price),
          shipping_service_id: String(shippingData.id),
          shipping_company_name: evaluatedCompanyName,
          total_weight: Number(metadata.calculatedWeight),
          estimated_delivery: metadata.calculatedDeliveryDate,
          payment_status: "Pago",
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("Erro ao salvar pedido no Supabase via Webhook:", orderError);
        throw new Error("Erro ao criar pedido: " + (orderError?.message || "Desconhecido"));
      }

      console.log(`[WEBHOOK STRIPE] Pedido ${order.id} criado com sucesso no banco.`);

      // 3. Montar itens para salvar em order_items resolvendo a imagem e variantes
      const itemsToInsert = [];
      for (const item of minimalItems) {
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("*")
          .eq("id", item.id)
          .single();

        if (product) {
          let variantImage = product.imagem_url;
          let variantName = item.name || null;
          let variantSize = item.tamanho || null;

          const variantId = item.v || item.variant_id || null;

          console.log(`[DEBUG ITEM] Processando produto ID: ${item.id}, variantId detectado: ${variantId}`);

          if (variantId) {
            const { data: variantData, error: varErr } = await supabaseAdmin
              .from("product_variants")
              .select("name, imagens")
              .eq("id", variantId)
              .single();

            if (varErr) {
              console.error(`[DEBUG ITEM] Erro ao buscar variant_id ${variantId}:`, varErr.message);
            }

            if (variantData) {
              if (variantData.name) variantName = variantData.name;
              
              if (variantData.imagens) {
                let parsedImages = variantData.imagens;
                if (typeof parsedImages === "string") {
                  try {
                    parsedImages = JSON.parse(parsedImages);
                  } catch (e) {
                    console.error("[DEBUG ITEM] Erro ao parsear JSON de imagens da variante:", e);
                  }
                }

                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  variantImage = parsedImages[0];
                  console.log(`[DEBUG ITEM] Imagem da variante encontrada com sucesso: ${variantImage}`);
                }
              }
            }
          } else {
            console.log(`[DEBUG ITEM] Produto ${item.id} sem variantId. Usando imagem padrão do produto: ${variantImage}`);
          }

          itemsToInsert.push({
            order_id: order.id,
            product_id: product.id,
            product_name: product.nome,
            product_image: variantImage,
            unit_price: item.p,
            quantity: item.q,
            item_weight: product.weight || 0,
            item_width: product.width || 0,
            item_height: product.height || 0,
            item_length: product.length || 0,
            variant_id: variantId,
            name: variantName,
            tamanho: variantSize,
          });
        }
      }

      const { data: insertedItems, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(itemsToInsert)
        .select("*");

      if (itemsError) {
        console.error("Erro ao salvar itens do pedido:", itemsError);
        throw new Error("Erro ao salvar itens do pedido");
      }

      // Revalidação de produtos alterados
      for (const item of minimalItems) {
        if (item.id) {
          await revalidateProductFull(item.id);
        }
      }

      // 4. INTEGRAÇÃO COM MELHOR ENVIO
      if (metadata.shippingType === 'retirada' || metadata.shippingType === 'entrega_propria') {
        console.log(`[WEBHOOK STRIPE] Pedido ${order.id} local. Nenhuma ação externa necessária.`);
      } else {
        console.log(`[WEBHOOK STRIPE] Enviando pedido ${order.id} para o carrinho do Melhor Envio...`);
        try {
          await enviarParaCarrinhoMelhorEnvio({
            shipping: {
              id: shippingData.id, 
              name: userData.name,
              address: userData.address,
              city: userData.city,
              zip: userData.zip,
              phone: userData.phone,
              email: userData.email,
              document: userData.document
            },
            items: insertedItems,
            orderId: order.id
          });
          
          console.log(`[WEBHOOK STRIPE] Item adicionado ao carrinho do Melhor Envio com sucesso!`);
        } catch (integrationError) {
          console.error("❌ Falha na integração com Melhor Envio:", integrationError);
          await supabaseAdmin
            .from("orders")
            .update({ status: "Erro de Integração" })
            .eq("id", order.id);
        }
      }
      
    } catch (error) {
      console.error("[WEBHOOK STRIPE] Erro interno:", error);
      return new NextResponse("Erro processando pedido", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}