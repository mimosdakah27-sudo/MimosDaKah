import { supabaseBrowser } from "@/lib/supabase/client";
import { parseDigitsToFloat } from "@/lib/utils";
import type { FormDataState, LocalProductImage } from "../types/admin-types";

const supabase = supabaseBrowser() as any;

// === BUSCAS (QUERIES) ===
export async function getAdminDashboardData() {
  const [productsRes, ordersRes] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (ordersRes.error) throw ordersRes.error;

  return { products: productsRes.data ?? [], orders: ordersRes.data ?? [] };
}

export async function fetchExtraImages(productId: string) {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProductVariantsAndGuides(productId: string) {
  const [variantsRes] = await Promise.all([
    supabase
      .from("product_variants")
      .select(`*`)
      .eq("product_id", productId),
  ]);

  if (variantsRes.error) throw variantsRes.error;

  return {
    variants: variantsRes.data ?? [],
    sizeGuide: null,
  };
}

// === UPLOADS & ARQUIVOS ===
export async function uploadStorageFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file);
  if (error) throw error;

  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

// === MUTAÇÕES DE PRODUTO ===
export async function deleteProductService(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteExtraImage(id: string) {
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Função unificada de persistência de produto, imagens e variantes.
 */
export async function saveProductWithGallery({
  form,
  productId,
  localExtraImages,
  imagesToDelete = [],
}: {
  form: FormDataState;
  productId?: string;
  localExtraImages: LocalProductImage[];
  imagesToDelete?: string[];
  sizeGuideData?: any; 
}): Promise<string> {
  let savedProductId = productId;

  const rawVariants = (form.variants as any[]) || [];
  const isSimpleProduct = rawVariants.length === 1 && (!rawVariants[0].name || rawVariants[0].name.trim() === "");

  // 1. Processamento e Upload seguro de TODAS as imagens do array de variantes/simples
  const processedVariants = await Promise.all(
    rawVariants.map(async (variant: any) => {
      const uploadedImageUrls: string[] = [];

      for (const imgItem of variant.imagens) {
        if (typeof imgItem === "object" && imgItem !== null) {
          if (imgItem.file) {
            const publicUrl = await uploadStorageFile(imgItem.file);
            uploadedImageUrls.push(publicUrl);
          } else if (imgItem.url && !imgItem.url.startsWith("blob:")) {
            uploadedImageUrls.push(imgItem.url);
          }
        } else if (typeof imgItem === "string" && !imgItem.startsWith("blob:")) {
          uploadedImageUrls.push(imgItem);
        }
      }

      return {
        ...variant,
        imagens: uploadedImageUrls,
      };
    })
  );

  // 2. Determinar qual é a imagem de capa principal
  const principalVariant = processedVariants.find((v) => v.is_principal) || processedVariants[0];
  
  const finalCapaUrl = 
    principalVariant && principalVariant.imagens.length > 0 
      ? principalVariant.imagens[0] 
      : form.imagem_url || "";

  // No arquivo admin-service.ts, dentro da função saveProductWithGallery:
  const productPayload = {
    nome: form.nome,
    descricao: form.descricao,
    preco: form.tipo_venda === "orcamento" ? 0 : (typeof form.preco === "number" ? form.preco : parseDigitsToFloat(form.preco as any)),
    preco_promocional: form.tipo_venda === "orcamento" ? null : (form.preco_promocional !== null && form.preco_promocional !== undefined
      ? typeof form.preco_promocional === "number"
        ? form.preco_promocional
        : parseDigitsToFloat(String(form.preco_promocional))
      : null),
    tipo_venda: form.tipo_venda ?? "normal", // <-- ADICIONADO AQUI
    destaque: form.destaque ?? false,
    ativo: form.ativo ?? true,
    imagem_url: finalCapaUrl,
    weight: Number(form.weight),
    width: Number(form.width),
    height: Number(form.height),
    length: Number(form.length),
    permite_retirada: form.permite_retirada ?? false,
    garantia_tipo: form.garantia_tipo,
    garantia_dias: form.garantia_dias ? Number(form.garantia_dias) : 0,
  };

  // 3. Salvar ou Atualizar o Produto principal na tabela `products`
  if (savedProductId) {
    const { error: updateErr } = await supabase
      .from("products")
      .update(productPayload)
      .eq("id", savedProductId);
    if (updateErr) throw updateErr;

    if (imagesToDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("product_images")
        .delete()
        .in("id", imagesToDelete);
      if (delErr) throw delErr;
    }
  } else {
    const { data: newProd, error: err } = await supabase
      .from("products")
      .insert(productPayload)
      .select()
      .single();
    if (err) throw err;
    savedProductId = newProd.id;
  }

  if (!savedProductId) throw new Error("ID do produto não retornado.");

  // 4. Limpeza prévia de registros antigos (variantes e imagens) para evitar duplicações
  const { data: oldVariants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", savedProductId);

  if (oldVariants && oldVariants.length > 0) {
    const oldVariantIds = oldVariants.map((v: any) => v.id);
    await supabase.from("product_variants").delete().in("id", oldVariantIds);
  }

  // Limpa as imagens extras anteriores para recriá-las limpas e ordenadas
  await supabase.from("product_images").delete().eq("product_id", savedProductId);

  // 5. Tratamento condicional: Produto Simples x Produto com Variações
  if (isSimpleProduct) {
    const simpleImages = processedVariants[0]?.imagens || [];
    
    // Insere todas as imagens da galeria na tabela `product_images` com posições sequenciais corretas
    if (simpleImages.length > 0) {
      for (let i = 0; i < simpleImages.length; i++) {
        await supabase.from("product_images").insert({
          product_id: savedProductId,
          url: simpleImages[i],
          position: i + 1,
        });
      }
    }
  } else {
    // Se for com variações, insere normalmente na tabela `product_variants`
    if (processedVariants.length > 0) {
      for (const variant of processedVariants) {
        const { error: varErr } = await supabase
          .from("product_variants")
          .insert({
            product_id: savedProductId,
            name: variant.name,
            material: variant.material || null,
            is_principal: variant.is_principal,
            imagens: variant.imagens,
          });

        if (varErr) throw varErr;
      }
    }
  }

  return savedProductId;
}

// === OUTROS SERVIÇOS ===
export async function updateOrderStatusService(id: string, status: string) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateRefundStatusService(id: string, refund_status: string) {
  const { error } = await supabase.from("orders").update({ refund_status }).eq("id", id);
  if (error) throw error;
}

export async function toggleProductActiveService(id: string, currentStatus: boolean) {
  const { error } = await supabase.from("products").update({ ativo: !currentStatus }).eq("id", id);
  if (error) throw new Error(error.message);
}