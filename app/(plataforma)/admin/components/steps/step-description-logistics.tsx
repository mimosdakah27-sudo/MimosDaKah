"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn, maskDecimal } from "@/lib/utils";

export function StepDescriptionLogistics() {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  const logisticsFields = [
    { name: "weight", label: "Peso (kg)" },
    { name: "width", label: "Largura (cm)" },
    { name: "height", label: "Altura (cm)" },
    { name: "length", label: "Comprimento (cm)" },
  ];

  const rawWeight = watch("weight");
  const currentWeight = Number(String(rawWeight || "").replace(",", ".")) || 0;

  const getWeightFeedback = (val: number) => {
    if (val <= 0) return null;
    if (val < 1) {
      const grams = Math.round(val * 1000);
      return `= ${grams}g`;
    }
    return `= ${val}kg`;
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <div className="space-y-1">
        <Label htmlFor="product-description" className="text-sm font-medium text-brand-ink">
          Descrição detalhada e orientações de personalização
        </Label>
        <Textarea id="product-description"
          placeholder="Descreva os materiais, dimensões da área de estampa, cuidados com o mimo, prazos ou como o cliente deve enviar a arte/foto..."
          {...register("descricao")}
          className={cn("min-h-28", errors.descricao && "border-destructive")}
        />
        {errors.descricao && <span className="text-xs text-destructive block">{String(errors.descricao.message)}</span>}
      </div>

      <div className="space-y-2 pt-1">
        <Label className="text-sm font-medium text-brand-ink block">
          Peso e dimensões da embalagem (Cálculo de frete / Melhor Envio)
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {logisticsFields.map((field) => {
            const fieldError = errors[field.name as keyof typeof errors];
            const fieldValue = watch(field.name);
            const isWeight = field.name === "weight";

            return (
              <div key={field.name} className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <Label htmlFor={field.name} className="text-sm font-medium text-brand-ink">
                    {field.label}
                  </Label>
                  {isWeight && currentWeight > 0 && (
                    <span className="text-xs font-medium text-primary animate-fade-in shrink-0 whitespace-nowrap">
                      {getWeightFeedback(currentWeight)}
                    </span>
                  )}
                </div>
                <Input
                  id={field.name}
                  type="text"
                  placeholder={isWeight ? "Ex: 0.3" : "0"}
                  value={fieldValue ?? ""}
                  onChange={(e) => {
                    const masked = maskDecimal(e.target.value);
                    setValue(field.name, masked, { shouldValidate: true });
                  }}
                  className={cn("text-base sm:text-sm px-2.5", fieldError && "border-destructive")}
                />
                {fieldError && <span className="text-xs text-destructive block">{String(fieldError.message)}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}