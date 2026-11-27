import { supabaseBrowser } from "@/lib/supabase/client";
import { parseDigitsToFloat } from "@/lib/utils";
import type {
  FormDataState,
  LocalProductImage,
} from "../types/admin-types";

const supabase = supabaseBrowser() as any;

// ============================================================
// BUSCAS
// ============================================================

export async function getAdminDashboardData(tab: "produtos" | "pedidos") {
  if (tab === "produtos") {
    const { data, error } = await supabase.from("products").select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { products: data, orders: [] };
  }
  // O checkout pode estar retomando uma gravação interrompida antes de salvar os itens.
  const { data, error } = await supabase.from("orders").select("*, order_items!inner(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { products: [], orders: data };
}

// ============================================================
// IMAGENS
// ============================================================

export async function fetchExtraImages(
  productId: string,
) {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position");

  if (error) {
    throw error;
  }

  return data ?? [];
}

// ============================================================
// VARIAÇÕES
// ============================================================

export async function fetchProductVariantsAndGuides(
  productId: string,
) {
  const [variantsRes] =
    await Promise.all([
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId),
    ]);

  if (variantsRes.error) {
    throw variantsRes.error;
  }

  return {
    variants: variantsRes.data ?? [],
    sizeGuide: null,
  };
}

// ============================================================
// UPLOADS
// ============================================================

export async function uploadStorageFile(
  file: File,
): Promise<string> {
  const ext =
    file.name.split(".").pop();

  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } =
    await supabase.storage
      .from("product-images")
      .upload(path, file);

  if (error) {
    throw error;
  }

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path)
    .data.publicUrl;
}

// ============================================================
// PRODUTOS
// ============================================================

// Uma nova tentativa com o mesmo arquivo reutiliza o upload concluído.
const uploadedVideos = new WeakMap<File, string>();

async function saveVideo(source: File | string) {
  if (typeof source === "string") return source;
  const previous = uploadedVideos.get(source);
  if (previous) return previous;
  const bucket = supabase.storage.from("product-videos");
  const extension = source.type === "video/webm" ? "webm" : "mp4";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await bucket.upload(path, source, { contentType: source.type });
  if (error) throw new Error(`Falha ao enviar o vídeo ${source.name}. Tente novamente.`);
  const url: string = bucket.getPublicUrl(path).data.publicUrl;
  uploadedVideos.set(source, url);
  return url;
}

