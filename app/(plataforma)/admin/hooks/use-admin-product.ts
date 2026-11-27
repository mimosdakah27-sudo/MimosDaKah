"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { revalidateProductById, revalidateProductImages, revalidateProductsList, revalidateProductVariants } from "@/lib/actions/revalidate";

import type {
  FormDataState,
  LocalProductImage,
  ProductRow,
} from "../types/admin-types";

import {
  fetchProductVariantsAndGuides,
  fetchExtraImages,
  saveProductWithGallery,
} from "../services/admin-service";

export function useAdminProduct(
  product?: ProductRow | null,
  onSaved?: () => void,
) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [uploading, setUploading] = useState(false);
  const [extraImages, setExtraImages] = useState<LocalProductImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [sizeGuideState, setSizeGuideState] = useState<any>(null);

  // Define o padrão inicial vazio para novos produtos usando 'name'
  const defaultVariants = [
    {
      name: "",
      material: "",
      is_principal: true,
      imagens: product?.imagem_url ? [product.imagem_url] : [],
    },
  ];

  const [variantsFormState, setVariantsFormState] = useState(defaultVariants);

  // Busca variantes, guia de tamanhos E as imagens extras (para produtos simples) em caso de edição
  const { data: dbRelations } = useQuery({
    queryKey: ["product-admin-relations", product?.id],
    queryFn: async () => {
      const [relationsRes, extraImagesRes] = await Promise.all([
        fetchProductVariantsAndGuides(product!.id),
        fetchExtraImages(product!.id),
      ]);
      return {
        variants: relationsRes.variants ?? [],
        sizeGuide: relationsRes.sizeGuide,
        extraImages: extraImagesRes ?? [],
      };
    },
    enabled: isEdit && !!product?.id,
    staleTime: Infinity,
  });

  // Atualiza o estado das variantes e imagens de forma inteligente quando os dados do banco chegam
  useEffect(() => {
    if (dbRelations) {
      if (dbRelations.variants && dbRelations.variants.length > 0) {
        // Se possui variações cadastradas
        const formattedVariants = dbRelations.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          material: v.material || "",
          is_principal: v.is_principal ?? false,
          imagens: Array.isArray(v.imagens) ? v.imagens : [],
        }));
        setVariantsFormState(formattedVariants);
      } else {
        // Se for um produto SIMPLES (sem variações), montamos a estrutura com base na tabela `product_images` e capa
        const extraUrls = dbRelations.extraImages.map((img: any) => img.url);
        
        // Garante que a capa principal venha primeiro caso exista e não esteja duplicada
        const allImages = product?.imagem_url
          ? [product.imagem_url, ...extraUrls.filter((u: string) => u !== product.imagem_url)]
          : extraUrls;

        setVariantsFormState([
          {
            name: "",
            material: "",
            is_principal: true,
            imagens: allImages.length > 0 ? allImages : (product?.imagem_url ? [product.imagem_url] : []),
          },
        ]);
      }

      if (dbRelations.sizeGuide) {
        setSizeGuideState(dbRelations.sizeGuide);
      }
    }
  }, [dbRelations, product?.imagem_url]);

  // No arquivo useAdminProduct.ts, dentro de initialValues:
  const initialValues: FormDataState = {
    nome: product?.nome ?? "",
    descricao: product?.descricao ?? "",
    preco: product?.preco ?? 0,
    preco_promocional: product?.preco_promocional ?? null,
    destaque: product?.destaque ?? false,
    ativo: product?.ativo ?? true,
    imagem_url: product?.imagem_url ?? "",

    weight: Number(product?.weight) || 0,
    width: Number(product?.width) || 0,
    height: Number(product?.height) || 0,
    length: Number(product?.length) || 0,

    tipo_venda: (product as any)?.tipo_venda ?? "normal", // <-- ADICIONADO AQUI

    permite_retirada: product?.permite_retirada ?? false,
    garantia_tipo: (product?.garantia_tipo as "vendedor" | "fabrica" | "nenhuma") ?? "vendedor",
    garantia_dias: product?.garantia_dias ?? 0,

    videos: product?.video_urls ?? [],
    variants: variantsFormState as any,
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: { form: FormDataState }): Promise<string> => {
      return await saveProductWithGallery({
        form: payload.form,
        productId: product?.id,
        localExtraImages: extraImages,
        imagesToDelete,
        sizeGuideData: sizeGuideState,
      });
    },
    onSuccess: async (finalId: string) => {
      await revalidateProductById(finalId);
      await revalidateProductImages(finalId);
      await revalidateProductVariants(finalId);
      await revalidateProductsList();
      toast.success(
        isEdit ? "Catálogo atualizado com sucesso." : "Novo item registrado com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      queryClient.invalidateQueries({ queryKey: ["product-admin-relations", finalId] });
      if (onSaved) onSaved();
    },
    onError: (err: any) =>
      toast.error(err.message || "Falha ao gravar alterações."),
  });

  const handleSaveSubmit = (submittedData: FormDataState) => {
    saveMutation.mutate({ form: submittedData });
  };

  return {
    initialValues,
    saving: saveMutation.isPending,
    uploading,
    isEdit,
    sizeGuideState,
    setSizeGuideState,
    handleSaveSubmit,
  };
}