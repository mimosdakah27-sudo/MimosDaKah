"use client";

import { Image as ImageIcon, Layers, Plus, Star, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { ProductVariantState } from "../../types/admin-types";

export function StepVariants() {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  
  const { fields, remove, append, replace, update } = useFieldArray({
    control,
    name: "variants",
  });

  const variants = (watch("variants") || []) as ProductVariantState[];
  const singleImage = watch("imagem_url") || "";

  // O modo é controlado explicitamente pelo usuário, inicializado uma única vez com base nos dados iniciais
  const [mode, setMode] = useState<"single" | "variants">(() => {
    const currentVariants = watch("variants") || [];
    const hasMultiple = currentVariants.length > 1;
    const hasNamedVariant =
      currentVariants.length === 1 &&
      currentVariants[0]?.name &&
      currentVariants[0].name.trim() !== "";
    return hasMultiple || hasNamedVariant ? "variants" : "single";
  });

  const handleSwitchMode = (newMode: "single" | "variants") => {
    setMode(newMode);
    
    if (newMode === "single") {
      const existingImages =
        variants[0]?.imagens || (singleImage ? [singleImage] : []);
      replace([
        {
          name: "",
          material: "",
          is_principal: true,
          imagens: existingImages,
        },
      ]);
      if (existingImages.length > 0) {
        const first = existingImages[0];
        const url = typeof first === "string" ? first : first?.url;
        setValue("imagem_url", url || "", { shouldValidate: true });
      }
    } else {
      // Se mudar para variants e não houver nenhuma variação criada ainda, cria a primeira vazia
      if (fields.length === 0) {
        replace([
          {
            name: "",
            material: "",
            is_principal: true,
            imagens: variants[0]?.imagens || (singleImage ? [singleImage] : []),
          },
        ]);
      }
    }
  };

  const handleAddVariant = () => {
    const isFirst = fields.length === 0;
    append({
      name: "",
      material: "",
      is_principal: isFirst,
      imagens: [],
    });
  };

  const handleSetPrincipal = (selectedIndex: number) => {
    fields.forEach((field, idx) => {
      const isTarget = idx === selectedIndex;
      const currentVariantData = variants[idx] || field;

      update(idx, {
        ...currentVariantData,
        is_principal: isTarget,
      });

      if (isTarget) {
        const targetImages = currentVariantData.imagens || [];
        const firstImg =
          targetImages.length > 0
            ? typeof targetImages[0] === "string"
              ? targetImages[0]
              : targetImages[0]?.url
            : "";
        setValue("imagem_url", firstImg || "", { shouldValidate: true });
      }
    });
  };

  const handleImageUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newLocalImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file: file,
      isNew: true,
    }));

    const currentVariantData = variants[index] || fields[index];
    const currentImages = currentVariantData?.imagens || [];
    const updatedImages = [...currentImages, ...newLocalImages];

    update(index, {
      ...currentVariantData,
      imagens: updatedImages,
    });

    const isPrincipalVariant =
      currentVariantData?.is_principal ||
      (index === 0 && variants.every((v) => !v.is_principal));
      
    if (isPrincipalVariant && updatedImages.length > 0) {
      const firstUrl =
        typeof updatedImages[0] === "string"
          ? updatedImages[0]
          : updatedImages[0].url;
      setValue("imagem_url", firstUrl, { shouldValidate: true });
    }
  };

  const handleRemoveImage = (variantIndex: number, imgIndex: number) => {
    const currentVariantData = variants[variantIndex] || fields[variantIndex];
    const currentImages = [...(currentVariantData?.imagens || [])];
    currentImages.splice(imgIndex, 1);

    update(variantIndex, {
      ...currentVariantData,
      imagens: currentImages,
    });

    const isPrincipalVariant = currentVariantData?.is_principal;
    if (isPrincipalVariant) {
      const newFirst = currentImages[0];
      const newCapaUrl = newFirst
        ? typeof newFirst === "string"
          ? newFirst
          : newFirst.url
        : "";
      setValue("imagem_url", newCapaUrl, { shouldValidate: true });
    }
  };

  const handleSetImageAsCover = (variantIndex: number, displayUrl: string, imgIndex: number) => {
    // Define a URL da imagem como capa principal do produto
    setValue("imagem_url", displayUrl, { shouldValidate: true });

    if (mode === "variants") {
      // Garante que a variação atual seja marcada como principal
      handleSetPrincipal(variantIndex);
    }

    // Opcional: reorganiza o array para que a imagem selecionada vire a primeira (índice 0)
    const currentVariantData = variants[variantIndex] || fields[variantIndex];
    const currentImages = [...(currentVariantData?.imagens || [])];
    if (imgIndex > 0) {
      const [selectedImg] = currentImages.splice(imgIndex, 1);
      currentImages.unshift(selectedImg);
      update(variantIndex, {
        ...currentVariantData,
        imagens: currentImages,
      });
    }
  };

  const variantError = errors?.variants as any;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSwitchMode("single")}
          className={cn(
            "flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-left gap-1.5",
            mode === "single"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-primary"
              : "border-border bg-card/50 text-muted-foreground hover:border-border/80",
          )}
        >
          <ImageIcon className="h-5 w-5 mb-0.5" />
          <span className="text-xs font-bold leading-tight">
            Produto Simples
          </span>
          <span className="text-xs text-muted-foreground font-normal text-center">
            Múltiplas fotos, sem variações
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode("variants")}
          className={cn(
            "flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-left gap-1.5",
            mode === "variants"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-primary"
              : "border-border bg-card/50 text-muted-foreground hover:border-border/80",
          )}
        >
          <Layers className="h-5 w-5 mb-0.5" />
          <span className="text-xs font-bold leading-tight">Com Variações</span>
          <span className="text-xs text-muted-foreground font-normal text-center">
            Cores, tamanhos ou materiais
          </span>
        </button>
      </div>

      {mode === "single" ? (
        <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-brand-ink block">
              Fotos do Produto (A 1ª foto será a capa)
            </Label>
            <div className="flex flex-wrap gap-2">
              {variants[0]?.imagens?.map((imgItem: any, imgIdx: number) => {
                const displayUrl =
                  typeof imgItem === "string" ? imgItem : imgItem?.url;

                return (
                  <div
                    key={imgIdx}
                    className="relative h-20 w-20 rounded-lg overflow-hidden border border-border group"
                  >
                    <img
                      src={displayUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {imgIdx === 0 && (
                      <span className="absolute bottom-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1 py-0.5 rounded shadow-xs">
                        CAPA
                      </span>
                    )}
                    
                    {/* Botões de Ação na Imagem */}
                    <div className="absolute top-0.5 right-0.5 flex flex-col gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(0, imgIdx)}
                        className="bg-destructive text-destructive-foreground p-1 rounded-full shadow-md hover:scale-105 transition-transform"
                        title="Excluir imagem"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetImageAsCover(0, displayUrl, imgIdx)}
                        className="bg-primary text-primary-foreground p-1 rounded-full shadow-md hover:scale-105 transition-transform"
                        title="Definir como capa"
                      >
                        <Star className="h-3 w-3 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <label className="h-20 w-20 rounded-lg border border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors bg-secondary/30">
                <Upload className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Adicionar foto</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(0, e)}
                />
              </label>
            </div>
            {((errors?.variants as any)?.[0]?.imagens || errors?.variants) &&
              (!variants[0]?.imagens || variants[0].imagens.length === 0) && (
                <span className="text-xs text-destructive block mt-1">
                  Adicione ao menos 1 foto principal do produto
                </span>
              )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const variantErr = variantError?.[index];
            const currentVar = variants[index] || field;
            const isCurrentPrincipal = Boolean(currentVar?.is_principal);

            return (
              <div
                key={field.id}
                className={cn(
                  "p-3 sm:p-4 rounded-xl border bg-card/50 space-y-3 relative transition-all",
                  isCurrentPrincipal
                    ? "border-primary ring-1 ring-primary/20"
                    : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-brand-ink">
                        Nome da Variação
                      </Label>
                      <Input
                        placeholder="Ex: Azul ou Tamanho G"
                        {...register(`variants.${index}.name`)}
                        className={cn(
                          "text-base sm:text-sm px-2.5",
                          variantErr?.name && "border-destructive",
                        )}
                      />
                      {variantErr?.name && (
                        <span className="text-xs text-destructive block">
                          {variantErr.name.message}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-brand-ink">
                        Material (Opcional)
                      </Label>
                      <Input
                        placeholder="Ex: Cotton / Leather"
                        {...register(`variants.${index}.material`)}
                        className="text-base sm:text-sm px-2.5"
                      />
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-lg shrink-0 -mr-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-0.5">
                  <input
                    type="radio"
                    name="variant_principal_selector"
                    id={`principal-${index}`}
                    checked={isCurrentPrincipal}
                    onChange={() => handleSetPrincipal(index)}
                    className="h-3.5 w-3.5 border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                  />
                  <Label
                    htmlFor={`principal-${index}`}
                    className="text-[11px] sm:text-xs font-semibold text-muted-foreground cursor-pointer select-none leading-tight"
                  >
                    Tornar a variação principal (capa do produto)
                  </Label>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-border/40">
                  <Label className="text-sm font-medium text-brand-ink block">
                    Fotos desta variação
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentVar?.imagens?.map(
                      (imgItem: any, imgIdx: number) => {
                        const displayUrl =
                          typeof imgItem === "string" ? imgItem : imgItem?.url;

                        return (
                          <div
                            key={imgIdx}
                            className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden border border-border group"
                          >
                            <img
                              src={displayUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            {imgIdx === 0 && isCurrentPrincipal && (
                              <span className="absolute bottom-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1 py-0.5 rounded shadow-xs">
                                CAPA
                              </span>
                            )}
                            
                            {/* Botões de Ação na Imagem da Variação */}
                            <div className="absolute top-0.5 right-0.5 flex flex-col gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index, imgIdx)}
                                className="bg-destructive text-destructive-foreground p-1 rounded-full shadow-md hover:scale-105 transition-transform"
                                title="Excluir imagem"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetImageAsCover(index, displayUrl, imgIdx)}
                                className="bg-primary text-primary-foreground p-1 rounded-full shadow-md hover:scale-105 transition-transform"
                                title="Definir como capa"
                              >
                                <Star className="h-3 w-3 fill-current" />
                              </button>
                            </div>
                          </div>
                        );
                      },
                    )}
                    <label className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg border border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors bg-secondary/30">
                      <Upload className="h-4 w-4 mb-0.5" />
                      <span className="text-[9px] font-medium">Foto</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(index, e)}
                      />
                    </label>
                  </div>
                  {variantErr?.imagens && (
                    <span className="text-xs text-destructive block">
                      {variantErr.imagens.message}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddVariant}
            className="w-full min-h-11 rounded-xl border-dashed border-border hover:border-primary text-xs font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar nova variação
          </Button>
        </div>
      )}
    </div>
  );
}