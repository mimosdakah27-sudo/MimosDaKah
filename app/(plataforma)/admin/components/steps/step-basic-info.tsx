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
        <Label className="text-[10px] sm:text-xs uppercase text-muted-foreground font-semibold">
          Título do mimo / produto
        </Label>
        <Input 
          placeholder="Ex: Caneca de Porcelana Personalizada com Foto" 
          {...register("nome")} 
          className={cn("rounded-lg h-9 sm:h-10 text-xs", errors.nome && "border-destructive")} 
        />
        {errors.nome && <span className="text-[10px] text-destructive block">{String(errors.nome.message)}</span>}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4 text-xs text-muted-foreground">
        💡 <strong className="text-foreground">Dica para Mimos Personalizados:</strong> Defina um título claro que ajude o cliente a identificar o tipo de item (ex: *Camiseta Algodão Personalizada*, *Caneca Mágica*, *Azulejo Decorativo*). Você poderá configurar as variações de cores/temas na próxima etapa!
      </div>
    </div>
  );
}