export async function deleteProductService(
  id: string,
) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteExtraImage(
  id: string,
) {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Persistência do produto,
 * imagens e variações.
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

  const rawVariants =
    (form.variants as any[]) || [];

  const isSimpleProduct =
    rawVariants.length === 1 &&
    (!rawVariants[0].name ||
      rawVariants[0].name.trim() === "");

  // ==========================================================
  // PROCESSAR IMAGENS
  // ==========================================================

  const processedVariants =
    await Promise.all(
      rawVariants.map(
        async (variant: any) => {
          const uploadedImageUrls: string[] =
            [];

          for (const imgItem of variant.imagens) {
            if (
              typeof imgItem === "object" &&
              imgItem !== null
            ) {
              if (imgItem.file) {
                const publicUrl =
                  await uploadStorageFile(
                    imgItem.file,
                  );

                uploadedImageUrls.push(
                  publicUrl,
                );
              } else if (
                imgItem.url &&
                !imgItem.url.startsWith(
                  "blob:",
                )
              ) {
                uploadedImageUrls.push(
                  imgItem.url,
                );
              }
            } else if (
              typeof imgItem === "string" &&
              !imgItem.startsWith("blob:")
            ) {
              uploadedImageUrls.push(
                imgItem,
              );
            }
          }

          return {
            ...variant,
            imagens:
              uploadedImageUrls,
          };
        },
      ),
    );

  // ==========================================================
  // CAPA PRINCIPAL
  // ==========================================================

  const principalVariant =
    processedVariants.find(
      (variant) =>
        variant.is_principal,
    ) ||
    processedVariants[0];

  const finalCapaUrl =
    principalVariant &&
    principalVariant.imagens.length > 0
      ? principalVariant.imagens[0]
      : form.imagem_url || "";

  // ==========================================================
  // PRODUTO
  // ==========================================================

  const videoUrls = [];
  for (const video of form.videos ?? []) videoUrls.push(await saveVideo(video));

  const productPayload = {
    video_urls: videoUrls,
    nome: form.nome,

    descricao: form.descricao,

    preco:
      form.tipo_venda === "orcamento"
        ? 0
        : typeof form.preco === "number"
          ? form.preco
          : parseDigitsToFloat(
              form.preco as any,
            ),

    preco_promocional:
      form.tipo_venda === "orcamento"
        ? null
        : form.preco_promocional !==
              null &&
            form.preco_promocional !==
              undefined
          ? typeof form.preco_promocional ===
            "number"
            ? form.preco_promocional
            : parseDigitsToFloat(
                String(
                  form.preco_promocional,
                ),
              )
          : null,

    tipo_venda:
      form.tipo_venda ?? "normal",

    destaque:
      form.destaque ?? false,

    ativo:
      form.ativo ?? true,

    imagem_url:
      finalCapaUrl,

    weight:
      Number(form.weight),

    width:
      Number(form.width),

    height:
      Number(form.height),

    length:
      Number(form.length),

    permite_retirada:
      form.permite_retirada ?? false,

    garantia_tipo:
      form.garantia_tipo,

    garantia_dias:
      form.garantia_dias
        ? Number(form.garantia_dias)
        : 0,
  };

  // ==========================================================
  // SALVAR / ATUALIZAR PRODUTO
  // ==========================================================

  if (savedProductId) {
    const { error: updateErr } =
      await supabase
        .from("products")
        .update(productPayload)
        .eq("id", savedProductId);

    if (updateErr) {
      throw updateErr;
    }

    if (imagesToDelete.length > 0) {
      const { error: delErr } =
        await supabase
          .from("product_images")
          .delete()
          .in(
            "id",
            imagesToDelete,
          );

      if (delErr) {
        throw delErr;
      }
    }
  } else {
    const {
      data: newProd,
      error: err,
    } = await supabase
      .from("products")
      .insert(productPayload)
      .select()
      .single();

    if (err) {
      throw err;
    }

    savedProductId =
      newProd.id;
  }

  if (!savedProductId) {
    throw new Error(
      "ID do produto não retornado.",
    );
  }

  // ==========================================================
  // LIMPAR VARIAÇÕES ANTIGAS
  // ==========================================================

  const { data: oldVariants } =
    await supabase
      .from("product_variants")
      .select("id")
      .eq(
        "product_id",
        savedProductId,
      );

  if (
    oldVariants &&
    oldVariants.length > 0
  ) {
    const oldVariantIds =
      oldVariants.map(
        (variant: any) =>
          variant.id,
      );

    await supabase
      .from("product_variants")
      .delete()
      .in(
        "id",
        oldVariantIds,
      );
  }

  // ==========================================================
  // LIMPAR IMAGENS EXTRAS
  // ==========================================================

  await supabase
    .from("product_images")
    .delete()
    .eq(
      "product_id",
      savedProductId,
    );

  // ==========================================================
  // PRODUTO SIMPLES
  // ==========================================================

  if (isSimpleProduct) {
    const simpleImages =
      processedVariants[0]
        ?.imagens || [];

    if (
      simpleImages.length > 0
    ) {
      for (
        let i = 0;
        i < simpleImages.length;
        i++
      ) {
        const {
          error,
        } = await supabase
          .from("product_images")
          .insert({
            product_id:
              savedProductId,

            url:
              simpleImages[i],

            position:
              i + 1,
          });

        if (error) {
          throw error;
        }
      }
    }
  }

  // ==========================================================
  // PRODUTO COM VARIAÇÕES
  // ==========================================================

  else {
    if (
      processedVariants.length >
      0
    ) {
      for (const variant of processedVariants) {
        const {
          error: varErr,
        } = await supabase
          .from(
            "product_variants",
          )
          .insert({
            product_id:
              savedProductId,

            name:
              variant.name,

            material:
              variant.material ||
              null,

            is_principal:
              variant.is_principal,

            imagens:
              variant.imagens,
          });

        if (varErr) {
          throw varErr;
        }
      }
    }
  }

  return savedProductId;
}

// ============================================================
// PEDIDOS
// ============================================================

/**
 * Atualiza o status operacional do pedido.
 *
 * Exemplos:
 * - Aguardando confirmação
 * - Em preparação
 * - Pronto para retirada
 * - Saiu para entrega
 * - Entregue
 * - Cancelado
 */
export async function updateOrderStatusService(
  id: string,
  status: string,
) {
  const { error } =
    await supabase
      .from("orders")
      .update({
        status,
      })
      .eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Atualiza somente o pagamento.
 *
 * pending = ainda não pago
 * paid    = pago
 */
export async function updatePaymentStatusService(
  id: string,
  paymentStatus: string,
) {
  const normalizedStatus = String(
    paymentStatus ?? "",
  )
    .trim()
    .toLowerCase();

  const statusMap: Record<string, string> = {
    pending: "pending",
    pendente: "pending",
    paid: "paid",
    pago: "paid",
  };

  const finalStatus =
    statusMap[normalizedStatus];

  if (!finalStatus) {
    throw new Error(
      "Status de pagamento inválido.",
    );
  }

  const { error } =
    await supabase
      .from("orders")
      .update({
        payment_status: finalStatus,
      })
      .eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Atualiza o status de reembolso.
 */
export async function updateRefundStatusService(
  id: string,
  refund_status: string,
) {
  const { error } =
    await supabase
      .from("orders")
      .update({
        refund_status,
      })
      .eq("id", id);

  if (error) {
    throw error;
  }
}

// ============================================================
// PRODUTO ATIVO / INATIVO
// ============================================================

export async function toggleProductActiveService(
  id: string,
  currentStatus: boolean,
) {
  const { error } =
    await supabase
      .from("products")
      .update({
        ativo: !currentStatus,
      })
      .eq("id", id);

  if (error) {
    throw new Error(
      error.message,
    );
  }
}
