"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function StepBasicInfo() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <div className="space-y-1">
        <Label htmlFor="product-name" className="text-sm font-medium text-brand-ink">
          Nome do produto
        </Label>
        <Input id="product-name"
          placeholder="Ex: Caneca de Porcelana Personalizada com Foto" 
          {...register("nome")} 
          className={cn("text-base sm:text-sm", errors.nome && "border-destructive")}
        />
        {errors.nome && <span className="text-xs text-destructive block">{String(errors.nome.message)}</span>}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4 text-xs text-muted-foreground">
        Use um nome que ajude a encontrar o produto, como “Caneca com nome”. As fotos e variações entram na próxima etapa.
      </div>
    </div>
  );
}